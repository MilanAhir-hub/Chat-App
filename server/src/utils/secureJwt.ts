import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface SecureUnlockPayload {
  chatId: string;
  userId: string;
}

export const signUnlockToken = (chatId: string, userId: string): string => {
  return jwt.sign({ chatId, userId }, env.JWT_SECRET, {
    expiresIn: '1h', // Valid for 1 hour
  });
};

export const verifyUnlockToken = (token: string): SecureUnlockPayload | null => {
  try {
    return jwt.verify(token, env.JWT_SECRET) as SecureUnlockPayload;
  } catch {
    return null;
  }
};
