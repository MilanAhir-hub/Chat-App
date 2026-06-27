import type { RequestHandler } from 'express';
import { secureChatService } from '../services/secureChat.service';
import { asyncHandler } from '../utils/asyncHandler';

export const searchUsersHandler: RequestHandler = asyncHandler(async (req, res) => {
  const query = (req.query.search as string) || '';
  const currentUserId = req.user!.id;
  
  const users = await secureChatService.searchUsers(query, currentUserId);
  
  res.status(200).json({
    success: true,
    users,
  });
});

export const createSecureChatHandler: RequestHandler = asyncHandler(async (req, res) => {
  const { recipientId, password } = req.body;
  const creatorId = req.user!.id;

  const chat = await secureChatService.createSecureChat(creatorId, recipientId, password);

  res.status(201).json({
    success: true,
    message: 'Secure chat created successfully.',
    chat: {
      id: chat._id.toString(),
      createdBy: chat.createdBy.toString(),
      createdAt: chat.createdAt.toISOString(),
      updatedAt: chat.updatedAt.toISOString(),
    },
  });
});

export const listSecureChatsHandler: RequestHandler = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const chats = await secureChatService.getSecureChatsForUser(userId);

  res.status(200).json({
    success: true,
    chats,
  });
});

export const unlockSecureChatHandler: RequestHandler = asyncHandler(async (req, res) => {
  const chatId = req.params.chatId as string;
  const { password } = req.body;
  const userId = req.user!.id;

  const unlockToken = await secureChatService.verifyAndUnlock(chatId, userId, password);

  res.status(200).json({
    success: true,
    message: 'Chat unlocked successfully.',
    unlockToken,
  });
});

export const getSecureMessagesHandler: RequestHandler = asyncHandler(async (req, res) => {
  const chatId = req.params.chatId as string;
  const userId = req.user!.id;

  const messages = await secureChatService.getSecureMessages(chatId, userId);

  res.status(200).json({
    success: true,
    messages,
  });
});
