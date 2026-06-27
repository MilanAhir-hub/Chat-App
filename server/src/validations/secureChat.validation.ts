import { z } from 'zod';

export const createSecureChatSchema = {
  body: z.object({
    recipientId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid recipient ID format.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long.')
      .max(128, 'Password cannot be longer than 128 characters.'),
    confirmPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters long.')
      .max(128, 'Password cannot be longer than 128 characters.'),
  }).refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  }),
};

export const unlockSecureChatSchema = {
  body: z.object({
    password: z.string().min(1, 'Password is required.'),
  }),
};

export const secureChatParamsSchema = {
  params: z.object({
    chatId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid chat ID format.'),
  }),
};
