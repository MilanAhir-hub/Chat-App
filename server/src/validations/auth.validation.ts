import { z } from 'zod';

export const registerSchema = {
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters long.')
      .max(60, 'Name cannot be longer than 60 characters.'),
    email: z
      .string()
      .trim()
      .email('Please enter a valid email address.')
      .toLowerCase(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long.')
      .max(128, 'Password cannot be longer than 128 characters.'),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z
      .string()
      .trim()
      .email('Please enter a valid email address.')
      .toLowerCase(),
    password: z.string().min(1, 'Password is required.'),
  }),
};
