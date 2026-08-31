import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { ChatMessage, Room, RoomNotice } from '../types';
import type {
  VideoCallEndedPayload,
  VideoCallStartedPayload,
  VideoMediaState,
  VideoMediaStatePayload,
  VideoParticipant,
  VideoPeerJoinedPayload,
  VideoPeerLeftPayload,
  VideoSignalPayload,
} from '../features/video-call/types';

interface AckResponse<T = unknown> {
  ok: boolean;
  message?: string;
  data?: T;
}

interface ServerToClientEvents {
  'room:state': (room: Room) => void;
  'room:notice': (notice: RoomNotice) => void;
  'room:closed': (notice: RoomNotice & { roomId: string }) => void;
  'message:new': (message: ChatMessage) => void;
  'message:updated': (message: ChatMessage) => void;
  'typing:update': (payload: {
    userId: string;
    name: string;
    isTyping: boolean;
  }) => void;
  'video:call-started': (payload: VideoCallStartedPayload) => void;
  'video:call-ended': (payload: VideoCallEndedPayload) => void;
  'video:peer-joined': (payload: VideoPeerJoinedPayload) => void;
  'video:peer-left': (payload: VideoPeerLeftPayload) => void;
  'video:signal': (payload: VideoSignalPayload) => void;
  'video:media-state': (payload: VideoMediaStatePayload) => void;
  'socket:error': (payload: { message: string }) => void;
}

interface ClientToServerEvents {
  'room:join': (
    payload: { roomId: string },
    ack?: (response: AckResponse<Room>) => void
  ) => void;
  'room:leave': (
    payload: { roomId: string },
    ack?: (response: AckResponse) => void
  ) => void;
  'message:send': (
    payload: {
      roomId: string;
      content: string;
      replyTo?: { id: string; content: string; senderName: string };
      tempId?: string;
    },
    ack?: (response: AckResponse<ChatMessage>) => void
  ) => void;
  'file:send': (
    payload: {
      roomId: string;
      dataUrl: string;
      fileName: string;
      fileType?: string;
      fileSize: number;
      replyTo?: { id: string; content: string; senderName: string };
      tempId?: string;
    },
    ack?: (response: AckResponse<ChatMessage>) => void
  ) => void;
  'message:react': (
    payload: { messageId: string; emoji: string },
    ack?: (response: AckResponse<ChatMessage>) => void
  ) => void;
  'typing:start': (payload: { roomId: string }) => void;
  'typing:stop': (payload: { roomId: string }) => void;
  'message:delivered': (payload: { messageId: string }) => void;
  'message:seen': (payload: { messageId: string }) => void;
  'video:join': (
    payload: { roomId: string; media: VideoMediaState },
    ack?: (
      response: AckResponse<{ participants: VideoParticipant[] }>
    ) => void
  ) => void;
  'video:leave': (
    payload: { roomId: string },
    ack?: (response: AckResponse) => void
  ) => void;
  'video:signal': (payload: {
    roomId: string;
    to: string;
    type: 'offer' | 'answer' | 'ice-candidate';
    description?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
  }) => void;
  'video:media-state': (payload: {
    roomId: string;
    media: Partial<VideoMediaState>;
  }) => void;
}

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_SOCKET_URL;
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `http://${window.location.hostname}:5000`;
  }
  return envUrl || 'http://localhost:5000';
};

const socketUrl = getSocketUrl();

let socket: AppSocket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(socketUrl, {
      autoConnect: false,
      withCredentials: true,
      auth: {
        token: localStorage.getItem('chat_app_token'),
      },
    });
  }

  return socket;
};

export const connectSocket = () => {
  const activeSocket = getSocket();

  if (!activeSocket.connected) {
    activeSocket.connect();
  }

  return activeSocket;
};

export const disconnectSocket = () => {
  if (socket?.connected) {
    socket.disconnect();
  }
};
