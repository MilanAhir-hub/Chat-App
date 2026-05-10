import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
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
  VolumeMuteIcon,
  ArrowTurnBackwardIcon,
  Camera01Icon,
  Image01Icon,
  Add01Icon,
  ArrowDown01Icon,
  Clock01Icon,
  Tick02Icon,
  TickDouble02Icon
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
import { VideoCallPanel } from '../features/video-call/VideoCallPanel';
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
  const [isUploading, setIsUploading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [terminationNotice, setTerminationNotice] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isAtBottomRef = useRef(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
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

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
    setUnreadCount(0);
    setShowScrollButton(false);
    isAtBottomRef.current = true;
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // Buffer of 100px to consider "at bottom"
    const isBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    isAtBottomRef.current = isBottom;
    setShowScrollButton(!isBottom);
    
    if (isBottom) {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom('smooth');
    }
  }, [messages, notices, typingUsers, scrollToBottom]);

  const isImageMessage = useCallback((message: ChatMessage) => {
    const isImageFile = message.type === 'file' && (
      message.fileType?.startsWith('image/') || 
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(message.fileName || '')
    );
    
    // Check if it's a direct image link or Cloudinary URL in a text message
    const isImageUrl = message.type === 'text' && (
      /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(message.content) ||
      (message.content.includes('cloudinary.com') && /image\/upload/.test(message.content))
    );

    return isImageFile || isImageUrl;
  }, []);

  const scrollToMessage = (id: string) => {
    const element = document.getElementById(`msg-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a temporary subtle highlight like WhatsApp
      element.classList.add('bg-primary-500/20', 'dark:bg-primary-500/30', 'transition-colors', 'duration-500');
      setTimeout(() => {
        element.classList.remove('bg-primary-500/20', 'dark:bg-primary-500/30');
      }, 1500);
    }
  };

  const handleReply = (message: ChatMessage) => {
    setReplyingTo(message);
    textareaRef.current?.focus();
  };

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
        // Use joinRoom instead of getRoom to ensure the user is added to the 
        // room's member list in the database, even if they join via URL/Refresh.
        const joinResponse = await roomService.joinRoom(activeRoomId);
        const messagesResponse = await roomService.getMessages(activeRoomId);

        if (isMounted) {
          setRoom(joinResponse.room);
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
      if (notice.message.startsWith('INACTIVITY_TERMINATION:')) {
        const cleanMessage = notice.message.replace('INACTIVITY_TERMINATION:', '').trim();
        setTerminationNotice(cleanMessage);
        window.setTimeout(() => navigate('/dashboard'), 4000);
      } else {
        addNotice(notice);
        setError(notice.message);
        window.setTimeout(() => navigate('/dashboard'), 1300);
      }
    };

    const handleNewMessage = (message: ChatMessage) => {
      setMessages((current) => {
        if (message.tempId && current.some((m) => m.tempId === message.tempId)) {
          return current.map((m) => (m.tempId === message.tempId ? message : m));
        }
        if (current.some((m) => m.id === message.id)) {
          return current;
        }
        return [...current, message];
      });

      if (message.sender.id !== user.id) {
        socket.emit('message:delivered', { messageId: message.id });
        if (soundEnabledRef.current) {
          playNotificationSound();
        }
        
        // If user is not at bottom, show scroll button and increment unread
        if (!isAtBottomRef.current) {
          setUnreadCount(prev => prev + 1);
        }
      }
    };

    const handleUpdatedMessage = (message: ChatMessage) => {
      setMessages((current) =>
        current.map((item) => (item.id === message.id || (message.tempId && item.tempId === message.tempId) ? message : item))
      );
    };

    const handleTypingUpdate = (payload: {
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
    socket.on('typing:update', handleTypingUpdate);
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
      socket.off('typing:update', handleTypingUpdate);
      socket.off('socket:error', handleSocketError);
      socket.off('connect_error', handleConnectError);
      disconnectSocket();
    };
  }, [activeRoomId, addNotice, navigate, stopTyping, user]);

  // Seen detection logic
  useEffect(() => {
    if (!user || !messages.length) return;

    const unreadMessages = messages.filter(
      (m) => m.sender.id !== user.id && !m.seenBy.includes(user.id)
    );

    if (!unreadMessages.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.id.replace('msg-', '');
            const socket = getSocket();
            if (socket.connected) {
              socket.emit('message:seen', { messageId });
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    unreadMessages.forEach((m) => {
      const el = document.getElementById(`msg-${m.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [messages, user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
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
        // Delay closing slightly to allow any pending onClick to fire
        setTimeout(() => setActiveReactionMessageId(null), 0);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker, activeReactionMessageId]);

  // Handle click outside for attachment menu
  useEffect(() => {
    if (!showAttachmentMenu) return;
    const handleClick = () => setShowAttachmentMenu(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [showAttachmentMenu]);

  useEffect(() => {
    if (!showCamera) return;
    
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera access error:', err);
        setShowCamera(false);
      }
    };

    void startCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showCamera]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const mockEvent = {
          target: { files: [file] }
        } as unknown as ChangeEvent<HTMLInputElement>;
        
        void sendFile(mockEvent);
        setShowCamera(false);
      }
    }, 'image/jpeg', 0.85);
  };

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

  const sendMessage = (e?: FormEvent) => {
    e?.preventDefault();

    if (!messageText.trim() || !activeRoomId || !user) {
      return;
    }

    const cleanContent = messageText.trim();
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      roomId: activeRoomId,
      sender: { id: user.id, name: user.name },
      type: 'text',
      content: cleanContent,
      reactions: [],
      status: 'sending',
      deliveredTo: [],
      seenBy: [],
      tempId,
      replyTo: replyingTo ? {
        id: replyingTo.id,
        content: replyingTo.content,
        senderName: replyingTo.sender.name
      } : undefined,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageText('');
    setReplyingTo(null);
    stopTyping();
    setTimeout(() => scrollToBottom('smooth'), 50);

    getSocket().emit(
      'message:send',
      {
        roomId: activeRoomId,
        content: cleanContent,
        tempId,
        replyTo: optimisticMessage.replyTo
      },
      (response) => {
        if (!response.ok) {
          setError(response.message || 'Unable to send message.');
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
        } else {
          setMessages((prev) => 
            prev.map((m) => m.id === tempId ? response.data as ChatMessage : m)
          );
        }
      }
    );
  };

  const sendFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !activeRoomId || !user) {
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

      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: ChatMessage = {
        id: tempId,
        roomId: activeRoomId,
        sender: { id: user.id, name: user.name },
        type: 'file',
        content: dataUrl, // Local preview
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        reactions: [],
        status: 'sending',
        deliveredTo: [],
        seenBy: [],
        tempId,
        replyTo: replyingTo ? {
          id: replyingTo.id,
          content: replyingTo.content,
          senderName: replyingTo.sender.name
        } : undefined,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setReplyingTo(null);
      setTimeout(() => scrollToBottom('smooth'), 100);

      getSocket().emit(
        'file:send',
        {
          roomId: activeRoomId,
          dataUrl,
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size,
          tempId,
          replyTo: optimisticMessage.replyTo
        },
        (response) => {
          setIsUploading(false);
          if (!response.ok) {
            setError(response.message || 'Unable to share file.');
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
          } else {
            setMessages((prev) => 
              prev.map((m) => m.id === tempId ? response.data as ChatMessage : m)
            );
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
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/98 px-3 py-0 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/98 sm:px-6">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 sm:gap-4">

          {/* Left — identity */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowSidebar((prev) => !prev)}
              className="rounded-lg p-2 text-slate-500 transition-all duration-150 hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100 lg:hidden"
              title="Toggle Sidebar"
            >
              <HugeiconsIcon icon={Menu01Icon} size={20} />
            </button>

            <div className="flex flex-col justify-center">
              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-primary-600 dark:text-primary-400">
                Live Chat
              </p>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-extrabold tracking-widest text-slate-900 dark:text-white sm:text-lg">
                  {activeRoomId}
                </h1>
                <button
                  type="button"
                  onClick={copyRoomId}
                  className="rounded-md p-1 text-slate-400 transition-all duration-150 hover:bg-slate-100 hover:text-slate-700 active:scale-90 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                  title="Copy Room ID"
                >
                  <HugeiconsIcon icon={Copy01Icon} size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Right — actions */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <VideoCallPanel roomId={activeRoomId} currentUser={user} />

            <div className="mx-1 hidden h-5 w-px bg-slate-200 dark:bg-slate-700 lg:block" />

            <div className="hidden items-center gap-0.5 lg:flex">
              <ThemeSelector />
              <ThemeToggle />
            </div>

            <div className="mx-1 hidden h-5 w-px bg-slate-200 dark:bg-slate-700 sm:block" />

            <button
              type="button"
              onClick={() => setSoundEnabled((current) => !current)}
              className="hidden rounded-lg p-2 text-slate-500 transition-all duration-150 hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100 sm:block"
              title={soundEnabled ? 'Mute' : 'Unmute'}
            >
              <HugeiconsIcon icon={soundEnabled ? VolumeHighIcon : VolumeMuteIcon} size={20} />
            </button>

            {isCreator && (
              <button
                type="button"
                onClick={closeRoom}
                disabled={isClosing}
                className="rounded-lg p-2 text-red-500 transition-all duration-150 hover:bg-red-50 hover:text-red-600 active:scale-95 disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                title="Close Room"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={20} />
              </button>
            )}

            <button
              type="button"
              onClick={leaveRoom}
              className="ml-1 flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-150 hover:bg-slate-700 active:scale-95 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white sm:px-4 sm:text-sm"
            >
              <HugeiconsIcon icon={ArrowLeft02Icon} size={16} />
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

            {/* Mobile Settings in Sidebar */}
            <div className="mt-auto space-y-5 border-t border-slate-100 pt-6 dark:border-slate-800 lg:hidden">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Appearance
                </p>
              </div>
              
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/50">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold">Display Mode</p>
                  <p className="text-[10px] text-slate-500">Light or Dark</p>
                </div>
                <ThemeToggle />
              </div>

              <div className="space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/50">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold">Accent Color</p>
                  <p className="text-[10px] text-slate-500">Choose your vibe</p>
                </div>
                <ThemeSelector isInline />
              </div>
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

          <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
          >
            <div className="flex min-h-full flex-col justify-end px-4 py-6 space-y-6">
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
                    id={`msg-${message.id}`}
                    className={`flex animate-in fade-in slide-in-from-bottom-2 duration-300 ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`group relative max-w-[88%] sm:max-w-[75%] transition-opacity duration-300 ${isMine ? 'items-end' : 'items-start'
                        } ${message.status === 'sending' ? 'opacity-70' : 'opacity-100'}`}
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
                        className={`relative rounded-2xl shadow-sm ${isMine
                          ? 'rounded-tr-none bg-primary-600 text-white'
                          : 'rounded-tl-none bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-white'
                          } ${isImageMessage(message) ? 'p-1.5' : 'px-3 py-1.5 pb-2'}`}
                      >
                        <div className="flex flex-col relative">
                        {/* Reply Display */}
                        {message.replyTo && (
                          <div 
                            onClick={() => message.replyTo && scrollToMessage(message.replyTo.id)}
                            className={`mb-2 cursor-pointer rounded-xl border-l-[4px] border-primary-500 bg-black/10 p-2.5 text-[11px] leading-tight transition-all hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 ${isMine ? 'bg-black/15 text-white/90' : 'text-slate-600 dark:text-slate-300'}`}
                          >
                            <p className="font-extrabold text-primary-600 dark:text-primary-400 mb-0.5">
                              {message.replyTo.senderName}
                            </p>
                            <div className="flex items-center gap-1.5 opacity-90">
                              {(message.replyTo.content.includes('cloudinary.com') || /\.(jpg|jpeg|png|gif|webp|svg)/i.test(message.replyTo.content)) ? (
                                <>
                                  <HugeiconsIcon icon={Image01Icon} size={14} />
                                  <span className="text-[11px] italic">Photo</span>
                                </>
                              ) : (
                                <p className="truncate line-clamp-2 italic text-[11px]">
                                  {message.replyTo.content}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        {/* Desktop Reaction Trigger */}
                        <div className={`absolute top-1/2 -translate-y-1/2 hidden lg:flex opacity-0 group-hover:opacity-100 transition-all duration-300 ${isMine ? '-left-20' : '-right-20'} items-center gap-1`}>
                          <button
                            type="button"
                            onClick={() => setActiveReactionMessageId(message.id)}
                            className="rounded-full bg-white/80 p-2 text-slate-500 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-primary-600 hover:scale-110 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-primary-400"
                            title="React"
                          >
                            <HugeiconsIcon icon={SmileIcon} size={20} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReply(message)}
                            className="rounded-full bg-white/80 p-2 text-slate-500 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-primary-600 hover:scale-110 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-primary-400"
                            title="Reply"
                          >
                            <HugeiconsIcon icon={ArrowTurnBackwardIcon} size={20} />
                          </button>
                        </div>

                        {/* Mobile Actions */}
                        <div className="absolute right-0 top-0 flex -translate-y-full items-center gap-1 opacity-0 transition-opacity group-active:opacity-100 lg:hidden">
                          <button
                            type="button"
                            onClick={() => handleReply(message)}
                            className="rounded-full bg-slate-900/50 p-1.5 text-white backdrop-blur-sm"
                          >
                            <HugeiconsIcon icon={ArrowTurnBackwardIcon} size={14} />
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
                                    e.preventDefault();
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

                        {isImageMessage(message) ? (
                          <div 
                            onClick={() => setFullscreenImage(message.content)}
                            className="relative cursor-pointer overflow-hidden rounded-xl bg-black/5 dark:bg-white/5 group/media mb-1"
                          >
                            <img 
                              src={message.content} 
                              alt={message.fileName || 'Image'}
                              className="max-h-[400px] w-full min-w-[200px] object-cover transition-all duration-500 group-hover/media:scale-105"
                              loading="lazy"
                            />
                            {message.status === 'sending' && (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] text-white">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white mb-2" />
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Uploading</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/0 transition-colors group-hover/media:bg-black/10" />
                          </div>
                        ) : message.type === 'file' ? (
                          <a
                            href={message.content}
                            download={message.fileName}
                            className="flex items-center gap-3 rounded-xl border border-white/20 bg-black/5 p-3 text-sm font-medium transition hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 mb-1"
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400">
                              <HugeiconsIcon icon={ImageAdd01Icon} size={20} />
                            </div>
                            <div className="overflow-hidden">
                              <p className="truncate font-bold">{message.fileName || 'Shared file'}</p>
                              <p className="text-[10px] opacity-70 uppercase font-black tracking-wider">{formatFileSize(message.fileSize)}</p>
                            </div>
                          </a>
                        ) : (
                          <p className="inline whitespace-pre-wrap break-words text-[15px] leading-relaxed sm:text-[16px]">
                            {message.content}
                            <span className="inline-block w-20" />
                          </p>
                        )}

                        <div className={`absolute bottom-0.5 right-1.5 flex items-center gap-1 ${isMine ? 'text-primary-100/80' : 'text-slate-400'}`}>
                          <div className="mt-1 flex items-center justify-end gap-1 px-1">
                            <span className="text-[9px] font-medium opacity-60">
                              {formatTime(message.createdAt)}
                            </span>
                            {isMine && (
                              <div className="flex transition-all duration-300">
                                <HugeiconsIcon
                                  icon={
                                    message.status === 'sending'
                                      ? Clock01Icon
                                      : message.status === 'sent'
                                      ? Tick02Icon
                                      : TickDouble02Icon
                                  }
                                  size={16}
                                  className={`
                                    ${message.status === 'seen' ? 'text-sky-400' : 'text-white'}
                                    ${message.status === 'sending' ? 'animate-pulse' : ''}
                                  `}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        </div>

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
          </div>

          {/* Scroll to Bottom FAB */}
          {showScrollButton && (
            <button
              onClick={() => scrollToBottom('smooth')}
              className="absolute bottom-24 right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-xl transition-all hover:bg-slate-50 hover:scale-110 active:scale-95 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 animate-in fade-in slide-in-from-bottom-4"
            >
              <HugeiconsIcon icon={ArrowDown01Icon} size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-black text-white shadow-lg animate-bounce">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

          <form
            onSubmit={sendMessage}
            className="border-t border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-950 relative sm:p-4"
          >
            {/* Reply Preview */}
            {replyingTo && (
              <div className="mx-auto mb-3 flex max-w-7xl items-center gap-3 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-3 animate-in slide-in-from-bottom-2 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="h-10 w-1 rounded-full bg-primary-500" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold text-primary-600 dark:text-primary-400">
                    Replying to {replyingTo.sender.name}
                  </p>
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    {(replyingTo.content.includes('cloudinary.com') || isImageMessage(replyingTo)) ? (
                      <>
                        <HugeiconsIcon icon={Image01Icon} size={14} />
                        <span className="text-sm italic">Photo</span>
                      </>
                    ) : (
                      <p className="truncate text-sm">
                        {replyingTo.content}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={18} />
                </button>
              </div>
            )}

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

            <div className="mx-auto flex max-w-7xl items-end gap-2 sm:gap-3">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={sendFile}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={sendFile}
              />

              <div className="relative mb-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAttachmentMenu(!showAttachmentMenu);
                  }}
                  disabled={isUploading}
                  className={`rounded-full p-2.5 transition-all active:scale-90 ${
                    showAttachmentMenu 
                      ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30' 
                      : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                  title="Attachments"
                >
                  <HugeiconsIcon icon={Add01Icon} size={24} className={`transition-transform duration-300 ${showAttachmentMenu ? 'rotate-45' : ''}`} />
                </button>

                {showAttachmentMenu && (
                  <div 
                    className="absolute bottom-full left-0 mb-4 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-200 dark:border-slate-800 dark:bg-slate-900 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowAttachmentMenu(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
                        <HugeiconsIcon icon={Image01Icon} size={20} />
                      </div>
                      Device
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCamera(true);
                        setShowAttachmentMenu(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                        <HugeiconsIcon icon={Camera01Icon} size={20} />
                      </div>
                      Camera
                    </button>
                  </div>
                )}
              </div>
              
              <div className="relative flex-1 flex items-end bg-slate-100 dark:bg-slate-900 rounded-[28px] px-2 py-1 transition-all focus-within:ring-1 focus-within:ring-primary-500/50">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker((current) => !current)}
                  className={`flex-shrink-0 p-2.5 transition-all ${showEmojiPicker
                    ? 'text-primary-600'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  title="Emoji"
                >
                  <HugeiconsIcon icon={SmileIcon} size={24} />
                </button>

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
                  className="flex-1 max-h-48 min-h-[44px] w-full resize-none bg-transparent py-2.5 px-1 text-[16px] text-slate-950 outline-none placeholder:text-slate-500 dark:text-white dark:placeholder:text-slate-400 sm:text-[17px]"
                  placeholder={placeholder}
                />
              </div>

              <button
                type="submit"
                disabled={!messageText.trim()}
                onMouseDown={(e) => e.preventDefault()}
                className="flex-shrink-0 mb-0.5 rounded-full bg-primary-600 p-3 text-white shadow-lg shadow-primary-600/20 transition-all hover:bg-primary-500 hover:scale-105 active:scale-95 disabled:bg-slate-300 disabled:shadow-none dark:disabled:bg-slate-800"
              >
                <HugeiconsIcon icon={SentIcon} size={26} />
              </button>
            </div>
          </form>
        </section>
      </section>
      {/* Camera Interface */}
      {showCamera && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black animate-in fade-in duration-300">
          <div className="flex items-center justify-between p-4">
            <button 
              onClick={() => setShowCamera(false)}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={24} />
            </button>
            <span className="font-semibold text-white">Camera</span>
            <div className="w-10" /> {/* Spacer */}
          </div>

          <div className="relative flex-1 overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="h-full w-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="flex flex-col items-center justify-center bg-black/40 p-8 pb-12 backdrop-blur-md">
            <button
              onClick={handleCapture}
              className="h-20 w-20 rounded-full border-4 border-white p-1 transition-transform active:scale-90"
            >
              <div className="h-full w-full rounded-full bg-white transition-opacity hover:opacity-90" />
            </button>
            <p className="mt-4 text-sm font-medium text-white/60">Click to take picture</p>
          </div>
        </div>
      )}
      {/* Inactivity Termination Modal */}
      {terminationNotice && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl dark:bg-slate-900 animate-in zoom-in-95 duration-300">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <HugeiconsIcon icon={Cancel01Icon} size={40} />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-slate-950 dark:text-white">Room Terminated</h2>
            <p className="mb-8 text-slate-600 dark:text-slate-400">
              {terminationNotice}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full rounded-2xl bg-slate-950 py-4 text-sm font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              Close and Go Back
            </button>
            <p className="mt-4 text-[10px] uppercase tracking-widest text-slate-400">
              Redirecting in 4 seconds...
            </p>
          </div>
        </div>
      )}
      {/* Fullscreen Media Viewer */}
      {fullscreenImage && createPortal(
        <div 
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300"
          onClick={() => setFullscreenImage(null)}
        >
          <button 
            className="absolute top-6 right-6 z-[1001] rounded-full bg-white/10 p-3 text-white transition-all hover:bg-white/20 active:scale-95"
            onClick={() => setFullscreenImage(null)}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={24} />
          </button>
          
          <div className="relative h-full w-full flex items-center justify-center p-4 sm:p-12">
            <img 
              src={fullscreenImage} 
              alt="Fullscreen Preview" 
              className="max-h-full max-w-full rounded-lg object-contain shadow-2xl animate-in zoom-in-95 duration-300 cursor-zoom-out"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] pointer-events-none">
            Click anywhere to close
          </div>
        </div>,
        document.body
      )}
    </main>
  );
};
