import { api } from './http';
import type { ChatMessage, Room } from '../types';

export const roomService = {
  async createRoom() {
    const { data } = await api.post<{ message: string; room: Room }>('/rooms');
    return data;
  },

  async joinRoom(roomId: string) {
    const { data } = await api.post<{ message: string; room: Room }>(
      '/rooms/join',
      { roomId }
    );
    return data;
  },

  async getRoom(roomId: string) {
    const { data } = await api.get<{ room: Room }>(`/rooms/${roomId}`);
    return data.room;
  },

  async getMessages(roomId: string) {
    const { data } = await api.get<{ messages: ChatMessage[] }>(
      `/rooms/${roomId}/messages`
    );
    return data.messages;
  },

  async leaveRoom(roomId: string) {
    const { data } = await api.post<{
      message: string;
      room: Room | null;
      deleted: boolean;
    }>(`/rooms/${roomId}/leave`);
    return data;
  },

  async closeRoom(roomId: string) {
    const { data } = await api.post<{ message: string }>(
      `/rooms/${roomId}/close`
    );
    return data;
  },
};
