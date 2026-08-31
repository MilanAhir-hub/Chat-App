import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';
import { GlassThemeToggle } from '../components/GlassThemeToggle';
import { Loader } from '../components/Loader';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, getErrorMessage } from '../services/http';
import {
  secureChatService,
  type SecureChatMessage,
  type SecureChat,
} from '../services/secureChat.service';
import { roomService } from '../services/room.service';
import {
  connectSecureSocket,
  disconnectSecureSocket,
  getSecureSocket,
  type SecureAppSocket,
} from '../socket/secureSocket';
import {
  formatFileSize,
  MAX_UPLOAD_BYTES,
  readFileAsDataUrl,
} from '../utils/file';
import { playNotificationSound } from '../utils/sound';
import { useSwipeReply } from '../hooks/useSwipeReply';
import { MaterialIcon } from '../components/MaterialIcon';
import { getThemePureColor } from '../config/themes';
import { AmbientGradient } from '../components/AmbientGradient';
import { triggerAmbientPulse } from '../hooks/useAmbientGradient';

const wallpapers = [
  { id: 'default', name: 'Default', url: '' },
  { id: 'wp1', name: 'Cool Cat', url: '/wallpaper1.png' },
  { id: 'wp2', name: 'Cute Bear', url: '/wallpaper2.png' },
  { id: 'wp3', name: 'Ghost Love', url: '/wallpaper3.png' },
  { id: 'wp4', name: 'Angry Birds', url: '/wallpaper4.png' },
  { id: 'wp5', name: 'Bear Hug', url: '/wallpaper5.png' },
  { id: 'wp6', name: 'Heart Teddy', url: '/wallpaper6.png' },
  { id: 'wp7', name: 'Glowing Teddy', url: '/wallpaper7.png' },
  { id: 'wp8', name: 'Light Doodle', url: '/wallpaper8.png' },
  { id: 'wp9', name: 'Dark Doodle', url: '/wallpaper9.jpg' },
  { id: 'wp10', name: 'Floral Fence', url: '/wallpaper10.jpg' },
  { id: 'wp11', name: 'Cat & Butterfly', url: '/wallpaper11.png' },
  { id: 'wp12', name: 'Glowing Flower', url: '/wallpaper12.png' },
  { id: 'wp13', name: 'Minimal Branch', url: '/wallpaper13.png' },
  { id: 'wp14', name: 'Vase & Shadows', url: '/wallpaper14.png' },
  { id: 'wp15', name: 'Flowers & Book', url: '/wallpaper15.png' },
];

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
});
const timeCache = new Map<string, string>();

const formatTime = (dateValue: string) => {
  const cached = timeCache.get(dateValue);
  if (cached !== undefined) return cached;

  const formatted = timeFormatter.format(new Date(dateValue));
  if (timeCache.size > 2000) timeCache.clear();
  timeCache.set(dateValue, formatted);
  return formatted;
};

const resolveMediaUrl = (url: string) => {
  if (!url.startsWith('/api/')) return url;
  return `${API_BASE_URL.replace(/\/api\/?$/, '')}${url}`;
};

const FLAG_REGEX = /^[\u{1F1E6}-\u{1F1FF}]{2}$/u;
const EMOJI_REGEX =
  /^(?:(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})(?:[\uFE00-\uFE0F]|[\u{1F3FB}-\u{1F3FF}])*)(?:\u200d(?:(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})(?:[\uFE00-\uFE0F]|[\u{1F3FB}-\u{1F3FF}])*))*$/u;
const singleEmojiCache = new Map<string, boolean>();

const isSingleEmoji = (str: string): boolean => {
  const trimmed = str.trim();
  const cached = singleEmojiCache.get(trimmed);
  if (cached !== undefined) return cached;

  const result = FLAG_REGEX.test(trimmed) || EMOJI_REGEX.test(trimmed);
  if (singleEmojiCache.size > 1000) singleEmojiCache.clear();
  singleEmojiCache.set(trimmed, result);
  return result;
};

const IMAGE_FILE_REGEX = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
const IMAGE_URL_REGEX = /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;

const isImageMessage = (message: SecureChatMessage): boolean => {
  return (
    (message.type === 'file' &&
      (message.fileType?.startsWith('image/') ||
        IMAGE_FILE_REGEX.test(message.fileName || ''))) ||
    (message.type === 'text' &&
      (IMAGE_URL_REGEX.test(message.content) ||
        (message.content.includes('cloudinary.com') &&
          /image\/upload/.test(message.content))))
  );
};

interface SwipeableMessageProps {
  isMine: boolean;
  onReply: () => void;
  children: React.ReactNode;
}

const SwipeableMessage = ({ isMine, onReply, children }: SwipeableMessageProps) => {
  const { wrapperRef, iconRef, onTouchStart, onTouchMove, onTouchEnd } =
    useSwipeReply({ onReply });

  return (
    <div
      className={`relative flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      <div
        ref={iconRef}
        style={{ opacity: 0, transform: 'scale(0.5)' }}
        className="pointer-events-none absolute left-[-36px] top-1/2 z-0 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--color-hover)] text-[var(--color-text-secondary)] will-change-transform"
      >
        <MaterialIcon icon="reply" size={16} />
      </div>

      <div ref={wrapperRef} className="relative z-10 w-fit will-change-transform">
        {children}
      </div>
    </div>
  );
};

interface SecureMessageBubbleProps {
  message: SecureChatMessage;
  isConsecutive: boolean;
  currentUserId: string;
  onReply: (message: SecureChatMessage) => void;
  onScrollToMessage: (id: string) => void;
  onOpenFullscreen: (url: string) => void;
}

const SecureMessageBubble = memo(function SecureMessageBubble({
  message,
  isConsecutive,
  currentUserId,
  onReply,
  onScrollToMessage,
  onOpenFullscreen,
}: SecureMessageBubbleProps) {
  const isMine = message.sender.id === currentUserId;
  const isEmojiOnly =
    message.type === 'text' && isSingleEmoji(message.content) && !message.replyTo;

  return (
    <article
      id={`msg-${message.id}`}
      className={`flex animate-in fade-in slide-in-from-bottom-2 duration-300 ${
        isMine ? 'justify-end' : 'justify-start'
      } ${isConsecutive ? 'mt-[3px]' : 'mt-4'}`}
    >
      <SwipeableMessage isMine={isMine} onReply={() => onReply(message)}>
        <div
          className={`group relative flex flex-col transition-opacity duration-300 ${
            isMine ? 'items-end' : 'items-start'
          } ${message.status === 'sending' ? 'opacity-70' : 'opacity-100'}`}
        >
          <div
            className={`message-bubble ${
              isMine ? 'message-bubble-mine' : 'message-bubble-other'
            } ${
              message.type === 'file' || isImageMessage(message)
                ? 'message-bubble-media'
                : isEmojiOnly
                  ? 'message-bubble-emoji-only'
                  : 'message-bubble-text'
            }`}
          >
            <div className="flex flex-col relative">
              {/* Reply preview inside bubble */}
              {message.replyTo && (
                <div
                  onClick={() => message.replyTo && onScrollToMessage(message.replyTo.id)}
                  className="reply-preview-bubble text-left cursor-pointer"
                >
                  <p className="font-bold text-[var(--color-primary)] text-[11px] mb-0.5">
                    {message.replyTo.senderName}
                  </p>
                  <div className="flex items-center gap-1.5 opacity-90">
                    {message.replyTo.content.includes('cloudinary.com') ||
                    /\.(jpg|jpeg|png|gif|webp|svg)/i.test(message.replyTo.content) ? (
                      <>
                        <MaterialIcon icon="image" size={14} />
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

              {/* Reply Action Trigger */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 hidden lg:flex opacity-0 group-hover:opacity-100 transition-all duration-300 ${
                  isMine ? '-left-10' : '-right-10'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onReply(message)}
                  className="rounded-full bg-[var(--color-surface)] p-1.5 text-[var(--color-text-secondary)] shadow-sm hover:text-[var(--color-text-primary)] transition active:scale-90 cursor-pointer"
                  title="Reply"
                >
                  <MaterialIcon icon="reply" size={16} />
                </button>
              </div>

              {/* Message Content */}
              {isImageMessage(message) ? (
                <div
                  onClick={() => onOpenFullscreen(resolveMediaUrl(message.content))}
                  className="media-container group/media cursor-pointer rounded-2xl overflow-hidden"
                >
                  <img
                    src={resolveMediaUrl(message.content)}
                    alt={message.fileName || 'Image'}
                    className="max-h-[320px] w-full min-w-[200px] object-cover transition-all duration-500 group-hover/media:scale-105"
                    loading="lazy"
                  />
                  {message.status === 'sending' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] text-white">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white mb-2" />
                      <span className="text-[10px] tracking-wider opacity-85">Uploading</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover/media:bg-black/10" />
                </div>
              ) : message.type === 'file' ? (
                <a
                  href={message.content}
                  download={message.fileName}
                  className="flex items-center gap-3 rounded-2xl bg-[var(--color-hover)] p-3 text-sm font-medium transition hover:opacity-90 mb-2 cursor-pointer"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]">
                    <MaterialIcon icon="attachment" size={18} />
                  </div>
                  <div className="overflow-hidden text-left">
                    <p className="truncate font-semibold text-xs">{message.fileName || 'file'}</p>
                    <p className="text-[10px] opacity-75 uppercase font-medium tracking-wider">
                      {formatFileSize(message.fileSize)}
                    </p>
                  </div>
                </a>
              ) : (
                <div className="block text-left">
                  <span className="message-content">{message.content}</span>
                </div>
              )}

              {/* Timestamp & Status Indicator */}
              <div className="message-meta">
                <span className="message-timestamp">{formatTime(message.createdAt)}</span>
                {isMine && (
                  <div className="flex transition-all duration-300">
                    <MaterialIcon
                      icon={
                        message.status === 'sending'
                          ? 'schedule'
                          : message.status === 'sent'
                            ? 'check'
                            : 'done_all'
                      }
                      size={14}
                      className={
                        message.status === 'seen'
                          ? 'text-sky-400'
                          : message.status === 'sending'
                            ? 'animate-pulse opacity-75'
                            : 'opacity-85'
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SwipeableMessage>
    </article>
  );
});

interface SecureMessageListProps {
  messages: SecureChatMessage[];
  currentUserId: string;
  onReply: (message: SecureChatMessage) => void;
  onScrollToMessage: (id: string) => void;
  onOpenFullscreen: (url: string) => void;
}

const SecureMessageList = memo(function SecureMessageList({
  messages,
  currentUserId,
  onReply,
  onScrollToMessage,
  onOpenFullscreen,
}: SecureMessageListProps) {
  return (
    <>
      {messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const isConsecutive =
          prevMessage !== null &&
          prevMessage.sender.id === message.sender.id &&
          new Date(message.createdAt).getTime() -
            new Date(prevMessage.createdAt).getTime() <
            5 * 60 * 1000;

        return (
          <SecureMessageBubble
            key={message.id}
            message={message}
            isConsecutive={isConsecutive}
            currentUserId={currentUserId}
            onReply={onReply}
            onScrollToMessage={onScrollToMessage}
            onOpenFullscreen={onOpenFullscreen}
          />
        );
      })}
    </>
  );
});

export const SecureChatPage = () => {
  const { chatId } = useParams();
  const activeChatId = useMemo(() => (chatId || '').toLowerCase(), [chatId]);
  const { user } = useAuth();
  const { themeId } = useTheme();
  const navigate = useNavigate();
  const pureColor = getThemePureColor(themeId);

  // Access check state
  const [unlockToken, setUnlockToken] = useState<string | null>(() => {
    const token = sessionStorage.getItem(`secure_unlock_${activeChatId}`);
    const leftAtStr = sessionStorage.getItem(`secure_unlock_left_at_${activeChatId}`);
    if (token && leftAtStr) {
      const leftAt = parseInt(leftAtStr, 10);
      if (Date.now() - leftAt > 20000) {
        sessionStorage.removeItem(`secure_unlock_${activeChatId}`);
        sessionStorage.removeItem(`secure_unlock_left_at_${activeChatId}`);
        return null;
      }
    }
    return token;
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Chat Room states
  const [chatInfo, setChatInfo] = useState<SecureChat | null>(null);
  const [messages, setMessages] = useState<SecureChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(Boolean(unlockToken));
  const [isUploading, setIsUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<SecureChatMessage | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Mobile Wallpaper Selector States
  const [selectedWallpaper, setSelectedWallpaper] = useState<string>(() => {
    return localStorage.getItem(`secure_wallpaper_${activeChatId}`) || '';
  });
  const [showMobileWallpaperPicker, setShowMobileWallpaperPicker] = useState(false);

  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia('(max-width: 1023px)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 1023px)');
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const handleSelectWallpaper = (url: string) => {
    setSelectedWallpaper(url);
    if (url) {
      localStorage.setItem(`secure_wallpaper_${activeChatId}`, url);
    } else {
      localStorage.removeItem(`secure_wallpaper_${activeChatId}`);
    }
  };

  // Temp room redirect invite state
  const [tempRoomInvite, setTempRoomInvite] = useState<{
    roomId: string;
    createdBy: string;
  } | null>(null);
  const [inviteCountdown, setInviteCountdown] = useState(3);
  const [isCreatingTempRoom, setIsCreatingTempRoom] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isAtBottomRef = useRef(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  const scrollRafRef = useRef<number | null>(null);

  const placeholder = 'Type a secure message...';

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    const token = sessionStorage.getItem(`secure_unlock_${activeChatId}`);
    const leftAtStr = sessionStorage.getItem(`secure_unlock_left_at_${activeChatId}`);
    if (token && leftAtStr) {
      const leftAt = parseInt(leftAtStr, 10);
      if (Date.now() - leftAt > 20000) {
        sessionStorage.removeItem(`secure_unlock_${activeChatId}`);
        sessionStorage.removeItem(`secure_unlock_left_at_${activeChatId}`);
        setUnlockToken(null);
        setIsLoading(false);
      } else {
        sessionStorage.removeItem(`secure_unlock_left_at_${activeChatId}`);
        setUnlockToken(token);
        setIsLoading(Boolean(token));
      }
    } else {
      setUnlockToken(token);
      setIsLoading(Boolean(token));
    }

    return () => {
      if (activeChatId && sessionStorage.getItem(`secure_unlock_${activeChatId}`)) {
        sessionStorage.setItem(
          `secure_unlock_left_at_${activeChatId}`,
          Date.now().toString()
        );
      }
    };
  }, [activeChatId]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior,
      });
    }
    setUnreadCount(0);
    setShowScrollButton(false);
    isAtBottomRef.current = true;
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollRafRef.current !== null) return;

    scrollRafRef.current = window.requestAnimationFrame(() => {
      scrollRafRef.current = null;

      if (!scrollContainerRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isBottom = scrollHeight - scrollTop - clientHeight < 100;

      isAtBottomRef.current = isBottom;
      setShowScrollButton(!isBottom);

      if (isBottom) {
        setUnreadCount(0);
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current && unlockToken) {
      scrollToBottom('smooth');
    }
  }, [messages, scrollToBottom, unlockToken]);

  const scrollToMessage = useCallback((id: string) => {
    const element = document.getElementById(`msg-${id}`);
    if (element && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const elementTop = element.offsetTop;
      container.scrollTo({
        top: elementTop - container.clientHeight / 2 + element.clientHeight / 2,
        behavior: 'smooth',
      });
      element.classList.add('bg-[var(--color-primary-container)]/30', 'transition-colors', 'duration-500');
      setTimeout(() => {
        element.classList.remove('bg-[var(--color-primary-container)]/30');
      }, 1500);
    }
  }, []);

  const handleReply = useCallback((message: SecureChatMessage) => {
    setReplyingTo(message);
    textareaRef.current?.focus();
  }, []);

  const stopTyping = useCallback(() => {
    if (!activeChatId) return;

    const socket = getSecureSocket();
    if (socket.connected) {
      socket.emit('secure:typing:stop', { chatId: activeChatId });
    }

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [activeChatId]);

  const handleUnlock = async (e: FormEvent) => {
    e.preventDefault();
    setUnlockError('');
    setIsUnlocking(true);

    try {
      const token = await secureChatService.unlockSecureChat(activeChatId, passwordInput);
      sessionStorage.setItem(`secure_unlock_${activeChatId}`, token);
      setUnlockToken(token);
    } catch (err) {
      setUnlockError(getErrorMessage(err));
    } finally {
      setIsUnlocking(false);
    }
  };

  function axiosIsForbidden(error: unknown) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'response' in error &&
      (error as { response?: { status?: number } }).response?.status === 403
    );
  }

  useEffect(() => {
    if (!unlockToken) return;

    let isMounted = true;

    const loadChatData = async () => {
      setIsLoading(true);
      try {
        const chats = await secureChatService.getSecureChats();
        const thisChat = chats.find((c) => c.id === activeChatId);

        if (!thisChat) {
          throw new Error('Secure chat not found or unauthorized.');
        }

        const msgs = await secureChatService.getSecureMessages(activeChatId, unlockToken);

        if (isMounted) {
          setChatInfo(thisChat);
          setMessages(msgs);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(getErrorMessage(loadError));
          if (axiosIsForbidden(loadError)) {
            sessionStorage.removeItem(`secure_unlock_${activeChatId}`);
            setUnlockToken(null);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadChatData();

    return () => {
      isMounted = false;
    };
  }, [activeChatId, unlockToken]);

  useEffect(() => {
    if (!user || !activeChatId || !unlockToken) return;

    const socket: SecureAppSocket = connectSecureSocket();

    const handleNewMessage = (message: SecureChatMessage) => {
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
        socket.emit('secure:message:delivered', { chatId: activeChatId, messageId: message.id });
        if (soundEnabledRef.current) {
          playNotificationSound();
        }
        if (!isAtBottomRef.current) {
          setUnreadCount((prev) => prev + 1);
        }
      }
    };

    const handleUpdatedMessage = (message: SecureChatMessage) => {
      setMessages((current) =>
        current.map((item) =>
          item.id === message.id || (message.tempId && item.tempId === message.tempId) ? message : item
        )
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

    const handleUserStatusUpdate = (payload: { userId: string; status: 'online' | 'offline' }) => {
      setChatInfo((current) => {
        if (!current || current.recipient.id !== payload.userId) return current;
        return {
          ...current,
          isOnline: payload.status === 'online',
        };
      });
    };

    const handleTempRoomInvite = (payload: {
      chatId: string;
      tempRoomId: string;
      createdBy: string;
    }) => {
      if (payload.chatId === activeChatId) {
        setTempRoomInvite({
          roomId: payload.tempRoomId,
          createdBy: payload.createdBy,
        });
        setInviteCountdown(3);
      }
    };

    const handleSocketError = (payload: { message: string }) => {
      setError(payload.message);
    };

    socket.on('secure:message:new', handleNewMessage);
    socket.on('secure:message:updated', handleUpdatedMessage);
    socket.on('secure:typing:update', handleTypingUpdate);
    socket.on('secure:user:status', handleUserStatusUpdate);
    socket.on('secure:temp-room-invite', handleTempRoomInvite);
    socket.on('secure:error', handleSocketError);

    socket.emit('secure:join', { chatId: activeChatId, unlockToken }, (response) => {
      if (!response.ok && response.message) {
        setError(response.message);
        if (response.message.includes('expired') || response.message.includes('locked')) {
          sessionStorage.removeItem(`secure_unlock_${activeChatId}`);
          setUnlockToken(null);
        }
      }
    });

    return () => {
      stopTyping();
      socket.off('secure:message:new', handleNewMessage);
      socket.off('secure:message:updated', handleUpdatedMessage);
      socket.off('secure:typing:update', handleTypingUpdate);
      socket.off('secure:user:status', handleUserStatusUpdate);
      socket.off('secure:temp-room-invite', handleTempRoomInvite);
      socket.off('secure:error', handleSocketError);
      socket.emit('secure:leave', { chatId: activeChatId });
      disconnectSecureSocket();
    };
  }, [activeChatId, unlockToken, user, stopTyping]);

  useEffect(() => {
    if (!tempRoomInvite) return;

    if (inviteCountdown <= 0) {
      navigate(`/rooms/${tempRoomInvite.roomId}`);
      return;
    }

    const timer = setTimeout(() => {
      setInviteCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [tempRoomInvite, inviteCountdown, navigate]);

  const seenObserverRef = useRef<IntersectionObserver | null>(null);
  const deliveredEmittedRef = useRef<Set<string>>(new Set());
  const messagesRef = useRef(messages);
  const userIdRef = useRef<string | null>(user?.id ?? null);
  const chatIdRef = useRef(activeChatId);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user]);

  useEffect(() => {
    chatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (!user || !messages.length || !unlockToken) return;

    const socket = getSecureSocket();

    if (socket.connected) {
      messages.forEach((m) => {
        if (
          m.sender.id !== user.id &&
          !m.deliveredTo.includes(user.id) &&
          !deliveredEmittedRef.current.has(m.id)
        ) {
          deliveredEmittedRef.current.add(m.id);
          socket.emit('secure:message:delivered', { chatId: activeChatId, messageId: m.id });
        }
      });
    }

    if (!seenObserverRef.current) {
      seenObserverRef.current = new IntersectionObserver(
        (entries) => {
          const currentUserId = userIdRef.current;
          const currentChatId = chatIdRef.current;
          if (!currentUserId || !currentChatId) return;

          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            const messageId = entry.target.id.replace('msg-', '');
            const message = messagesRef.current.find((m) => m.id === messageId);
            if (!message || message.sender.id === currentUserId) return;

            const currentSocket = getSecureSocket();
            if (!currentSocket.connected) return;

            seenObserverRef.current?.unobserve(entry.target);
            currentSocket.emit('secure:message:seen', { chatId: currentChatId, messageId });
          });
        },
        { threshold: 0.5 }
      );
    }

    const observer = seenObserverRef.current;

    messages.forEach((m) => {
      if (m.sender.id === user.id || m.seenBy.includes(user.id)) return;

      const el = document.getElementById(`msg-${m.id}`);
      if (el) observer.observe(el);
    });
  }, [messages, user, unlockToken, activeChatId]);

  useEffect(() => {
    const handleConnect = () => {
      deliveredEmittedRef.current.clear();
    };

    const socket = getSecureSocket();
    socket.on('connect', handleConnect);
    return () => {
      socket.off('connect', handleConnect);
    };
  }, []);

  useEffect(() => {
    const deliveredEmitted = deliveredEmittedRef.current;
    return () => {
      seenObserverRef.current?.disconnect();
      seenObserverRef.current = null;
      deliveredEmitted.clear();
    };
  }, [activeChatId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        const isTrigger = (event.target as HTMLElement).closest('button')?.title === 'Emoji';
        if (!isTrigger) {
          setShowEmojiPicker(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPicker]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom('smooth');
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!showCamera) return;

    let activeStream: MediaStream | null = null;
    const currentVideo = videoRef.current;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode } },
        });
        activeStream = stream;
        if (currentVideo) {
          currentVideo.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera access error:', err);
        setShowCamera(false);
      }
    };

    void startCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      if (currentVideo) {
        currentVideo.srcObject = null;
      }
    };
  }, [showCamera, facingMode]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
          const mockEvent = {
            target: { files: [file] },
          } as unknown as ChangeEvent<HTMLInputElement>;
          void sendFile(mockEvent);
          setShowCamera(false);
        }
      },
      'image/jpeg',
      0.85
    );
  };

  const handleMessageChange = (value: string) => {
    setMessageText(value);

    if (!activeChatId || !value.trim()) {
      stopTyping();
      return;
    }

    triggerAmbientPulse();
    const socket = getSecureSocket();
    if (socket.connected) {
      socket.emit('secure:typing:start', { chatId: activeChatId });
    }

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = window.setTimeout(stopTyping, 900);
  };

  const sendMessage = (e?: FormEvent) => {
    e?.preventDefault();

    if (!messageText.trim() || !activeChatId || !user) {
      return;
    }

    triggerAmbientPulse();
    const cleanContent = messageText.trim();
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: SecureChatMessage = {
      id: tempId,
      chatId: activeChatId,
      sender: { id: user.id, name: user.name },
      type: 'text',
      content: cleanContent,
      status: 'sending',
      deliveredTo: [],
      seenBy: [],
      tempId,
      replyTo: replyingTo
        ? {
            id: replyingTo.id,
            content: replyingTo.content,
            senderName: replyingTo.sender.name,
          }
        : undefined,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageText('');
    setReplyingTo(null);
    stopTyping();
    setTimeout(() => scrollToBottom('smooth'), 50);

    getSecureSocket().emit(
      'secure:message:send',
      {
        chatId: activeChatId,
        content: cleanContent,
        tempId,
        replyTo: optimisticMessage.replyTo,
      },
      (response) => {
        if (!response.ok) {
          setError(response.message || 'Unable to send message.');
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.id === tempId ? (response.data as SecureChatMessage) : m))
          );
        }
      }
    );

    textareaRef.current?.focus();
  };

  const sendFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !activeChatId || !user) {
      return;
    }

    triggerAmbientPulse();
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
      const optimisticMessage: SecureChatMessage = {
        id: tempId,
        chatId: activeChatId,
        sender: { id: user.id, name: user.name },
        type: 'file',
        content: dataUrl,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        status: 'sending',
        deliveredTo: [],
        seenBy: [],
        tempId,
        replyTo: replyingTo
          ? {
              id: replyingTo.id,
              content: replyingTo.content,
              senderName: replyingTo.sender.name,
            }
          : undefined,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setReplyingTo(null);
      setTimeout(() => scrollToBottom('smooth'), 100);

      getSecureSocket().emit(
        'secure:file:send',
        {
          chatId: activeChatId,
          dataUrl,
          fileName: file.name,
          fileType: file.type || 'application/octet-stream',
          fileSize: file.size,
          tempId,
          replyTo: optimisticMessage.replyTo,
        },
        (response) => {
          setIsUploading(false);
          if (!response.ok) {
            setError(response.message || 'Unable to share file.');
            setMessages((prev) => prev.filter((m) => m.id !== tempId));
          } else {
            setMessages((prev) =>
              prev.map((m) => (m.id === tempId ? (response.data as SecureChatMessage) : m))
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

  const handleGoToTemporaryRoom = async () => {
    if (!chatInfo) return;
    setIsCreatingTempRoom(true);
    setError('');

    try {
      const res = await roomService.createRoom();
      const tempRoomId = res.room.roomId;

      getSecureSocket().emit('secure:temp-room-create', {
        chatId: activeChatId,
        tempRoomId,
      });

      navigate(`/rooms/${tempRoomId}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsCreatingTempRoom(false);
    }
  };

  const typingNames = Object.values(typingUsers);

  // 1. LOCKED VIEW (Google PIN/Password Shield View)
  if (!unlockToken) {
    return (
      <main className="fixed inset-0 flex flex-col items-center justify-center bg-[var(--color-background)] text-[var(--color-text-primary)] p-4">
        <div className="w-full max-w-sm rounded-3xl bg-[var(--color-surface)] p-8 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-300 space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] shadow-2xs">
            <MaterialIcon icon="lock" size={32} />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-bold text-[var(--color-text-primary)] tracking-tight">
              Encrypted Conversation
            </h1>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Enter password to unlock and access messages.
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter password..."
              className="w-full rounded-2xl bg-[var(--color-hover)] px-5 py-3.5 text-center text-base tracking-widest outline-none transition focus:bg-[var(--color-surface)] focus:ring-2 focus:ring-[var(--color-primary)] text-[var(--color-text-primary)]"
              required
              autoFocus
            />

            {unlockError && (
              <p className="rounded-xl bg-[var(--color-error)]/10 px-4 py-2.5 text-xs font-semibold text-[var(--color-error)]">
                {unlockError}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/secure-chats')}
                className="flex-1 rounded-full bg-[var(--color-hover)] py-5 text-xs font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-hover)]/80 cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isUnlocking}
                className="flex-[2] rounded-full bg-[var(--color-primary)] py-5 text-xs font-semibold text-[var(--color-on-primary)] shadow-sm transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {isUnlocking ? 'Unlocking...' : 'Unlock Chat'}
              </button>
            </div>
          </form>
        </div>
      </main>
    );
  }

  // 2. LOADING STATE
  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--color-background)] text-[var(--color-text-primary)]">
        <Loader size="lg" />
      </div>
    );
  }

  // 3. UNLOCKED CHAT VIEW (Google Messages Pure Layout)
  return (
    <main
      className="fixed inset-0 w-full h-dvh flex flex-col bg-[var(--color-background)] text-[var(--color-text-primary)] overflow-hidden transition-colors duration-200"
    >
      <AmbientGradient />
      {/* Flat Borderless Google Top App Bar */}
      <header className="sticky top-0 z-20 flex-shrink-0 bg-transparent px-4 py-2.5 sm:px-6">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3">
          {/* Identity */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => navigate('/secure-chats')}
              className="rounded-full p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)] active:scale-95 transition cursor-pointer"
              title="Back to Secure Chats"
            >
              <MaterialIcon icon="arrow_back" size={20} />
            </button>

            {/* Recipient Avatar */}
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-2xs"
              style={{
                backgroundColor: pureColor.bg,
                color: pureColor.text,
              }}
            >
              {chatInfo?.recipient.name?.slice(0, 2).toUpperCase() || 'U'}
            </div>

            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-[15px] font-semibold truncate text-[var(--color-text-primary)]">
                  {chatInfo?.recipient.name}
                </h1>
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    chatInfo?.isOnline ? 'bg-[var(--color-success)] animate-pulse' : 'bg-[var(--color-text-muted)]'
                  }`}
                  title={chatInfo?.isOnline ? 'Online' : 'Offline'}
                />
              </div>
              <span className="text-[11px] text-[var(--color-text-secondary)] truncate">
                {chatInfo?.isOnline ? 'Active now' : 'Encrypted conversation'}
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Create Temp Room Shortcut */}
            <button
              type="button"
              onClick={handleGoToTemporaryRoom}
              disabled={isCreatingTempRoom}
              className="flex items-center gap-1.5 rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] px-3 py-1.5 text-xs font-semibold hover:opacity-90 active:scale-95 transition cursor-pointer disabled:opacity-40"
              title="Create Temporary Room"
            >
              <MaterialIcon icon="bolt" size={16} />
              <span className="hidden sm:inline">Temp Room</span>
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled((current) => !current)}
              className="rounded-full p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)] active:scale-95 transition cursor-pointer"
              title={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
            >
              <MaterialIcon icon={soundEnabled ? 'volume_up' : 'volume_off'} size={20} />
            </button>

            <button
              type="button"
              onClick={() => setShowSidebar((prev) => !prev)}
              className="rounded-full p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)] active:scale-95 transition cursor-pointer"
              title="Chat Details & Wallpaper"
            >
              <MaterialIcon icon="info" size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Conversation Body */}
      <div className="mx-auto flex w-full max-w-7xl flex-1 min-h-0 overflow-hidden">
        {/* Chat Area */}
        <section
          style={
            isMobile && selectedWallpaper
              ? {
                  backgroundImage: `url(${selectedWallpaper})`,
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                }
              : undefined
          }
          className="relative flex flex-1 min-h-0 flex-col overflow-hidden bg-[var(--color-background)]"
        >
          {error && (
            <div className="m-4 flex items-center justify-between gap-3 rounded-2xl bg-[var(--color-error)]/10 p-3.5 text-xs font-medium text-[var(--color-error)]">
              <div className="flex items-center gap-2">
                <MaterialIcon icon="error" size={18} />
                <p>{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setError('')}
                className="p-1 hover:opacity-75 cursor-pointer"
              >
                <MaterialIcon icon="close" size={16} />
              </button>
            </div>
          )}

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-smooth px-4 py-6"
          >
            <div className="mx-auto flex w-full max-w-[832px] min-h-full flex-col justify-end">
              {/* Security Pill */}
              <div className="flex justify-center my-4">
                <span className="rounded-full bg-[var(--color-hover)] px-4 py-1.5 text-center text-[11px] font-medium text-[var(--color-text-secondary)] flex items-center gap-1.5 shadow-2xs">
                  <MaterialIcon icon="lock" size={13} className="text-[var(--color-primary)]" />
                  Messages are end-to-end secured & persistent.
                </span>
              </div>

              <SecureMessageList
                messages={messages}
                currentUserId={user?.id ?? ''}
                onReply={handleReply}
                onScrollToMessage={scrollToMessage}
                onOpenFullscreen={setFullscreenImage}
              />

              {typingNames.length > 0 && (
                <div className="flex items-center gap-2 py-2">
                  <div className="flex gap-2 bg-[var(--color-hover)] rounded-full px-3.5 py-1.5 items-center">
                    <span className="text-[11px] text-[var(--color-text-secondary)]">
                      {typingNames[0]} is typing
                    </span>
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-primary)] [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-primary)] [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-primary)]" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Scroll to Bottom Button */}
          {showScrollButton && (
            <button
              onClick={() => scrollToBottom('smooth')}
              className="absolute bottom-20 right-6 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-xl ring-1 ring-[var(--color-primary)]/20 transition hover:scale-105 active:scale-95 cursor-pointer"
            >
              <MaterialIcon icon="arrow_downward" size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-[var(--color-on-primary)] shadow-md animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Google Gemini-Style Bottom Composer */}
          <form
            onSubmit={sendMessage}
            className="flex-shrink-0 border-none bg-gradient-to-t from-[var(--color-background)]/90 via-[var(--color-background)]/50 to-transparent pt-6 pb-3 px-3 sm:px-6 sm:pb-5 relative z-20"
          >
            {/* Gemini Dynamic Theme Ambient Light radiating from behind the input bar */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-44 -z-10 overflow-hidden"
            >
              <div
                className="absolute inset-0 transition-all duration-700 ease-out"
                style={{
                  background: 'radial-gradient(ellipse 130% 90% at 50% 125%, var(--color-primary) 0%, var(--color-accent, var(--color-primary)) 35%, transparent 70%)',
                  opacity: 0.16,
                }}
              />
              <div
                className="absolute inset-0 transition-all duration-700 ease-out"
                style={{
                  background: 'radial-gradient(ellipse 80% 60% at 50% 110%, var(--color-primary-container, var(--color-primary)) 0%, transparent 65%)',
                  opacity: 0.12,
                }}
              />
            </div>

            {/* Reply banner preview */}
            {replyingTo && (
              <div className="mx-auto mb-2.5 flex w-full max-w-[832px] items-center gap-3 overflow-hidden rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface)]/90 backdrop-blur-md p-3 shadow-lg animate-in slide-in-from-bottom-2">
                <div className="h-8 w-1 rounded-full bg-[var(--color-primary)]" />
                <div className="flex-1 overflow-hidden text-left">
                  <p className="text-[11px] font-bold text-[var(--color-primary)]">
                    Replying to {replyingTo.sender.name}
                  </p>
                  <p className="truncate text-xs text-[var(--color-text-secondary)]">
                    {replyingTo.content.includes('cloudinary.com') ? 'Photo' : replyingTo.content}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="rounded-full p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                >
                  <MaterialIcon icon="close" size={16} />
                </button>
              </div>
            )}

            {/* Hidden File Inputs */}
            <input ref={fileInputRef} type="file" className="hidden" onChange={sendFile} />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={sendFile}
            />

            {/* Google Gemini Single Floating Pill Capsule */}
            <div className="mx-auto flex w-full max-w-[832px] items-center gap-1.5 rounded-full bg-[var(--color-surface)]/85 backdrop-blur-2xl px-2.5 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-[var(--color-border)]/50 focus-within:border-[var(--color-primary)]/50 focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20 transition-all duration-200">
              {/* Attachment Plus Button (Inside Left) */}
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAttachmentMenu(!showAttachmentMenu);
                  }}
                  disabled={isUploading}
                  className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)] active:scale-90 transition cursor-pointer"
                  title="Attach file"
                >
                  <MaterialIcon
                    icon="add"
                    size={24}
                    className={`transition-transform duration-300 ${
                      showAttachmentMenu ? 'rotate-45' : ''
                    }`}
                  />
                </button>

                {showAttachmentMenu && (
                  <div
                    className="absolute bottom-full left-0 mb-3 w-48 overflow-hidden rounded-3xl bg-[var(--color-surface)]/95 backdrop-blur-xl border border-[var(--color-border)]/60 p-2 shadow-2xl animate-in slide-in-from-bottom-3 fade-in duration-200 z-[60]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        fileInputRef.current?.click();
                        setShowAttachmentMenu(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] transition cursor-pointer"
                    >
                      <MaterialIcon icon="image" size={20} className="text-[var(--color-primary)]" />
                      <span>Device Media</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCamera(true);
                        setShowAttachmentMenu(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] transition cursor-pointer"
                    >
                      <MaterialIcon
                        icon="photo_camera"
                        size={20}
                        className="text-[var(--color-primary)]"
                      />
                      <span>Camera</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Text Area & Placeholder (Middle) */}
              <div className="relative flex-1 min-w-0 self-center">
                <textarea
                  ref={textareaRef}
                  value={messageText}
                  onChange={(event) => handleMessageChange(event.target.value)}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollToBottom('auto');
                    }, 100);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  rows={1}
                  className="flex-1 max-h-36 min-h-[38px] w-full resize-none bg-transparent py-2 px-1 text-[15px] sm:text-[16px] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-muted)]"
                  placeholder={placeholder}
                />
              </div>

              {/* Send Button (Inside Far Right — Gemini style) */}
              <button
                type="submit"
                disabled={!messageText.trim()}
                onMouseDown={(e) => e.preventDefault()}
                className={`flex h-10 items-center justify-center gap-1 rounded-full px-3.5 sm:px-4 text-xs font-bold transition-all duration-200 cursor-pointer flex-shrink-0 ${
                  messageText.trim()
                    ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-md hover:opacity-95 hover:scale-105 active:scale-95'
                    : 'bg-[var(--color-primary)]/15 text-[var(--color-primary)]/40 opacity-50 cursor-not-allowed'
                }`}
                title="Send message"
              >
                <MaterialIcon icon="send" size={18} />
              </button>
            </div>
          </form>
        </section>

        {/* Sidebar Info Panel */}
        <aside
          className={`
            fixed inset-y-0 right-0 z-40 w-80 transform bg-[var(--color-surface)] transition-transform duration-300 ease-in-out shadow-2xl lg:static lg:block lg:w-80 lg:translate-x-0 lg:shadow-none
            ${showSidebar ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          <div className="flex h-full flex-col p-6 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <MaterialIcon icon="info" size={20} className="text-[var(--color-primary)]" />
                Conversation Info
              </h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="rounded-full p-1.5 hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)] lg:hidden cursor-pointer"
              >
                <MaterialIcon icon="close" size={20} />
              </button>
            </div>

            {/* Participants */}
            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Participants
              </p>
              <div className="space-y-2">
                {/* Recipient */}
                <div className="flex items-center justify-between rounded-2xl bg-[var(--color-hover)] p-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-2xs"
                      style={{
                        backgroundColor: pureColor.bg,
                        color: pureColor.text,
                      }}
                    >
                      {chatInfo?.recipient.name?.slice(0, 2).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                        {chatInfo?.recipient.name}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-secondary)] truncate">
                        {chatInfo?.recipient.email}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                      chatInfo?.isOnline
                        ? 'bg-[var(--color-success)]/15 text-[var(--color-success)]'
                        : 'bg-[var(--color-hover)] text-[var(--color-text-muted)]'
                    }`}
                  >
                    {chatInfo?.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>

                {/* You */}
                <div className="flex items-center justify-between rounded-2xl bg-[var(--color-hover)] p-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-2xs"
                      style={{
                        backgroundColor: pureColor.bg,
                        color: pureColor.text,
                      }}
                    >
                      {user?.name?.slice(0, 2).toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                        {user?.name} (You)
                      </p>
                      <p className="text-[10px] text-[var(--color-text-secondary)] truncate">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-bold bg-[var(--color-success)]/15 text-[var(--color-success)]">
                    Online
                  </span>
                </div>
              </div>
            </div>

            {/* Customization Options */}
            <div className="space-y-3 pt-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Chat Theme & Vibe
              </p>

              {/* Wallpaper Picker */}
              <div className="rounded-2xl bg-[var(--color-hover)] p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
                    <MaterialIcon icon="image" size={16} className="text-[var(--color-primary)]" />
                    Wallpaper
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMobileWallpaperPicker(!showMobileWallpaperPicker)}
                    className="text-[11px] font-bold text-[var(--color-primary)] hover:underline cursor-pointer"
                  >
                    {showMobileWallpaperPicker ? 'Hide' : 'Change'}
                  </button>
                </div>

                {showMobileWallpaperPicker && (
                  <div className="grid grid-cols-3 gap-2 max-h-[200px] overflow-y-auto p-1 animate-in fade-in duration-200">
                    {wallpapers.map((wp) => (
                      <button
                        key={wp.id}
                        onClick={() => handleSelectWallpaper(wp.url)}
                        className={`group relative flex flex-col items-center justify-center rounded-xl p-1.5 transition hover:scale-105 cursor-pointer ${
                          selectedWallpaper === wp.url
                            ? 'ring-2 ring-[var(--color-primary)] bg-[var(--color-primary-container)]/30'
                            : 'hover:bg-[var(--color-hover)]'
                        }`}
                      >
                        {wp.url ? (
                          <img
                            src={wp.url}
                            alt={wp.name}
                            className="h-14 w-10 rounded-lg object-cover shadow-2xs"
                          />
                        ) : (
                          <div className="h-14 w-10 rounded-lg flex items-center justify-center bg-[var(--color-surface)] text-[9px] font-bold text-[var(--color-text-muted)] shadow-2xs">
                            Default
                          </div>
                        )}
                        <span className="text-[9px] mt-1 truncate max-w-full font-medium">
                          {wp.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theme Quick Toggle */}
              <div className="rounded-2xl bg-[var(--color-hover)] p-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                  Appearance
                </span>
                <div className="flex items-center gap-2">
                  <GlassThemeToggle />
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Sidebar Mobile Backdrop */}
        {showSidebar && (
          <div
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}
      </div>

      {/* Camera Capture Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black animate-in fade-in duration-300">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setShowCamera(false)}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 cursor-pointer"
            >
              <MaterialIcon icon="close" size={24} />
            </button>
            <span className="font-semibold text-white">Camera</span>
            <button
              onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20 cursor-pointer"
            >
              <MaterialIcon icon="photo_camera" size={24} />
            </button>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="flex flex-col items-center justify-center p-8 pb-12">
            <button
              onClick={handleCapture}
              className="h-20 w-20 rounded-full border-4 border-white p-1 transition active:scale-90 cursor-pointer"
            >
              <div className="h-full w-full rounded-full bg-white" />
            </button>
            <p className="mt-4 text-xs text-white/60">Tap to capture photo</p>
          </div>
        </div>
      )}

      {/* Temporary Room Redirect Modal */}
      {tempRoomInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--color-surface)] p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300 space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] shadow-2xs">
              <MaterialIcon icon="bolt" size={32} />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                Temporary Room Invite
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                <span className="font-bold text-[var(--color-text-primary)]">
                  {tempRoomInvite.createdBy}
                </span>{' '}
                invited you to a temporary workspace. Auto-joining in{' '}
                <span className="font-bold text-[var(--color-primary)] text-sm">
                  {inviteCountdown}s
                </span>
                ...
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setTempRoomInvite(null)}
                className="flex-1 rounded-full bg-[var(--color-hover)] py-3 text-xs font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-hover)]/80 cursor-pointer"
              >
                Dismiss
              </button>
              <button
                onClick={() => navigate(`/rooms/${tempRoomInvite.roomId}`)}
                className="flex-[2] rounded-full bg-[var(--color-primary)] py-3 text-xs font-semibold text-[var(--color-on-primary)] shadow-sm transition hover:opacity-90 active:scale-[0.98] cursor-pointer"
              >
                Join Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Preview Portal */}
      {fullscreenImage &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setFullscreenImage(null)}
          >
            <button
              className="absolute top-6 right-6 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 cursor-pointer"
              onClick={() => setFullscreenImage(null)}
            >
              <MaterialIcon icon="close" size={24} />
            </button>
            <div className="relative h-full w-full flex items-center justify-center p-6">
              <img
                src={fullscreenImage}
                alt="Fullscreen"
                className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>,
          document.body
        )}
    </main>
  );
};
