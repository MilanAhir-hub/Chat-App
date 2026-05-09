import type { RequestHandler } from 'express';
import { loginUser, registerUser } from '../services/auth.service';
import { clearAuthCookie, setAuthCookie } from '../utils/cookies';
import { signToken } from '../utils/jwt';
import { asyncHandler } from '../utils/asyncHandler';

export const register: RequestHandler = asyncHandler(async (req, res) => {
  const user = await registerUser(req.body);
  const token = signToken(user.id);

  setAuthCookie(res, token);

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    user,
  });
});

export const login: RequestHandler = asyncHandler(async (req, res) => {
  const user = await loginUser(req.body);
  const token = signToken(user.id);

  setAuthCookie(res, token);

  res.status(200).json({
    success: true,
    message: 'Logged in successfully.',
    user,
  });
});

export const logout: RequestHandler = (_req, res) => {
  clearAuthCookie(res);

  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

export const getCurrentUser: RequestHandler = (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};
