// this is auth service page

import { User, type IUser } from '../models/User';
import type { AuthUser } from '../types/auth';
import { AppError } from '../utils/AppError';

interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export const toAuthUser = (user: IUser): AuthUser => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
});

export const registerUser = async (input: RegisterInput) => {
  const existingUser = await User.findOne({ email: input.email });

  if (existingUser) {
    throw new AppError('An account with this email already exists.', 409);
  }

  const user = await User.create(input);
  return toAuthUser(user);
};

export const loginUser = async (input: LoginInput) => {
  const user = await User.findOne({ email: input.email }).select('+password');

  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const passwordMatches = await user.comparePassword(input.password);

  if (!passwordMatches) {
    throw new AppError('Invalid email or password.', 401);
  }

  return toAuthUser(user);
};
