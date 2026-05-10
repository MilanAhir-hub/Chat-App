import { z } from 'zod';
import { env } from '../config/env';

const roomIdSchema = z
  .string()
  .trim()
  .transform((roomId) => roomId.toUpperCase())
  .pipe(
    z
      .string()
      .length(6, 'Room ID must be 6 characters.')
      .regex(/^[A-Z0-9]{6}$/, 'Room ID can only contain letters and numbers.')
  );

const objectIdSchema = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Invalid message ID.');

export const joinRoomSchema = {
  body: z.object({
    roomId: roomIdSchema,
  }),
};

export const roomParamsSchema = {
  params: z.object({
    roomId: roomIdSchema,
  }),
};

export const sendTextMessageSchema = z.object({
  roomId: roomIdSchema,
  content: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty.')
    .max(2000, 'Message cannot be longer than 2000 characters.'),
  replyTo: z.object({
    id: objectIdSchema,
    content: z.string().trim(),
    senderName: z.string().trim(),
  }).optional(),
  tempId: z.string().trim().optional(),
});

export const sendFileMessageSchema = z.object({
  roomId: roomIdSchema,
  dataUrl: z
    .string()
    .startsWith('data:', 'File payload must be a data URL.')
    .max(env.MAX_FILE_SIZE_BYTES * 2, 'Encoded file is too large.'),
  fileName: z
    .string()
    .trim()
    .min(1, 'File name is required.')
    .max(120, 'File name is too long.'),
  fileType: z.string().trim().max(120).optional(),
  fileSize: z
    .number()
    .int()
    .positive()
    .max(env.MAX_FILE_SIZE_BYTES, 'File is too large for temporary sharing.'),
  replyTo: z.object({
    id: objectIdSchema,
    content: z.string().trim(),
    senderName: z.string().trim(),
  }).optional(),
  tempId: z.string().trim().optional(),
});

export const reactionSchema = z.object({
  messageId: objectIdSchema,
  emoji: z.string().trim().min(1).max(12),
});
