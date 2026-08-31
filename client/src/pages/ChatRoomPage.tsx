import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { ChangeEvent, FormEvent, RefObject } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatedPlaceholder } from '../components/AnimatedPlaceholder';
import { ThemeToggle } from '../components/ThemeToggle';
import { ThemeSelector, themes } from '../components/ThemeSelector';
import { GlassThemeToggle } from '../components/GlassThemeToggle';
import { Loader } from '../components/Loader';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, getErrorMessage } from '../services/http';
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
import { useSwipeReply } from '../hooks/useSwipeReply';
import { MaterialIcon } from '../components/MaterialIcon';
import { AppSidebar } from '../components/AppSidebar';
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

const reactionOptions = [0x1f44d, 0x2764, 0x1f602, 0x1f525, 0x1f389].map(
  (codePoint) => String.fromCodePoint(codePoint)
);

// One formatter + result cache instead of a new Intl.DateTimeFormat per
// message per render (locale resolution is not cheap at scale).
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

// Hoisted regexes (built once) + result cache; these run per message.
const FLAG_REGEX = /^[\u{1F1E6}-\u{1F1FF}]{2}$/u;
const EMOJI_REGEX = /^(?:(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})(?:[\uFE00-\uFE0F]|[\u{1F3FB}-\u{1F3FF}])*)(?:\u200d(?:(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})(?:[\uFE00-\uFE0F]|[\u{1F3FB}-\u{1F3FF}])*))*$/u;
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

const isImageMessage = (message: ChatMessage): boolean => {
  const isImageFile =
    message.type === 'file' &&
    (message.fileType?.startsWith('image/') ||
      IMAGE_FILE_REGEX.test(message.fileName || ''));

  // Check if it's a direct image link or Cloudinary URL in a text message
  const isImageUrl =
    message.type === 'text' &&
    (IMAGE_URL_REGEX.test(message.content) ||
      (message.content.includes('cloudinary.com') &&
        /image\/upload/.test(message.content)));

  return isImageFile || isImageUrl;
};




/**
 * SwipeableMessage
 * Wraps a message bubble to add WhatsApp-style swipe-right-to-reply on mobile.
 * Desktop layout is completely unchanged.
 */
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
      {/* Reply icon — appears behind the bubble as user swipes */}
      <div
        ref={iconRef}
        style={{ opacity: 0, transform: 'scale(0.5)' }}
        className="pointer-events-none absolute left-[-36px] top-1/2 z-0 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-200 text-slate-500 will-change-transform dark:bg-slate-700 dark:text-slate-400"
      >
        <MaterialIcon icon="reply" size={15} />
      </div>

      {/* The actual message bubble — translates horizontally on swipe */}
      <div ref={wrapperRef} className="relative z-10 w-fit will-change-transform">
        {children}
      </div>
    </div>
  );
};

interface MessageBubbleProps {
  message: ChatMessage;
  isConsecutive: boolean;
  currentUserId: string;
  isReactionPickerOpen: boolean;
  reactionPickerRef: RefObject<HTMLDivElement | null>;
  onReply: (message: ChatMessage) => void;
  onScrollToMessage: (id: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onTouchStart: (messageId: string) => void;
  onTouchEnd: () => void;
  onSetReactionPicker: (messageId: string | null) => void;
  onOpenFullscreen: (url: string) => void;
}

/**
 * Memoized per-message bubble. With stable handler props, page-level state
 * changes (keystrokes, typing indicators, scroll button, placeholder) no
 * longer re-render existing messages.
 */
const MessageBubble = memo(function MessageBubble({
  message,
  isConsecutive,
  currentUserId,
  isReactionPickerOpen,
  reactionPickerRef,
  onReply,
  onScrollToMessage,
  onToggleReaction,
  onTouchStart,
  onTouchEnd,
  onSetReactionPicker,
  onOpenFullscreen,
}: MessageBubbleProps) {
  const isMine = message.sender.id === currentUserId;

  return (
    <article
      id={`msg-${message.id}`}
      className={`flex animate-in fade-in slide-in-from-bottom-2 duration-300 ${isMine ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-[2px]' : 'mt-4'}`}
    >
      <SwipeableMessage isMine={isMine} onReply={() => onReply(message)}>
        <div
          className={`group relative flex flex-col transition-opacity duration-300 ${isMine ? 'items-end' : 'items-start'
            } ${message.status === 'sending' ? 'opacity-70' : 'opacity-100'}`}
        >
          {!isMine && !isConsecutive && (
            <p className="mb-1 ml-2 text-[10px] font-bold text-slate-400">
              {message.sender.name}
            </p>
          )}
          <div
            onPointerDown={() => onTouchStart(message.id)}
            onPointerUp={onTouchEnd}
            onPointerLeave={onTouchEnd}
            className={`message-bubble ${isMine ? 'message-bubble-mine' : 'message-bubble-other'} ${message.type === 'file' || isImageMessage(message)
                ? 'message-bubble-media'
                : (message.type === 'text' && isSingleEmoji(message.content) && !message.replyTo)
                  ? 'message-bubble-emoji-only'
                  : 'message-bubble-text'
              }`}
          >
            <div className="flex flex-col relative">
              {/* Reply Display */}
              {message.replyTo && (
                <div
                  onClick={() => message.replyTo && onScrollToMessage(message.replyTo.id)}
                  className="reply-preview-bubble"
                >
                  <p className="font-extrabold text-primary-600 dark:text-primary-400 mb-0.5">
                    {message.replyTo.senderName}
                  </p>
                  <div className="flex items-center gap-1.5 opacity-90">
                    {(message.replyTo.content.includes('cloudinary.com') || /\.(jpg|jpeg|png|gif|webp|svg)/i.test(message.replyTo.content)) ? (
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
              {/* Desktop Reaction Trigger */}
              <div className={`absolute top-1/2 -translate-y-1/2 hidden lg:flex opacity-0 group-hover:opacity-100 transition-all duration-300 ${isMine ? '-left-20' : '-right-20'} items-center gap-1`}>
                <button
                  type="button"
                  onClick={() => onSetReactionPicker(message.id)}
                  className="rounded-full bg-white/80 p-2 text-slate-500 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-primary-600 hover:scale-110 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-primary-400"
                  title="React"
                >
                  <MaterialIcon icon="mood" size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => onReply(message)}
                  className="rounded-full bg-white/80 p-2 text-slate-500 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:text-primary-600 hover:scale-110 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-primary-400"
                  title="Reply"
                >
                  <MaterialIcon icon="reply" size={20} />
                </button>
              </div>

              {/* Mobile Actions */}
              <div className="absolute right-0 top-0 flex -translate-y-full items-center gap-1 opacity-0 transition-opacity group-active:opacity-100 lg:hidden">
                <button
                  type="button"
                  onClick={() => onReply(message)}
                  className="rounded-full bg-slate-900/50 p-1.5 text-white backdrop-blur-sm"
                >
                  <MaterialIcon icon="reply" size={14} />
                </button>
              </div>

              {/* Floating Reaction Picker */}
              {isReactionPickerOpen && (
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
                          onToggleReaction(message.id, emoji);
                          onSetReactionPicker(null);
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
                  onClick={() => onOpenFullscreen(resolveMediaUrl(message.content))}
                  className="media-container group/media"
                >
                  <img
                    src={resolveMediaUrl(message.content)}
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
                  className="flex items-center gap-3 rounded-xl border border-white/20 bg-black/5 p-3 text-sm font-medium transition hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 mb-2"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400">
                    <MaterialIcon icon="add_photo_alternate" size={20} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="truncate font-bold">{message.fileName || 'Shared file'}</p>
                    <p className="text-[10px] opacity-70 uppercase font-black tracking-wider">{formatFileSize(message.fileSize)}</p>
                  </div>
                </a>
              ) : (
                <div className="block">
                  <span className="message-content">
                    {message.content}
                  </span>
                  <div className="message-meta">
                    <span className="message-timestamp">
                      {formatTime(message.createdAt)}
                    </span>
                    {isMine && (
                      <div className="flex transition-all duration-300">
                        <MaterialIcon icon={
                            message.status === 'sending'
                              ? "schedule"
                              : message.status === 'sent'
                                ? "check"
                                : "done_all"
                          }
                          size={14}
                          className={`
                                      ${message.status === 'seen' ? 'text-sky-400' : 'text-white'}
                                      ${message.status === 'sending' ? 'animate-pulse' : ''}
                                    `}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(isImageMessage(message) || message.type === 'file') && (
                <div className="message-meta">
                  <span className="message-timestamp">
                    {formatTime(message.createdAt)}
                  </span>
                  {isMine && (
                    <div className="flex transition-all duration-300">
                      <MaterialIcon icon={
                          message.status === 'sending'
                            ? "schedule"
                            : message.status === 'sent'
                              ? "check"
                              : "done_all"
                        }
                        size={14}
                        className={`
                                    ${message.status === 'seen' ? 'text-sky-400' : 'text-white'}
                                    ${message.status === 'sending' ? 'animate-pulse' : ''}
                                  `}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Reaction Display Bubble */}
            {message.reactions.length > 0 && message.reactions.some(r => r.count > 0) && (
              <div className={`absolute -bottom-2 flex gap-0.5 ${isMine ? 'right-2' : 'left-2'}`}>
                {message.reactions.filter(r => r.count > 0).map((r) => {
                  const reacted = r.userIds.includes(currentUserId);
                  return (
                    <button
                      key={r.emoji}
                      onClick={() => onToggleReaction(message.id, r.emoji)}
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
      </SwipeableMessage>
    </article>
  );
});

interface MessageListProps {
  notices: RoomNotice[];
  messages: ChatMessage[];
  currentUserId: string;
  activeReactionMessageId: string | null;
  reactionPickerRef: RefObject<HTMLDivElement | null>;
  onReply: (message: ChatMessage) => void;
  onScrollToMessage: (id: string) => void;
  onToggleReaction: (messageId: string, emoji: string) => void;
  onTouchStart: (messageId: string) => void;
  onTouchEnd: () => void;
  onSetReactionPicker: (messageId: string | null) => void;
  onOpenFullscreen: (url: string) => void;
}

/**
 * Memoized message list. When a prop like `messages` is unchanged the whole
 * list is skipped, so keystrokes/typing/scroll state never touch message
 * DOM at all.
 */
const MessageList = memo(function MessageList({
  notices,
  messages,
  currentUserId,
  activeReactionMessageId,
  reactionPickerRef,
  onReply,
  onScrollToMessage,
  onToggleReaction,
  onTouchStart,
  onTouchEnd,
  onSetReactionPicker,
  onOpenFullscreen,
}: MessageListProps) {
  return (
    <>
      {notices.map((notice) => (
        <div
          key={`${notice.createdAt}-${notice.message}`}
          className="flex justify-center my-2"
        >
          <span className="rounded-full bg-slate-100 px-4 py-1.5 text-center text-[10px] font-bold tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {notice.message}
          </span>
        </div>
      ))}

      {messages.map((message, index) => {
        const prevMessage = index > 0 ? messages[index - 1] : null;
        const isConsecutive = prevMessage !== null && 
          prevMessage.sender.id === message.sender.id && 
          new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() < 5 * 60 * 1000;

        return (
          <MessageBubble
            key={message.id}
            message={message}
            isConsecutive={isConsecutive}
            currentUserId={currentUserId}
            isReactionPickerOpen={activeReactionMessageId === message.id}
            reactionPickerRef={reactionPickerRef}
            onReply={onReply}
            onScrollToMessage={onScrollToMessage}
            onToggleReaction={onToggleReaction}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onSetReactionPicker={onSetReactionPicker}
            onOpenFullscreen={onOpenFullscreen}
          />
        );
      })}
    </>
  );
});

export const ChatRoomPage = () => {
  const { roomId } = useParams();
  const activeRoomId = useMemo(() => (roomId || '').toUpperCase(), [roomId]);
  const { user } = useAuth();
  const { isDark, accent, setAccent } = useTheme();
  const [showMobileColorPicker, setShowMobileColorPicker] = useState(false);
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
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAppNavSidebar, setShowAppNavSidebar] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [terminationNotice, setTerminationNotice] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Mobile Wallpaper Selector States
  const [selectedWallpaper, setSelectedWallpaper] = useState<string>(() => {
    return localStorage.getItem(`chat_wallpaper_${activeRoomId}`) || '';
  });
  const [showMobileWallpaperPicker, setShowMobileWallpaperPicker] = useState(false);

  // matchMedia fires only when the viewport crosses the breakpoint instead
  // of on every resize frame, so no debouncing is needed.
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
      localStorage.setItem(`chat_wallpaper_${activeRoomId}`, url);
    } else {
      localStorage.removeItem(`chat_wallpaper_${activeRoomId}`);
    }
  };


  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isAtBottomRef = useRef(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const reactionPickerRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  const scrollRafRef = useRef<number | null>(null);

  const isCreator = Boolean(room && user && room.createdBy.id === user.id);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

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

  // rAF-throttled: the scroll handler runs at most once per frame instead of
  // once per scroll event, and only updates state when the bottom state flips.
  const handleScroll = useCallback(() => {
    if (scrollRafRef.current !== null) return;

    scrollRafRef.current = window.requestAnimationFrame(() => {
      scrollRafRef.current = null;

      if (!scrollContainerRef.current) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      // Buffer of 100px to consider "at bottom"
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

  // Typing indicators must not scroll the chat — only new content should.
  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom('smooth');
    }
  }, [messages, notices, scrollToBottom]);

  const scrollToMessage = useCallback((id: string) => {
    const element = document.getElementById(`msg-${id}`);
    if (element && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const elementTop = element.offsetTop;
      container.scrollTo({
        top: elementTop - container.clientHeight / 2 + element.clientHeight / 2,
        behavior: 'smooth',
      });
      // Add a temporary subtle highlight like WhatsApp
      element.classList.add('bg-primary-500/20', 'dark:bg-primary-500/30', 'transition-colors', 'duration-500');
      setTimeout(() => {
        element.classList.remove('bg-primary-500/20', 'dark:bg-primary-500/30');
      }, 1500);
    }
  }, []);

  const handleReply = useCallback((message: ChatMessage) => {
    setReplyingTo(message);
    textareaRef.current?.focus();
  }, []);

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

  // Seen detection logic.
  // One persistent IntersectionObserver for the whole conversation: each
  // messages change only re-observes messages that are still unseen
  // (observe() is a no-op for already-observed targets), so a busy
  // conversation no longer tears down and rebuilds the observer — with its
  // O(n) work and DOM queries — on every message update.
  const seenObserverRef = useRef<IntersectionObserver | null>(null);
  const deliveredEmittedRef = useRef<Set<string>>(new Set());
  const messagesRef = useRef(messages);
  const userIdRef = useRef<string | null>(user?.id ?? null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    userIdRef.current = user?.id ?? null;
  }, [user]);

  useEffect(() => {
    if (!user || !messages.length) return;

    const socket = getSocket();

    if (socket.connected) {
      messages.forEach((m) => {
        if (
          m.sender.id !== user.id &&
          !m.deliveredTo.includes(user.id) &&
          !deliveredEmittedRef.current.has(m.id)
        ) {
          deliveredEmittedRef.current.add(m.id);
          socket.emit('message:delivered', { messageId: m.id });
        }
      });
    }

    if (!seenObserverRef.current) {
      seenObserverRef.current = new IntersectionObserver(
        (entries) => {
          const currentUserId = userIdRef.current;
          if (!currentUserId) return;

          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            const messageId = entry.target.id.replace('msg-', '');
            const message = messagesRef.current.find((m) => m.id === messageId);
            if (!message || message.sender.id === currentUserId) return;

            const currentSocket = getSocket();
            if (!currentSocket.connected) return;

            // Only stop tracking after a successful hand-off to the socket,
            // so a message visible while offline is retried later.
            seenObserverRef.current?.unobserve(entry.target);
            currentSocket.emit('message:seen', { messageId });
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
  }, [messages, user]);

  // Re-delivery safety: after a reconnect, allow delivered pings again for
  // messages the server may have missed while we were offline.
  useEffect(() => {
    const handleConnect = () => {
      deliveredEmittedRef.current.clear();
    };

    const socket = getSocket();
    socket.on('connect', handleConnect);
    return () => {
      socket.off('connect', handleConnect);
    };
  }, []);

  // Switching rooms (and unmount): reset seen tracking so the next
  // conversation starts fresh. Runs as cleanup, i.e. before the observe
  // effect re-runs for the new room.
  useEffect(() => {
    const deliveredEmitted = deliveredEmittedRef.current;
    return () => {
      seenObserverRef.current?.disconnect();
      seenObserverRef.current = null;
      deliveredEmitted.clear();
    };
  }, [activeRoomId]);

  // Handle click outside for reaction picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activeReactionMessageId &&
        reactionPickerRef.current &&
        !reactionPickerRef.current.contains(event.target as Node)
      ) {
        setTimeout(() => setActiveReactionMessageId(null), 0);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeReactionMessageId]);

  // Handle click outside for attachment menu
  useEffect(() => {
    if (!showAttachmentMenu) return;
    const handleClick = () => setShowAttachmentMenu(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [showAttachmentMenu]);
  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom('smooth');
    }
  }, [messages, notices, scrollToBottom]);

  useEffect(() => {
    if (!showCamera) return;

    let activeStream: MediaStream | null = null;
    const currentVideo = videoRef.current;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode } }
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
        activeStream.getTracks().forEach(track => track.stop());
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

    triggerAmbientPulse();
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

    triggerAmbientPulse();
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

    // Refocus input field to keep keyboard open on mobile
    textareaRef.current?.focus();
  };

  const sendFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !activeRoomId || !user) {
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


  const toggleReaction = useCallback((messageId: string, emoji: string) => {
    getSocket().emit('message:react', { messageId, emoji }, (response) => {
      if (!response.ok) {
        setError(response.message || 'Unable to update reaction.');
      }
    });
  }, []);

  const handleTouchStart = useCallback((messageId: string) => {
    longPressTimerRef.current = window.setTimeout(() => {
      setActiveReactionMessageId(messageId);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 600);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const typingNames = Object.values(typingUsers);

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
        <Loader size="lg" />
      </div>
    );
  }
  return (
    <main
      className="fixed inset-0 w-full h-dvh flex flex-col bg-[var(--color-background)] text-[var(--color-text-primary)] overflow-hidden transition-colors duration-200"
    >
      <AmbientGradient />
      {/* APP NAVIGATION SIDEBAR (same as /home) */}
      <AppSidebar
        isOpen={showAppNavSidebar}
        onClose={() => setShowAppNavSidebar(false)}
        actions={
          <>
            {isCreator && (
              <button
                type="button"
                onClick={() => {
                  setShowAppNavSidebar(false);
                  closeRoom();
                }}
                disabled={isClosing}
                className="group inline-flex items-center gap-2 rounded-full bg-[var(--color-error)] text-white px-4 py-2 text-xs font-bold tracking-wide shadow-md hover:shadow-lg hover:scale-105 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                <MaterialIcon
                  icon="close"
                  size={16}
                  className="text-white transition-transform duration-300 group-hover:rotate-90"
                />
                <span className="whitespace-nowrap">Close Room</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setShowAppNavSidebar(false);
                leaveRoom();
              }}
              className="group inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] px-4 py-2 text-xs font-bold tracking-wide shadow-md hover:shadow-lg hover:scale-105 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <MaterialIcon
                icon="logout"
                size={16}
                className="text-[var(--color-on-primary)] transition-transform duration-300 group-hover:-translate-x-1"
              />
              <span className="whitespace-nowrap">Move Out</span>
            </button>
          </>
        }
      />

      <header className="sticky top-0 z-20 flex-shrink-0 bg-transparent px-4 py-0 sm:px-6">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* App nav sidebar trigger (drag_handle — consistent with AppLayout) */}
            <button
              type="button"
              onClick={() => setShowAppNavSidebar(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] transition cursor-pointer"
              title="Open menu"
              aria-label="Open navigation menu"
            >
              <MaterialIcon icon="drag_handle" size={24} />
            </button>
          </div>

          {/* Right — actions */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <VideoCallPanel roomId={activeRoomId} currentUser={user} />

            <div className="mx-1 hidden h-5 w-px bg-[var(--color-divider)] lg:block" />

            <div className="hidden items-center gap-0.5 lg:flex">
              <ThemeSelector />
              <GlassThemeToggle />
              <ThemeToggle />
            </div>

            <div className="mx-1 hidden h-5 w-px bg-[var(--color-divider)] sm:block" />

            <button
              type="button"
              onClick={() => setSoundEnabled((current) => !current)}
              className="hidden rounded-full p-2 text-[var(--color-text-secondary)] transition-all duration-150 hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)] active:scale-95 sm:block cursor-pointer"
              title={soundEnabled ? 'Mute' : 'Unmute'}
            >
              <MaterialIcon icon={soundEnabled  ? "volume_up" : "volume_off"} size={20} />
            </button>
          </div>

        </div>
      </header>

      <section className="mx-auto flex w-full max-w-7xl flex-1 min-h-0 overflow-hidden lg:gap-4 lg:p-4">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-30 w-72 transform border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-transform duration-300 ease-in-out lg:static lg:block lg:w-72 lg:translate-x-0 lg:rounded-2xl lg:border
            ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex h-full flex-col p-5">
            <div className="sticky top-0 z-10 mb-6 flex items-center justify-between bg-[var(--color-surface)] py-1">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
                <MaterialIcon icon="group" size={18} />
                Online ({room?.users.length || 0})
              </h2>
              <button
                onClick={() => setShowSidebar(false)}
                className="lg:hidden"
              >
                <MaterialIcon icon="close" size={20} />
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
            <div className="mt-auto space-y-4 border-t border-slate-100 pt-6 dark:border-slate-800 lg:hidden">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Appearance
                </p>
              </div>

              {/* Chat Background Trigger with collapsible panel directly above it */}
              <div className="relative">
                {showMobileColorPicker && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl bg-white border border-slate-200 p-4 dark:bg-slate-950 dark:border-slate-800 shadow-xl z-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <MaterialIcon icon="brush" size={14} />
                        Choose Vibe
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMobileColorPicker(false);
                        }}
                        className="rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <MaterialIcon icon="close" size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-5 gap-2 max-h-[160px] overflow-y-auto p-1">
                      {themes.map((themeOption) => (
                        <button
                          key={themeOption.value}
                          onClick={(e) => {
                            e.stopPropagation();
                            setAccent(themeOption.value);
                          }}
                          className={`group relative flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-110 ${accent === themeOption.value ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-slate-950' : ''
                            }`}
                          title={themeOption.name}
                        >
                          <span className="h-full w-full rounded-full shadow-sm border border-slate-200 dark:border-slate-800" style={{ backgroundColor: themeOption.color }} />
                          {accent === themeOption.value && (
                            <span className="absolute inset-0 flex items-center justify-center">
                              <span className="h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  onClick={() => setShowMobileColorPicker((prev) => !prev)}
                  className={`flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/50 cursor-pointer transition hover:bg-slate-100 dark:hover:bg-slate-900 ${showMobileColorPicker ? 'ring-1 ring-primary-500' : ''
                    }`}
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold">Chat Background</p>
                    <p className="text-[10px] text-slate-500">Choose your vibe</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-6 w-6 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm"
                      style={{ backgroundColor: themes.find((t) => t.value === accent)?.color || accent }}
                    />
                    <MaterialIcon icon="brush" size={16} className="text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Chat Wallpaper Trigger with collapsible panel directly above it */}
              <div className="relative">
                {showMobileWallpaperPicker && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl bg-white border border-slate-200 p-4 dark:bg-slate-950 dark:border-slate-800 shadow-xl z-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <MaterialIcon icon="image" size={14} className="text-primary-500" />
                        Choose Wallpaper
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMobileWallpaperPicker(false);
                        }}
                        className="rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <MaterialIcon icon="close" size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto p-1">
                      {wallpapers.map((wp) => (
                        <button
                          key={wp.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectWallpaper(wp.url);
                          }}
                          className={`group relative flex flex-col items-center justify-center rounded-xl p-1.5 border transition-all hover:scale-105 ${
                            selectedWallpaper === wp.url
                              ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                          title={wp.name}
                        >
                          {wp.url ? (
                            <img
                              src={wp.url}
                              alt={wp.name}
                              loading="lazy"
                              decoding="async"
                              className="h-16 w-12 rounded-lg object-cover border border-slate-200 dark:border-slate-800"
                            />
                          ) : (
                            <div className="h-16 w-12 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-[10px] text-slate-400 font-bold">
                              Default
                            </div>
                          )}
                          <span className="text-[9px] mt-1 truncate max-w-full font-semibold">{wp.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  onClick={() => setShowMobileWallpaperPicker((prev) => !prev)}
                  className={`flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/50 cursor-pointer transition hover:bg-slate-100 dark:hover:bg-slate-900 ${showMobileWallpaperPicker ? 'ring-1 ring-primary-500' : ''
                    }`}
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold">Chat Wallpaper</p>
                    <p className="text-[10px] text-slate-500">Choose mobile wallpaper</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedWallpaper ? (
                      <img
                        src={selectedWallpaper}
                        className="h-6 w-5 rounded object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                        alt="Selected Preview"
                      />
                    ) : (
                      <span className="text-[10px] bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-bold dark:text-slate-400">Default</span>
                    )}
                    <MaterialIcon icon="image" size={16} className="text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Display Mode at very bottom */}
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/50">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold">Display Mode</p>
                  <p className="text-[10px] text-slate-500">Light or Dark</p>
                </div>
                <ThemeToggle />
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
          className="relative flex flex-1 min-h-0 flex-col overflow-hidden lg:rounded-lg lg:border lg:border-slate-200/40 lg:dark:border-slate-800/40 chat-area-bg"
        >
          {error && (
            <div className="m-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
              <MaterialIcon icon="close" size={18} />
              <p>{error}</p>
            </div>
          )}

          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
          >
            <div className="mx-auto flex w-full max-w-[832px] min-h-full flex-col justify-end px-4 py-6">
              {notices.map((notice) => (
                <div
                  key={`${notice.createdAt}-${notice.message}`}
                  className="flex justify-center my-2"
                >
                  <span className="rounded-full bg-slate-100 px-4 py-1.5 text-center text-[10px] font-bold tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {notice.message}
                  </span>
                </div>
              ))}

              <MessageList
                notices={notices}
                messages={messages}
                currentUserId={user?.id ?? ''}
                activeReactionMessageId={activeReactionMessageId}
                reactionPickerRef={reactionPickerRef}
                onReply={handleReply}
                onScrollToMessage={scrollToMessage}
                onToggleReaction={toggleReaction}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                onSetReactionPicker={setActiveReactionMessageId}
                onOpenFullscreen={setFullscreenImage}
              />
              {typingNames.length > 0 && (
                <div className="flex items-center gap-2 py-2">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                  </div>
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
              <MaterialIcon icon="arrow_downward" size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-black text-white shadow-lg animate-bounce">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

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
                  opacity: isDark ? 0.16 : 0.08,
                }}
              />
              <div
                className="absolute inset-0 transition-all duration-700 ease-out"
                style={{
                  background: 'radial-gradient(ellipse 80% 60% at 50% 110%, var(--color-primary-container, var(--color-primary)) 0%, transparent 65%)',
                  opacity: isDark ? 0.12 : 0.05,
                }}
              />
            </div>

            {/* Reply Preview */}
            {replyingTo && (
              <div className="mx-auto mb-2.5 flex w-full max-w-[832px] items-center gap-3 overflow-hidden rounded-2xl border border-[var(--color-border)]/60 bg-[var(--color-surface)]/90 backdrop-blur-md p-3 shadow-lg animate-in slide-in-from-bottom-2">
                <div className="h-10 w-1 rounded-full bg-[var(--color-primary)]" />
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-bold text-[var(--color-primary)]">
                    Replying to {replyingTo.sender.name}
                  </p>
                  <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                    {(replyingTo.content.includes('cloudinary.com') || isImageMessage(replyingTo)) ? (
                      <>
                        <MaterialIcon icon="image" size={14} />
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
                  className="rounded-full p-1.5 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)] cursor-pointer"
                >
                  <MaterialIcon icon="close" size={18} />
                </button>
              </div>
            )}

            {/* Hidden File Inputs */}
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
                  title="Attachments"
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
                {messageText.length === 0 && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-y-0 left-1 right-1 flex items-center text-[15px] sm:text-[16px] text-[var(--color-text-muted)] overflow-hidden whitespace-nowrap select-none"
                  >
                    <AnimatedPlaceholder />
                  </div>
                )}
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
      </section>
      {/* Camera Interface */}
      {showCamera && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black animate-in fade-in duration-300">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setShowCamera(false)}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <MaterialIcon icon="close" size={24} />
            </button>
            <span className="font-semibold text-white">Camera</span>
            <button
              onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              title="Switch Camera"
            >
              <MaterialIcon icon="photo_camera" size={24} />
            </button>
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
              <MaterialIcon icon="close" size={40} />
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
            <MaterialIcon icon="close" size={24} />
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
