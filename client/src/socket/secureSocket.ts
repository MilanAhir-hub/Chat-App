import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { SecureChatMessage } from '../services/secureChat.service';

interface AckResponse<T = unknown> {
  ok: boolean;
  message?: string;
  data?: T;
}

interface SecureServerToClientEvents {
  'secure:message:new': (message: SecureChatMessage) => void;
  'secure:message:updated': (message: SecureChatMessage) => void;
  'secure:typing:update': (payload: {
    userId: string;
    name: string;
    isTyping: boolean;
  }) => void;
  'secure:user:status': (payload: {
    userId: string;
    status: 'online' | 'offline';
  }) => void;
  'secure:temp-room-invite': (payload: {
    chatId: string;
    tempRoomId: string;
    createdBy: string;
  }) => void;
  'secure:error': (payload: { message: string }) => void;
}

interface SecureClientToServerEvents {
  'secure:join': (
    payload: { chatId: string; unlockToken: string },
    ack?: (response: AckResponse) => void
  ) => void;
  'secure:message:send': (
    payload: {
      chatId: string;
      content: string;
      replyTo?: { id: string; content: string; senderName: string };
      tempId?: string;
    },
    ack?: (response: AckResponse<SecureChatMessage>) => void
  ) => void;
  'secure:file:send': (
    payload: {
      chatId: string;
      dataUrl: string;
      fileName: string;
      fileType?: string;
      fileSize: number;
      replyTo?: { id: string; content: string; senderName: string };
      tempId?: string;
    },
    ack?: (response: AckResponse<SecureChatMessage>) => void
  ) => void;
  'secure:typing:start': (payload: { chatId: string }) => void;
  'secure:typing:stop': (payload: { chatId: string }) => void;
  'secure:message:delivered': (payload: { chatId: string; messageId: string }) => void;
  'secure:message:seen': (payload: { chatId: string; messageId: string }) => void;
  'secure:temp-room-create': (payload: { chatId: string; tempRoomId: string }) => void;
  'secure:leave': (payload: { chatId: string }, ack?: (response: AckResponse) => void) => void;
}

export type SecureAppSocket = Socket<SecureServerToClientEvents, SecureClientToServerEvents>;

const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let secureSocket: SecureAppSocket | null = null;

export const getSecureSocket = () => {
  if (!secureSocket) {
    secureSocket = io(`${socketUrl}/secure`, {
      autoConnect: false,
      withCredentials: true,
      auth: {
        token: localStorage.getItem('chat_app_token'),
      },
    });
  }

  // Ensure token is updated in handshake auth if it changed
  const token = localStorage.getItem('chat_app_token');
  if (token) {
    secureSocket.auth = { token };
  }

  return secureSocket;
};

export const connectSecureSocket = () => {
  const activeSocket = getSecureSocket();

  if (!activeSocket.connected) {
    activeSocket.connect();
  }

  return activeSocket;
};

export const disconnectSecureSocket = () => {
  if (secureSocket?.connected) {
    secureSocket.disconnect();
  }
};
