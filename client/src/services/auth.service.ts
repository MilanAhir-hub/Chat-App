import { api } from './http';
import type { User } from '../types';

interface AuthPayload {
  email: string;
  password: string;
}

interface RegisterPayload extends AuthPayload {
  name: string;
}

interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export const authService = {
  async register(payload: RegisterPayload) {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    return data;
  },

  async login(payload: AuthPayload) {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    return data;
  },

  async logout() {
    const { data } = await api.post<{ message: string }>('/auth/logout');
    return data;
  },

  async me() {
    const { data } = await api.get<{ user: User }>('/auth/me');
    return data.user;
  },
};
