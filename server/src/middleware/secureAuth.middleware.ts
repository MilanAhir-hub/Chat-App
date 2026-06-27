import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';
import { verifyUnlockToken } from '../utils/secureJwt';
import { SecureParticipant } from '../models/SecureParticipant';

export const requireChatUnlock = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const { chatId } = req.params;
    if (!chatId) {
      throw new AppError('Chat ID is required.', 400);
    }

    if (!req.user) {
      throw new AppError('User authentication required.', 401);
    }

    const unlockToken = req.headers['x-unlock-token'] as string;

    if (!unlockToken) {
      throw new AppError('This secure chat is locked. Please enter password.', 403);
    }

    const decoded = verifyUnlockToken(unlockToken);

    if (!decoded || decoded.chatId !== chatId || decoded.userId !== req.user.id) {
      throw new AppError('Invalid or expired secure chat session. Please unlock again.', 403);
    }

    // Double check that the user is indeed a participant of this secure chat
    const isParticipant = await SecureParticipant.exists({ chatId, userId: req.user.id });
    if (!isParticipant) {
      throw new AppError('You are not authorized to access this secure chat.', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};
