import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { ChatMessage, Room, RoomNotice } from '../types';

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
    payload: { roomId: string; content: string },
    ack?: (response: AckResponse<ChatMessage>) => void
  ) => void;
  'file:send': (
    payload: {
      roomId: string;
      dataUrl: string;
      fileName: string;
      fileType?: string;
      fileSize: number;
    },
    ack?: (response: AckResponse<ChatMessage>) => void
  ) => void;
  'message:react': (
    payload: { messageId: string; emoji: string },
    ack?: (response: AckResponse<ChatMessage>) => void
  ) => void;
  'typing:start': (payload: { roomId: string }) => void;
  'typing:stop': (payload: { roomId: string }) => void;
}

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket: AppSocket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(socketUrl, {
      autoConnect: false,
      withCredentials: true,
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
