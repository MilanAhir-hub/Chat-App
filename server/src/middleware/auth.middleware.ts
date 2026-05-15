import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { verifyToken } from '../utils/jwt';

export const protect = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    let token = req.cookies?.[env.COOKIE_NAME];

    if (!token && req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Please login to continue.', 401);
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('name email credits');

    if (!user) {
      throw new AppError('The user for this session no longer exists.', 401);
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      credits: user.credits,
    };

    next();
  } catch (error) {
    next(error);
  }
};
