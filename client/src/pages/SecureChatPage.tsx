/* eslint-disable react-hooks/set-state-in-effect */
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
  TickDouble02Icon,
  PaintBrush01Icon,
} from '@hugeicons/core-free-icons';
import EmojiPicker, { Theme, EmojiStyle } from 'emoji-picker-react';
import { ThemeToggle } from '../components/ThemeToggle';
import { ThemeSelector, themes } from '../components/ThemeSelector';
import { Loader } from '../components/Loader';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, getErrorMessage } from '../services/http';
import { secureChatService, type SecureChatMessage, type SecureChat } from '../services/secureChat.service';
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

const formatTime = (dateValue: string) =>
  new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateValue));

const resolveMediaUrl = (url: string) => {
  if (!url.startsWith('/api/')) return url;
  return `${API_BASE_URL.replace(/\/api\/?$/, '')}${url}`;
};

const isSingleEmoji = (str: string): boolean => {
  const flagRegex = /^[\u{1F1E6}-\u{1F1FF}]{2}$/u;
  const emojiRegex = /^(?:(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})(?:[\uFE00-\uFE0F]|[\u{1F3FB}-\u{1F3FF}])*)(?:\u200d(?:(?:\p{Extended_Pictographic}|\p{Emoji_Presentation})(?:[\uFE00-\uFE0F]|[\u{1F3FB}-\u{1F3FF}])*))*$/u;
  const trimmed = str.trim();
  return flagRegex.test(trimmed) || emojiRegex.test(trimmed);
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
        className="pointer-events-none absolute left-[-36px] top-1/2 z-0 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-slate-200 text-slate-500 will-change-transform dark:bg-slate-700 dark:text-slate-400"
      >
        <HugeiconsIcon icon={ArrowTurnBackwardIcon} size={15} />
      </div>

      <div ref={wrapperRef} className="relative z-10 w-fit will-change-transform">
        {children}
      </div>
    </div>
  );
};

export const SecureChatPage = () => {
  const { chatId } = useParams();
  const activeChatId = useMemo(() => (chatId || '').toLowerCase(), [chatId]);
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

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
  const [showMobileColorPicker, setShowMobileColorPicker] = useState(false);
  const { accent, setAccent } = useTheme();

  // Mobile Wallpaper Selector States
  const [selectedWallpaper, setSelectedWallpaper] = useState<string>(() => {
    return localStorage.getItem(`secure_wallpaper_${activeChatId}`) || '';
  });
  const [showMobileWallpaperPicker, setShowMobileWallpaperPicker] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  // typing placeholders
  const placeholder = 'Type a secure message...';

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Track when the user leaves the secure chat, allowing it to stay unlocked only for 20 seconds.
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
      // Cleanup run when leaving the activeChatId context
      if (activeChatId && sessionStorage.getItem(`secure_unlock_${activeChatId}`)) {
        sessionStorage.setItem(`secure_unlock_left_at_${activeChatId}`, Date.now().toString());
      }
    };
  }, [activeChatId]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
    setUnreadCount(0);
    setShowScrollButton(false);
    isAtBottomRef.current = true;
  }, []);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isBottom = scrollHeight - scrollTop - clientHeight < 100;

    isAtBottomRef.current = isBottom;
    setShowScrollButton(!isBottom);

    if (isBottom) {
      setUnreadCount(0);
    }


  }, []);

  useEffect(() => {
    if (isAtBottomRef.current && unlockToken) {
      scrollToBottom('smooth');
    }
  }, [messages, typingUsers, scrollToBottom, unlockToken]);

  const isImageMessage = useCallback((message: SecureChatMessage) => {
    return (
      (message.type === 'file' &&
        (message.fileType?.startsWith('image/') ||
          /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(message.fileName || ''))) ||
      (message.type === 'text' &&
        (/^https?:\/\/.*\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(message.content) ||
          (message.content.includes('cloudinary.com') && /image\/upload/.test(message.content))))
    );
  }, []);

  const scrollToMessage = (id: string) => {
    const element = document.getElementById(`msg-${id}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('bg-emerald-500/20', 'dark:bg-emerald-500/30', 'transition-colors', 'duration-500');
      setTimeout(() => {
        element.classList.remove('bg-emerald-500/20', 'dark:bg-emerald-500/30');
      }, 1500);
    }
  };

  const handleReply = (message: SecureChatMessage) => {
    setReplyingTo(message);
    textareaRef.current?.focus();
  };

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

  // Handle Unlock Action
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

  // Load chat info and message history once unlocked
  useEffect(() => {
    if (!unlockToken) {
      return;
    }

    let isMounted = true;

    const loadChatData = async () => {
      setIsLoading(true);
      try {
        // Fetch secure chats to find this specific one details
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
          // If 403, it means the unlock token expired
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

  // Connect socket and register listeners
  useEffect(() => {
    if (!user || !activeChatId || !unlockToken) {
      return;
    }

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

    // Join room
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

  // Invite Redirect countdown timer
  useEffect(() => {
    if (!tempRoomInvite) return;

    if (inviteCountdown <= 0) {
      // Auto redirect!
      navigate(`/rooms/${tempRoomInvite.roomId}`);
      return;
    }

    const timer = setTimeout(() => {
      setInviteCountdown((c) => c - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [tempRoomInvite, inviteCountdown, navigate]);

  // Seen detection logic
  useEffect(() => {
    if (!user || !messages.length || !unlockToken) return;

    const socket = getSecureSocket();
    if (socket.connected) {
      messages
        .filter((m) => m.sender.id !== user.id && !m.deliveredTo.includes(user.id))
        .forEach((m) => {
          socket.emit('secure:message:delivered', { chatId: activeChatId, messageId: m.id });
        });
    }

    const unreadMessages = messages.filter(
      (m) => m.sender.id !== user.id && !m.seenBy.includes(user.id)
    );

    if (!unreadMessages.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.id.replace('msg-', '');
            const socket = getSecureSocket();
            if (socket.connected) {
              socket.emit('secure:message:seen', { chatId: activeChatId, messageId });
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
  }, [messages, user, unlockToken, activeChatId]);

  // Handle emoji click outside
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

  // Manage visual viewport height to prevent keyboard overlapping input bar
  useEffect(() => {
    if (!window.visualViewport) return;

    const handleResize = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      document.documentElement.style.setProperty('--visual-viewport-height', `${vv.height}px`);
      // Scroll to bottom when keyboard opens
      setTimeout(() => {
        scrollToBottom('auto');
      }, 100);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    // Initial call
    handleResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
      document.documentElement.style.removeProperty('--visual-viewport-height');
    };
  }, [scrollToBottom]);

  // Handle camera trigger
  useEffect(() => {
    if (!showCamera) return;

    const currentVideo = videoRef.current;
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode } },
        });
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
      if (currentVideo?.srcObject) {
        const stream = currentVideo.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
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
      replyTo: replyingTo ? {
        id: replyingTo.id,
        content: replyingTo.content,
        senderName: replyingTo.sender.name,
      } : undefined,
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

    // Refocus input field to keep keyboard open on mobile
    textareaRef.current?.focus();
  };

  const sendFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file || !activeChatId || !user) {
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
        replyTo: replyingTo ? {
          id: replyingTo.id,
          content: replyingTo.content,
          senderName: replyingTo.sender.name,
        } : undefined,
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

  // Create temporary room and invite other user
  const handleGoToTemporaryRoom = async () => {
    if (!chatInfo) return;
    setIsCreatingTempRoom(true);
    setError('');

    try {
      const res = await roomService.createRoom();
      const tempRoomId = res.room.roomId;

      // Broadcast redirect code via secure socket namespace
      getSecureSocket().emit('secure:temp-room-create', {
        chatId: activeChatId,
        tempRoomId,
      });

      // Redirect creator immediately
      navigate(`/rooms/${tempRoomId}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsCreatingTempRoom(false);
    }
  };

  const handleLeaveChat = () => {
    navigate('/dashboard');
  };

  const typingNames = Object.values(typingUsers);

  // 1. LOCKED VIEW
  if (!unlockToken) {
    return (
      <main className="fixed inset-0 flex flex-col items-center justify-center bg-slate-900 text-white p-4">
        <div className="w-full max-w-md rounded-3xl bg-slate-950/80 p-8 text-center border border-slate-800 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-300">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-3xl shadow-inner border border-emerald-500/20 animate-pulse">
            🔒
          </div>
          <h1 className="mb-2 text-2xl font-black tracking-wide text-slate-100 uppercase">
            Secure Chat
          </h1>
          <p className="mb-6 text-xs text-slate-400">
            This conversation is encrypted and locked. Enter password to access.
          </p>

          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Enter password..."
              className="w-full rounded-full border border-slate-800 bg-slate-900/60 px-5 py-4 text-center text-lg tracking-widest outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              required
              autoFocus
            />

            {unlockError && (
              <p className="rounded-xl border border-red-900/30 bg-red-950/20 px-4 py-2.5 text-xs font-semibold text-red-400">
                ⚠️ {unlockError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="flex-1 rounded-full border border-slate-800 bg-transparent py-4 text-xs font-bold uppercase tracking-wider text-slate-400 transition hover:bg-slate-900 hover:text-white"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isUnlocking}
                className="flex-[2] rounded-full bg-emerald-600 py-4 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-500 active:scale-[0.98]"
              >
                {isUnlocking ? 'Unlocking...' : 'Unlock'}
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
      <div className="flex min-h-dvh items-center justify-center bg-slate-950 text-white">
        <Loader size="lg" />
      </div>
    );
  }

  // 3. UNLOCKED CHAT VIEW (Emerald / Purple Accent theme)
  return (
    <main
      style={{ height: 'var(--visual-viewport-height, 100dvh)' }}
      className="fixed top-0 left-0 right-0 w-full flex flex-col bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white overflow-hidden"
    >
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/98 px-3 py-0 shadow-sm backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/98 sm:px-6">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 sm:gap-4">
          {/* Identity */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowSidebar((prev) => !prev)}
              className="rounded-full p-2 text-slate-500 transition-all duration-150 hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100 lg:hidden"
              title="Toggle Sidebar"
            >
              <HugeiconsIcon icon={Menu01Icon} size={20} />
            </button>

            <div className="flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <h1 className="text-sm font-extrabold truncate text-slate-900 dark:text-white sm:text-base max-w-[140px] sm:max-w-xs">
                  {chatInfo?.recipient.name}
                </h1>
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${
                    chatInfo?.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
                  }`}
                  title={chatInfo?.isOnline ? 'Online' : 'Offline'}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 sm:gap-1.5">
            {/* Go to Temporary Room Shortcut */}
            <button
              type="button"
              onClick={handleGoToTemporaryRoom}
              disabled={isCreatingTempRoom}
              className="flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-950/20 px-2.5 py-1.5 text-[11px] font-extrabold text-emerald-400 shadow-sm transition hover:bg-emerald-500 hover:text-white active:scale-95 disabled:opacity-40"
              title="Create a temporary rooms workspace for this conversation"
            >
              <span>⚡</span>
              <span className="hidden sm:inline">Go to Temporary Room</span>
              <span className="sm:hidden">Temp Room</span>
            </button>

            <div className="hidden items-center gap-0.5 lg:flex">
              <ThemeSelector />
              <ThemeToggle />
            </div>

            <button
              type="button"
              onClick={() => setSoundEnabled((current) => !current)}
              className="hidden rounded-full p-2 text-slate-500 transition-all duration-150 hover:bg-slate-100 hover:text-slate-900 active:scale-95 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100 sm:block"
              title={soundEnabled ? 'Mute' : 'Unmute'}
            >
              <HugeiconsIcon icon={soundEnabled ? VolumeHighIcon : VolumeMuteIcon} size={20} />
            </button>

            <button
              type="button"
              onClick={handleLeaveChat}
              className="ml-1 flex items-center gap-1.5 rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-150 hover:bg-slate-700 active:scale-95 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white sm:px-4 sm:text-sm"
            >
              <HugeiconsIcon icon={ArrowLeft02Icon} size={16} />
              <span className="hidden sm:inline">Back</span>
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-7xl flex-1 overflow-hidden lg:gap-4 lg:p-4">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-35 w-72 transform border-r border-slate-200 bg-white transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-950 lg:static lg:block lg:w-72 lg:translate-x-0 lg:rounded-lg lg:border
            ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex h-full flex-col p-5">
            <div className="sticky top-0 z-10 mb-6 flex items-center justify-between py-1 bg-white dark:bg-slate-950">
              <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                <HugeiconsIcon icon={UserGroupIcon} size={18} />
                Participants
              </h2>
              <button onClick={() => setShowSidebar(false)} className="lg:hidden">
                <HugeiconsIcon icon={Cancel01Icon} size={20} />
              </button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin">
              {/* Recipient */}
              <div className="rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{chatInfo?.recipient.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${
                      chatInfo?.isOnline
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {chatInfo?.isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">{chatInfo?.recipient.email}</p>
              </div>

              {/* Me */}
              <div className="rounded-xl border border-slate-100 px-4 py-3 dark:border-slate-800/50 bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{user?.name} (You)</span>
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-500/20">
                    Online
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">{user?.email}</p>
              </div>
            </div>

            {/* Mobile Appearance and Theme Settings */}
            <div className="mt-auto space-y-4 border-t border-slate-800 pt-6 lg:hidden">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Appearance
                </p>
              </div>

              {/* Chat Background Trigger with collapsible panel directly above it */}
              <div className="relative">
                {showMobileColorPicker && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-xl z-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                        <HugeiconsIcon icon={PaintBrush01Icon} size={14} />
                        Choose Vibe
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMobileColorPicker(false);
                        }}
                        className="rounded-full p-1 hover:bg-slate-800"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={16} />
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
                          <span className="h-full w-full rounded-full shadow-sm border border-slate-850" style={{ backgroundColor: themeOption.color }} />
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
                  className={`flex items-center justify-between rounded-2xl bg-slate-900/50 p-4 cursor-pointer transition hover:bg-slate-900 ${showMobileColorPicker ? 'ring-1 ring-primary-500' : ''
                    }`}
                >
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold">Chat Background</p>
                    <p className="text-[10px] text-slate-500">Choose your vibe</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-6 w-6 rounded-full border border-slate-850 shadow-sm"
                      style={{ backgroundColor: themes.find((t) => t.value === accent)?.color || accent }}
                    />
                    <HugeiconsIcon icon={PaintBrush01Icon} size={16} className="text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Chat Wallpaper Trigger with collapsible panel directly above it */}
              <div className="relative">
                {showMobileWallpaperPicker && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl bg-white border border-slate-200 p-4 dark:bg-slate-950 dark:border-slate-800 shadow-xl z-20 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <HugeiconsIcon icon={Image01Icon} size={14} className="text-primary-500" />
                        Choose Wallpaper
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowMobileWallpaperPicker(false);
                        }}
                        className="rounded-full p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <HugeiconsIcon icon={Cancel01Icon} size={16} />
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
                    <HugeiconsIcon icon={Image01Icon} size={16} className="text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Display Mode at very bottom */}
              <div className="flex items-center justify-between rounded-2xl bg-slate-900/50 p-4">
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
            className="fixed inset-0 z-30 bg-slate-950/50 backdrop-blur-sm lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

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
          className="relative flex flex-1 flex-col overflow-hidden lg:rounded-lg lg:border lg:border-slate-200 lg:dark:border-slate-800 chat-area-bg"
        >
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
            <div className="flex min-h-full flex-col justify-end px-4 py-6 space-y-3">
              <div className="flex justify-center my-4">
                <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-4 py-1.5 text-center text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 uppercase">
                  🔒 Chats are secure & persistent.
                </span>
              </div>

              {messages.map((message) => {
                const isMine = message.sender.id === user?.id;

                return (
                  <article
                    key={message.id}
                    id={`msg-${message.id}`}
                    className={`flex animate-in fade-in slide-in-from-bottom-2 duration-300 ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <SwipeableMessage isMine={isMine} onReply={() => handleReply(message)}>
                      <div
                        className={`group relative flex flex-col transition-opacity duration-300 ${isMine ? 'items-end' : 'items-start'} ${message.status === 'sending' ? 'opacity-70' : 'opacity-100'}`}
                      >
                        <div
                          className={`message-bubble ${
                            isMine ? 'message-bubble-mine' : 'message-bubble-other'
                          } ${
                            message.type === 'file' || isImageMessage(message)
                              ? 'message-bubble-media'
                              : (message.type === 'text' && isSingleEmoji(message.content) && !message.replyTo)
                                ? 'message-bubble-emoji-only'
                                : 'message-bubble-text'
                          }`}
                        >
                          <div className="flex flex-col relative">
                            {/* Reply preview inside bubble */}
                            {message.replyTo && (
                              <div
                                onClick={() => message.replyTo && scrollToMessage(message.replyTo.id)}
                                className="reply-preview-bubble text-left"
                              >
                                <p className="font-extrabold text-emerald-600 dark:text-emerald-400 mb-0.5">
                                  {message.replyTo.senderName}
                                </p>
                                <div className="flex items-center gap-1.5 opacity-90">
                                  {(message.replyTo.content.includes('cloudinary.com') || /\.(jpg|jpeg|png|gif|webp|svg)/i.test(message.replyTo.content)) ? (
                                    <>
                                      <HugeiconsIcon icon={Image01Icon} size={14} />
                                      <span className="text-[11px] italic text-slate-350">Photo</span>
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
                                isMine ? '-left-12' : '-right-12'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleReply(message)}
                                className="rounded-full bg-slate-800 p-2 text-slate-400 hover:text-white transition active:scale-90"
                                title="Reply"
                              >
                                <HugeiconsIcon icon={ArrowTurnBackwardIcon} size={16} />
                              </button>
                            </div>

                            {/* Message rendering */}
                            {isImageMessage(message) ? (
                              <div
                                onClick={() => setFullscreenImage(resolveMediaUrl(message.content))}
                                className="media-container group/media"
                              >
                                <img
                                  src={resolveMediaUrl(message.content)}
                                  alt={message.fileName || 'Image'}
                                  className="max-h-[300px] w-full min-w-[180px] object-cover transition-all duration-500 group-hover/media:scale-105"
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
                                className="flex items-center gap-3 rounded-xl border border-white/20 bg-black/5 p-3 text-sm font-medium transition hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 mb-2"
                              >
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                                  <HugeiconsIcon icon={ImageAdd01Icon} size={18} />
                                </div>
                                <div className="overflow-hidden text-left">
                                  <p className="truncate font-bold text-slate-200">{message.fileName || 'file'}</p>
                                  <p className="text-[9px] opacity-75 uppercase font-black tracking-wider">{formatFileSize(message.fileSize)}</p>
                                </div>
                              </a>
                            ) : (
                              <div className="block text-left">
                                <span className="message-content">
                                  {message.content}
                                </span>
                              </div>
                            )}

                            {/* Timestamp & Seen Ticks */}
                            {!(message.type === 'text' && isSingleEmoji(message.content) && !message.replyTo) && (
                              <div className="message-meta">
                                <span className="message-timestamp">
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

                            {/* Emoji-only Meta */}
                            {(message.type === 'text' && isSingleEmoji(message.content) && !message.replyTo) && (
                              <div className="message-meta">
                                <span className="message-timestamp">
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
                                      size={14}
                                      className={`
                                        ${message.status === 'seen' ? 'text-sky-400' : 'text-slate-400'}
                                        ${message.status === 'sending' ? 'animate-pulse' : ''}
                                      `}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </SwipeableMessage>
                  </article>
                );
              })}

              {typingNames.length > 0 && (
                <div className="flex items-center gap-2 py-1">
                  <div className="flex gap-1.5 bg-slate-900 border border-slate-800 rounded-full px-3 py-1.5 items-center">
                    <span className="text-[10px] text-slate-400">{typingNames[0]} is typing</span>
                    <div className="flex gap-0.5">
                      <span className="h-1 w-1 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                      <span className="h-1 w-1 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                      <span className="h-1 w-1 animate-bounce rounded-full bg-slate-400" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Scroll to bottom */}
          {showScrollButton && (
            <button
              onClick={() => scrollToBottom('smooth')}
              className="absolute bottom-24 right-6 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-300 shadow-xl transition hover:scale-105 active:scale-95 hover:bg-slate-850"
            >
              <HugeiconsIcon icon={ArrowDown01Icon} size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -left-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-emerald-600 text-[9px] font-black text-white shadow-lg animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Input Form */}
          <form
            onSubmit={sendMessage}
            className="border-t border-slate-850 bg-slate-950 p-3 relative sm:p-4"
          >
            {/* Reply banner preview */}
            {replyingTo && (
              <div className="mx-auto mb-3 flex max-w-7xl items-center gap-3 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-2.5 animate-in slide-in-from-bottom-2">
                <div className="h-8 w-1 rounded-full bg-emerald-500" />
                <div className="flex-1 overflow-hidden text-left">
                  <p className="text-[10px] font-bold text-emerald-400">
                    Replying to {replyingTo.sender.name}
                  </p>
                  <p className="truncate text-xs opacity-75">
                    {replyingTo.content.includes('cloudinary.com') ? 'Photo' : replyingTo.content}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  <HugeiconsIcon icon={Cancel01Icon} size={16} />
                </button>
              </div>
            )}

            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-full left-0 right-0 z-50 mb-3 px-2 sm:left-4 sm:right-auto sm:w-fit sm:px-0 animate-in fade-in slide-in-from-bottom-4"
              >
                <div className="overflow-hidden rounded-2xl shadow-2xl">
                  <EmojiPicker
                    theme={theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                    emojiStyle={EmojiStyle.APPLE}
                    width="100%"
                    height={320}
                    onEmojiClick={(emojiData) => {
                      setMessageText((current) => current + emojiData.emoji);
                    }}
                  />
                </div>
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
                  className={`rounded-full p-2.5 transition-all active:scale-90 ${showAttachmentMenu
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30'
                    : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                    }`}
                  title="Attachments"
                >
                  <HugeiconsIcon
                    icon={Add01Icon}
                    size={24}
                    className={`transition-transform duration-300 ${
                      showAttachmentMenu ? 'rotate-45' : ''
                    }`}
                  />
                </button>

                {showAttachmentMenu && (
                  <div
                    className="absolute bottom-full left-0 mb-4 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-200 dark:border-slate-800 dark:bg-slate-900 z-[60]"
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
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500/10 text-primary-600">
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
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500/10 text-primary-600">
                        <HugeiconsIcon icon={Camera01Icon} size={20} />
                      </div>
                      Camera
                    </button>
                  </div>
                )}
              </div>

              {/* Text Input Container */}
              <div className="relative flex-1 flex items-end bg-slate-100 dark:bg-slate-900 rounded-full px-3 py-1 transition-all focus-within:ring-1 focus-within:ring-primary-500/50">
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
        <div className="fixed inset-0 z-50 flex flex-col bg-black animate-in fade-in duration-300">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setShowCamera(false)}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <HugeiconsIcon icon={Cancel01Icon} size={24} />
            </button>
            <span className="font-semibold text-white">Camera</span>
            <button
              onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <HugeiconsIcon icon={Camera01Icon} size={24} />
            </button>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="flex flex-col items-center justify-center p-8 pb-12">
            <button
              onClick={handleCapture}
              className="h-20 w-20 rounded-full border-4 border-white p-1 transition active:scale-90"
            >
              <div className="h-full w-full rounded-full bg-white" />
            </button>
            <p className="mt-4 text-xs text-white/60">Click to take picture</p>
          </div>
        </div>
      )}

      {/* Temporary Room Redirect Modal */}
      {tempRoomInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-350">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 p-8 text-center border border-slate-800 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-3xl">
              ⚡
            </div>
            <h2 className="mb-2 text-xl font-black text-slate-100 uppercase tracking-wide">
              Joining Workspace...
            </h2>
            <p className="mb-8 text-xs text-slate-400 leading-relaxed">
              <strong>{tempRoomInvite.createdBy}</strong> has initiated a temporary room session.{' '}
              Redirecting you to temporary workspace in{' '}
              <strong className="text-emerald-400 text-base">{inviteCountdown}s</strong>...
            </p>
            <button
              onClick={() => navigate(`/rooms/${tempRoomInvite.roomId}`)}
              className="w-full rounded-full bg-emerald-600 py-4 text-xs font-bold uppercase tracking-wider text-white hover:bg-emerald-500 transition active:scale-[0.98]"
            >
              Join Now
            </button>
            <button
              onClick={() => setTempRoomInvite(null)}
              className="mt-3 w-full rounded-full bg-slate-850 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:bg-slate-800 transition"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Fullscreen Image Portal */}
      {fullscreenImage &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-300"
            onClick={() => setFullscreenImage(null)}
          >
            <button
              className="absolute top-6 right-6 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
              onClick={() => setFullscreenImage(null)}
            >
              <HugeiconsIcon icon={Cancel01Icon} size={24} />
            </button>
            <div className="relative h-full w-full flex items-center justify-center p-6">
              <img
                src={fullscreenImage}
                alt="Fullscreen"
                className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>,
          document.body
        )}
    </main>
  );
};
