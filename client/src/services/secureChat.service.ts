import { api } from './http';
import type { User } from '../types';

export interface SecureChat {
  id: string;
  recipient: User;
  isOnline: boolean;
  lastMessage?: {
    content: string;
    type: 'text' | 'file';
    senderName: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SecureChatMessage {
  id: string;
  chatId: string;
  sender: {
    id: string;
    name: string;
  };
  type: 'text' | 'file';
  content: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  status: 'sending' | 'sent' | 'delivered' | 'seen';
  deliveredTo: string[];
  seenBy: string[];
  tempId?: string;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  createdAt: string;
}

export const secureChatService = {
  async searchUsers(query: string) {
    const { data } = await api.get<{ users: User[] }>(`/secure-chats/users?search=${encodeURIComponent(query)}`);
    return data.users;
  },

  async createSecureChat(recipientId: string, passwordHash: string) {
    const { data } = await api.post<{
      message: string;
      chat: { id: string; createdBy: string; createdAt: string; updatedAt: string };
    }>('/secure-chats', {
      recipientId,
      password: passwordHash,
      confirmPassword: passwordHash,
    });
    return data;
  },

  async getSecureChats() {
    const { data } = await api.get<{ chats: SecureChat[] }>('/secure-chats');
    return data.chats;
  },

  async unlockSecureChat(chatId: string, passwordHash: string) {
    const { data } = await api.post<{ unlockToken: string }>((`/secure-chats/${chatId}/unlock`), {
      password: passwordHash,
    });
    return data.unlockToken;
  },

  async getSecureMessages(chatId: string, unlockToken: string) {
    const { data } = await api.get<{ messages: SecureChatMessage[] }>(
      `/secure-chats/${chatId}/messages`,
      {
        headers: {
          'x-unlock-token': unlockToken,
        },
      }
    );
    return data.messages;
  },
};
