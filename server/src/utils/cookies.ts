import type { Response } from 'express';
import { env, isProduction } from '../config/env';

export const setAuthCookie = (res: Response, token: string) => {
  res.cookie(env.COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: env.COOKIE_MAX_AGE_MS,
  });
};

export const clearAuthCookie = (res: Response) => {
  res.clearCookie(env.COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
  });
};
