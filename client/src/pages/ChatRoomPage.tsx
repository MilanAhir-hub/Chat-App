import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft02Icon,
  Cancel01Icon,
  Copy01Icon,
  SmileIcon,
  ImageAdd01Icon,
  Menu01Icon,
  SentIcon,
  UserGroupIcon,
  VolumeHighIcon,
  VolumeMuteIcon
} from '@hugeicons/core-free-icons';
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { ThemeSelector } from '../components/ThemeSelector';
import { Loader } from '../components/Loader';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../services/http';
import { roomService } from '../services/room.service';
import {
  connectSocket,
  disconnectSocket,
  getSocket,
  type AppSocket,
} from '../socket/socket';
import type { ChatMessage, Room, RoomNotice } from '../types';
import {
  formatFileSize,
  MAX_UPLOAD_BYTES,
  readFileAsDataUrl,
} from '../utils/file';
import { playNotificationSound } from '../utils/sound';

const reactionOptions = [0x1f44d, 0x2764, 0x1f602, 0x1f525, 0x1f389].map(
  (codePoint) => String.fromCodePoint(codePoint)
);

const formatTime = (dateValue: string) =>
  new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateValue));

const replaceMessage = (messages: ChatMessage[], nextMessage: ChatMessage) =>
  messages.map((message) =>
    message.id === nextMessage.id ? nextMessage : message
  );

export const ChatRoomPage = () => {
  const { roomId } = useParams();
  const activeRoomId = useMemo(() => (roomId || '').toUpperCase(), [roomId]);
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [notices, setNotices] = useState<RoomNotice[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const reactionPickerRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const soundEnabledRef = useRef(soundEnabled);

  // Typing placeholder logic
  const [placeholder, setPlaceholder] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const placeholders = useMemo(() => [
    'Say something...',
    'Type a message...',
    'Share your thoughts...',
    'Join the conversation...',
    'Send an emoji...',
    'Share a file...'
  ], []);

  useEffect(() => {
    const currentFullText = placeholders[placeholderIndex];
    const typingSpeed = isDeleting ? 50 : 100;
    const nextCharIndex = isDeleting ? placeholder.length - 1 : placeholder.length + 1;

    const timeout = window.setTimeout(() => {
      // Pause animation if user is typing or there is text in the input
      if (messageText.length > 0) {
        return;
      }

      if (!isDeleting && placeholder.length === currentFullText.length) {
        // Pause at the end
        window.setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && placeholder.length === 0) {
        // Move to next placeholder
        setIsDeleting(false);
        setPlaceholderIndex((current) => (current + 1) % placeholders.length);
      } else {
        setPlaceholder(currentFullText.substring(0, nextCharIndex));
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [placeholder, isDeleting, placeholderIndex, placeholders]);

  const isCreator = Boolean(room && user && room.createdBy.id === user.id);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, notices, typingUsers]);

  const addNotice = useCallback((notice: RoomNotice) => {
    setNotices((current) => [...current.slice(-9), notice]);
  }, []);

  const stopTyping = useCallback(() => {
    if (!activeRoomId) {
      return;
    }

    const socket = getSocket();
    socket.emit('typing:stop', { roomId: activeRoomId });

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [activeRoomId]);

  useEffect(() => {
    let isMounted = true;

    const loadRoom = async () => {
      if (!activeRoomId) {
        setError('Missing room ID.');
        setIsLoading(false);
        return;
      }

      try {
        const [roomResponse, messagesResponse] = await Promise.all([
          roomService.getRoom(activeRoomId),
          roomService.getMessages(activeRoomId),
        ]);

        if (isMounted) {
          setRoom(roomResponse);
          setMessages(messagesResponse);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadRoom();

    return () => {
      isMounted = false;
    };
  }, [activeRoomId]);

  useEffect(() => {
    if (!user || !activeRoomId) {
      return;
    }

    const socket: AppSocket = connectSocket();

    const handleRoomState = (nextRoom: Room) => {
      setRoom(nextRoom);
    };

    const handleNotice = (notice: RoomNotice) => {
      addNotice(notice);
    };

    const handleClosed = (notice: RoomNotice & { roomId: string }) => {
      addNotice(notice);
      setError(notice.message);
      window.setTimeout(() => navigate('/dashboard'), 1300);
    };

    const handleNewMessage = (message: ChatMessage) => {
      setMessages((current) =>
        current.some((item) => item.id === message.id)
          ? current
          : [...current, message]
      );

      if (message.sender.id !== user.id && soundEnabledRef.current) {
        playNotificationSound();
      }
    };

    const handleUpdatedMessage = (message: ChatMessage) => {
      setMessages((current) => replaceMessage(current, message));
    };

    const handleTyping = (payload: {
      userId: string;
      name: string;
      isTyping: boolean;
    }) => {
      setTypingUsers((current) => {
        const next = { ...current };

        if (payload.isTyping) {
          next[payload.userId] = payload.name;
        } else {
          delete next[payload.userId];
        }

        return next;
      });
    };

    const handleSocketError = (payload: { message: string }) => {
      setError(payload.message);
    };

    const handleConnectError = (connectError: Error) => {
      setError(connectError.message);
    };

    socket.on('room:state', handleRoomState);
    socket.on('room:notice', handleNotice);
    socket.on('room:closed', handleClosed);
    socket.on('message:new', handleNewMessage);
    socket.on('message:updated', handleUpdatedMessage);
    socket.on('typing:update', handleTyping);
    socket.on('socket:error', handleSocketError);
    socket.on('connect_error', handleConnectError);

    socket.emit('room:join', { roomId: activeRoomId }, (response) => {
      if (!response.ok && response.message) {
        setError(response.message);
      }
    });

    return () => {
      stopTyping();
      socket.off('room:state', handleRoomState);
      socket.off('room:notice', handleNotice);
      socket.off('room:closed', handleClosed);
      socket.off('message:new', handleNewMessage);
      socket.off('message:updated', handleUpdatedMessage);
      socket.off('typing:update', handleTyping);
      socket.off('socket:error', handleSocketError);
      socket.off('connect_error', handleConnectError);
      disconnectSocket();
    };
  }, [activeRoomId, addNotice, navigate, stopTyping, user]);

  useEffect(() => {
    const handleClickOutside = (event: PointerEvent) => {
      // Check emoji picker
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        // Only close if it's not the trigger button
        const isTrigger = (event.target as HTMLElement).closest('button')?.title === 'Emoji';
        if (!isTrigger) {
          setShowEmojiPicker(false);
        }
      }

      // Check reaction picker
      if (
        activeReactionMessageId &&
        reactionPickerRef.current &&
        !reactionPickerRef.current.contains(event.target as Node)
      ) {
        setActiveReactionMessageId(null);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [showEmojiPicker, activeReactionMessageId]);

  const handleMessageChange = (value: string) => {
    setMessageText(value);

    if (!activeRoomId || !value.trim()) {
      stopTyping();
      return;
    }

    const socket = getSocket();
    socket.emit('typing:start', { roomId: activeRoomId });

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(stopTyping, 900);
  };

  const sendMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!messageText.trim() || !activeRoomId) {
      return;
    }

    setIsSending(true);
    setError('');

    getSocket().emit(
      'message:send',
      { roomId: activeRoomId, content: messageText },
      (response) => {
        setIsSending(false);

        if (!response.ok) {
          setError(response.message || 'Unable to send message.');
          return;
        }

        setMessageText('');
        stopTyping();
        // Re-focus the textarea to keep the keyboard open on mobile
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 10);
      }
    );
  };

  const sendFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !activeRoomId) {
      return;
    }

    setError('');

    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`File must be ${formatFileSize(MAX_UPLOAD_BYTES)} or smaller.`);
      event.target.value = '';
      return;
    }

    setIsUploading(true);

    try {
      const dataUrl = await readFileAsDataUrl(file);

      getSocket().emit(
        'file:send',
        {
          roomId: activeRoomId,
          dataUrl,
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size,
        },
        (response) => {
          if (!response.ok) {
            setError(response.message || 'Unable to share file.');
          }
        }
      );
    } catch (fileError) {
      setError(fileError instanceof Error ? fileError.message : 'Upload failed.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const leaveRoom = async () => {
    if (!activeRoomId) {
      navigate('/dashboard');
      return;
    }

    const socket = getSocket();

    if (socket.connected) {
      socket.emit('room:leave', { roomId: activeRoomId }, () => {
        disconnectSocket();
        navigate('/dashboard');
      });
      return;
    }

    await roomService.leaveRoom(activeRoomId);
    navigate('/dashboard');
  };

  const closeRoom = async () => {
    if (!activeRoomId || !window.confirm('Close this room for everyone?')) {
      return;
    }

    setIsClosing(true);
    setError('');

    try {
      await roomService.closeRoom(activeRoomId);
      navigate('/dashboard');
    } catch (closeError) {
      setError(getErrorMessage(closeError));
    } finally {
      setIsClosing(false);
    }
  };

  const copyRoomId = async () => {
    await navigator.clipboard.writeText(activeRoomId);
    addNotice({
      type: 'joined',
      message: 'Room ID copied.',
      createdAt: new Date().toISOString(),
    });
  };

  const toggleReaction = (messageId: string, emoji: string) => {
    getSocket().emit('message:react', { messageId, emoji }, (response) => {
      if (!response.ok) {
        setError(response.message || 'Unable to update reaction.');
      }
    });
  };

  const handleTouchStart = (messageId: string) => {
    longPressTimerRef.current = window.setTimeout(() => {
      setActiveReactionMessageId(messageId);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const typingNames = Object.values(typingUsers);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <main className="fixed inset-0 flex flex-col bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white overflow-hidden">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-3 py-2.5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:px-4 sm:py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowSidebar((prev) => !prev)}
              className="rounded-full p-2 transition hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
              title="Toggle Sidebar"
            >
              <HugeiconsIcon icon={Menu01Icon} size={20} />
            </button>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-700 dark:text-primary-300">
                Live Chat
              </p>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-widest sm:text-xl">
                  {activeRoomId}
                </h1>
                <button
                  type="button"
                  onClick={copyRoomId}
                  className="rounded-full p-1 text-slate-400 transition hover:text-slate-950 dark:hover:text-white"
                  title="Copy Room ID"
                >
                  <HugeiconsIcon icon={Copy01Icon} size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeSelector />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setSoundEnabled((current) => !current)}
              className="hidden rounded-full p-2 transition hover:bg-slate-100 dark:hover:bg-slate-800 sm:block"
              title={soundEnabled ? 'Mute' : 'Unmute'}
            >
              <HugeiconsIcon icon={soundEnabled ? VolumeHighIcon : VolumeMuteIcon} size={20} />
            </button>
            {isCreator && (
              <button
                type="button"
                onClick={closeRoom}
                disabled={isClosing}
                className="rounded-full p-2 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                title="Close Room"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={20} />
              </button>
            )}
            <button
              type="button"
              onClick={leaveRoom}
              className="flex items-center gap-2 rounded-full bg-slate-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 sm:px-4 sm:text-sm"
            >
              <HugeiconsIcon icon={ArrowLeft02Icon} size={18} />
              <span className="hidden sm:inline">Leave</span>
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-7xl flex-1 overflow-hidden lg:gap-4 lg:p-4">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-30 w-72 transform border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-950 lg:static lg:block lg:w-72 lg:translate-x-0 lg:rounded-lg lg:border
            ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex h-full flex-col p-5">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                <HugeiconsIcon icon={UserGroupIcon} size={18} />
                Online ({room?.users.length || 0})
              </h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="lg:hidden"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={20} />
              </button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto">
              {room?.users.map((roomUser) => (
                <div
                  key={roomUser.id}
                  className={`flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800/50 ${roomUser.id === user?.id ? 'bg-slate-50 dark:bg-slate-900' : ''
                    }`}
                >
                  <span className="truncate text-sm font-semibold">
                    {roomUser.name} {roomUser.id === user?.id && '(You)'}
                  </span>
                  {room.createdBy.id === roomUser.id && (
                    <span className="rounded-md bg-primary-100 px-1.5 py-0.5 text-[10px] font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                      Owner
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {showSidebar && (
          <div
            className="fixed inset-0 z-20 bg-slate-950/50 backdrop-blur-sm lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Main Chat Area */}
        <section className="relative flex flex-1 flex-col overflow-hidden bg-white dark:bg-slate-900 lg:rounded-lg lg:border lg:border-slate-200 lg:dark:border-slate-800">
          <div className="chat-bg-gradient" />
          {error && (
            <div className="m-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
              <HugeiconsIcon icon={Cancel01Icon} size={18} />
              <p>{error}</p>
            </div>
          )}

          <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
            {notices.map((notice) => (
              <div
                key={`${notice.createdAt}-${notice.message}`}
                className="flex justify-center"
              >
                <span className="rounded-full bg-slate-100 px-4 py-1.5 text-center text-[10px] font-bold tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  {notice.message}
                </span>
              </div>
            ))}

            {messages.map((message) => {
              const isMine = message.sender.id === user?.id;

              return (
                <article
                  key={message.id}
                  className={`flex animate-in fade-in slide-in-from-bottom-2 duration-300 ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`group relative max-w-[88%] sm:max-w-[75%] ${isMine ? 'items-end' : 'items-start'
                      }`}
                  >
                    {!isMine && (
                      <p className="mb-1.5 ml-2 text-[10px] font-bold text-slate-400">
                        {message.sender.name}
                      </p>
                    )}
                    <div
                      onPointerDown={() => handleTouchStart(message.id)}
                      onPointerUp={handleTouchEnd}
                      onPointerLeave={handleTouchEnd}
                      className={`relative rounded-3xl px-4 py-3 shadow-sm ${isMine
                        ? 'rounded-tr-none bg-primary-600 text-white'
                        : 'rounded-tl-none bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white'
                        }`}
                    >
                      {/* Desktop Reaction Trigger */}
                      <div className={`absolute top-0 hidden lg:flex opacity-0 group-hover:opacity-100 transition-opacity ${isMine ? '-left-10' : '-right-10'}`}>
                        <button
                          type="button"
                          onClick={() => setActiveReactionMessageId(message.id)}
                          className="rounded-full bg-slate-100 p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                        >
                          <HugeiconsIcon icon={SmileIcon} size={18} />
                        </button>
                      </div>

                      {/* Floating Reaction Picker */}
                      {activeReactionMessageId === message.id && (
                        <div
                          ref={reactionPickerRef}
                          className={`absolute z-50 animate-in fade-in zoom-in duration-200 ${isMine ? 'right-0' : 'left-0'} bottom-full mb-2`}
                        >
                          <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                            {reactionOptions.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleReaction(message.id, emoji);
                                  setActiveReactionMessageId(null);
                                }}
                                className="rounded-full p-1.5 transition-all hover:scale-125 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                <span className="text-xl sm:text-2xl leading-none">{emoji}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {message.type === 'file' ? (
                        <a
                          href={message.content}
                          download={message.fileName}
                          className="flex items-center gap-3 rounded-lg border border-white/20 bg-black/5 p-3 text-sm font-medium transition hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10"
                        >
                          <HugeiconsIcon icon={ImageAdd01Icon} size={24} />
                          <div className="overflow-hidden">
                            <p className="truncate font-bold">{message.fileName || 'Shared file'}</p>
                            <p className="text-[10px] opacity-70">{formatFileSize(message.fileSize)}</p>
                          </div>
                        </a>
                      ) : (
                        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed sm:text-base">
                          {message.content}
                        </p>
                      )}

                      {/* Reaction Display Bubble */}
                      {message.reactions.length > 0 && message.reactions.some(r => r.count > 0) && (
                        <div className={`absolute -bottom-2 flex gap-0.5 ${isMine ? 'right-2' : 'left-2'}`}>
                          {message.reactions.filter(r => r.count > 0).map((r) => {
                            const reacted = r.userIds.includes(user?.id || '');
                            return (
                              <button
                                key={r.emoji}
                                onClick={() => toggleReaction(message.id, r.emoji)}
                                className={`flex items-center gap-1 rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold shadow-sm transition-all hover:scale-110 dark:border-slate-800 dark:bg-slate-900 ${reacted ? 'text-primary-600 ring-1 ring-primary-500' : 'text-slate-600 dark:text-slate-300'
                                  }`}
                              >
                                <span>{r.emoji}</span>
                                {r.count > 1 && <span>{r.count}</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <time className={`mt-1.5 block text-[10px] font-medium text-slate-400 ${isMine ? 'text-right mr-1' : 'ml-1'}`}>
                      {formatTime(message.createdAt)}
                    </time>
                  </div>
                </article>
              );
            })}

            {typingNames.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                </div>
                <p className="text-xs font-semibold text-slate-400">
                  {typingNames.length > 1 ? 'Multiple people are' : `${typingNames[0]} is`} typing...
                </p>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={sendMessage}
            className="border-t border-slate-100 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900 relative sm:p-4"
          >
            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-full left-2 mb-2 z-50 animate-in fade-in slide-in-from-bottom-4 sm:left-4 sm:right-auto w-fit"
              >
                <EmojiPicker
                  theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                  emojiStyle={EmojiStyle.APPLE}
                  onEmojiClick={(emojiData) => {
                    setMessageText((current) => current + emojiData.emoji);
                  }}
                />
              </div>
            )}

            <div className="flex items-end gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={sendFile}
              />
              <div className="flex shrink-0 gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((current) => !current)}
                  className={`rounded-full p-3 transition-all ${showEmojiPicker
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/30 dark:text-primary-400'
                    : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  title="Emoji"
                >
                  <HugeiconsIcon icon={SmileIcon} size={22} />
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="rounded-full p-3 text-slate-400 transition hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
                  title="Share File"
                >
                  <HugeiconsIcon icon={isUploading ? Cancel01Icon : ImageAdd01Icon} size={22} />
                </button>
              </div>

              <div className="relative flex-1 chat-input-wrapper">
                <div className="chat-input-inner relative flex items-end">
                  <textarea
                    ref={textareaRef}
                    value={messageText}
                    onChange={(event) => handleMessageChange(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                    rows={1}
                    className="max-h-32 w-full resize-none bg-transparent px-5 py-3.5 pr-14 text-sm text-slate-950 outline-none transition-all dark:text-white sm:text-base"
                    placeholder={placeholder}
                  />
                  <button
                    type="submit"
                    disabled={isSending || !messageText.trim()}
                    className="absolute bottom-1 right-1 rounded-full bg-primary-600 p-2.5 text-white shadow-lg shadow-primary-600/20 transition-all hover:bg-primary-500 hover:shadow-primary-500/40 disabled:bg-slate-300 disabled:shadow-none dark:disabled:bg-slate-800"
                  >
                    <HugeiconsIcon icon={SentIcon} size={20} />
                  </button>
                </div>
              </div>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
};
