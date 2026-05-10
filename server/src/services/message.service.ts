import { Types } from 'mongoose';
import { env } from '../config/env';
import { Message, type IMessage } from '../models/Message';
import { AppError } from '../utils/AppError';
import { encrypt, decrypt } from '../utils/crypto';
import { assertRoomMember } from './room.service';

export interface MessageDTO {
  id: string;
  roomId: string;
  sender: {
    id: string;
    name: string;
  };
  type: 'text' | 'file';
  content: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  reactions: Array<{
    emoji: string;
    count: number;
    userIds: string[];
  }>;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  createdAt: string;
}

export const formatMessage = (message: IMessage): MessageDTO => ({
  id: message._id.toString(),
  roomId: message.roomId,
  sender: {
    id: message.sender.toString(),
    name: message.senderName,
  },
  type: message.type,
  content: decrypt(message.content),
  fileName: message.fileName,
  fileType: message.fileType,
  fileSize: message.fileSize,
  reactions: message.reactions.map((reaction) => ({
    emoji: reaction.emoji,
    count: reaction.users.length,
    userIds: reaction.users.map((userId) => userId.toString()),
  })),
  replyTo: message.replyTo ? {
    id: message.replyTo.id.toString(),
    content: decrypt(message.replyTo.content),
    senderName: message.replyTo.senderName,
  } : undefined,
  createdAt: message.createdAt.toISOString(),
});

export const getRoomMessages = async (roomId: string, userId: string) => {
  await assertRoomMember(roomId, userId);

  const messages = await Message.find({ roomId })
    .sort({ createdAt: 1 })
    .limit(100);

  return messages.map(formatMessage);
};

export const createTextMessage = async (
  roomId: string,
  senderId: string,
  senderName: string,
  content: string,
  replyTo?: { id: string; content: string; senderName: string }
) => {
  await assertRoomMember(roomId, senderId);

  const cleanContent = content.trim();

  if (!cleanContent) {
    throw new AppError('Message cannot be empty.', 400);
  }

  const message = await Message.create({
    roomId,
    sender: senderId,
    senderName,
    type: 'text',
    content: encrypt(cleanContent),
    replyTo: replyTo ? {
      id: new Types.ObjectId(replyTo.id),
      content: encrypt(replyTo.content),
      senderName: replyTo.senderName,
    } : undefined,
  });

  return formatMessage(message);
};

export const createFileMessage = async (input: {
  roomId: string;
  senderId: string;
  senderName: string;
  dataUrl: string;
  fileName: string;
  fileType?: string;
  fileSize: number;
  replyTo?: { id: string; content: string; senderName: string };
}) => {
  await assertRoomMember(input.roomId, input.senderId);

  if (input.fileSize > env.MAX_FILE_SIZE_BYTES) {
    throw new AppError('File is too large for temporary sharing.', 400);
  }

  const message = await Message.create({
    roomId: input.roomId,
    sender: input.senderId,
    senderName: input.senderName,
    type: 'file',
    content: encrypt(input.dataUrl),
    fileName: input.fileName,
    fileType: input.fileType,
    fileSize: input.fileSize,
    replyTo: input.replyTo ? {
      id: new Types.ObjectId(input.replyTo.id),
      content: encrypt(input.replyTo.content),
      senderName: input.replyTo.senderName,
    } : undefined,
  });

  return formatMessage(message);
};

export const toggleMessageReaction = async (
  messageId: string,
  emoji: string,
  userId: string
) => {
  const message = await Message.findById(messageId);

  if (!message) {
    throw new AppError('Message not found.', 404);
  }

  await assertRoomMember(message.roomId, userId);

  // Find if user already has ANY reaction on this message
  let previousEmoji: string | null = null;
  message.reactions.forEach((reaction) => {
    const userIndex = reaction.users.findIndex(
      (uid) => uid.toString() === userId
    );
    if (userIndex !== -1) {
      previousEmoji = reaction.emoji;
      reaction.users.splice(userIndex, 1);
    }
  });

  // If the new emoji is different from the previous one (or there was no previous), add it
  if (previousEmoji !== emoji) {
    const targetReaction = message.reactions.find((r) => r.emoji === emoji);
    if (targetReaction) {
      targetReaction.users.push(new Types.ObjectId(userId));
    } else {
      message.reactions.push({
        emoji,
        users: [new Types.ObjectId(userId)],
      });
    }
  }

  // Filter out empty reactions
  message.reactions = message.reactions.filter(
    (reaction) => reaction.users.length > 0
  );

  await message.save();
  return formatMessage(message);
};
