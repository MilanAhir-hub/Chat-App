import { Types } from 'mongoose';
import { env } from '../config/env';
import { Message, type IMessage } from '../models/Message';
import { AppError } from '../utils/AppError';
import { encrypt, decrypt } from '../utils/crypto';
import { encryptImageBuffer, IV_HEX_LENGTH } from '../utils/imageCrypto';
import { assertRoomMember, touchRoom } from './room.service';
import { cloudinaryService } from './cloudinary.service';

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
  status: 'sent' | 'delivered' | 'seen';
  deliveredTo: string[];
  seenBy: string[];
  tempId?: string;
  createdAt: string;
}

export const formatMessage = (message: IMessage): MessageDTO => {
  const messageId = message._id.toString();
  const decryptedContent = decrypt(message.content);
  const isEncryptedImage =
    message.type === 'file' &&
    message.fileType?.startsWith('image/') &&
    decryptedContent.length > IV_HEX_LENGTH &&
    /^[0-9a-f]+$/i.test(decryptedContent.slice(0, IV_HEX_LENGTH));

  return {
    id: messageId,
    roomId: message.roomId,
    sender: {
      id: message.sender.toString(),
      name: message.senderName,
    },
    type: message.type,
    content: isEncryptedImage ? `/api/images/${messageId}` : decryptedContent,
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
    status: message.seenBy.length > 0 ? 'seen' : (message.deliveredTo.length > 0 ? 'delivered' : 'sent'),
    deliveredTo: message.deliveredTo.map(id => id.toString()),
    seenBy: message.seenBy.map(id => id.toString()),
    tempId: message.tempId,
    createdAt: message.createdAt.toISOString(),
  };
};

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
  replyTo?: { id: string; content: string; senderName: string },
  tempId?: string
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
    tempId,
  });

  await touchRoom(roomId);
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
  tempId?: string;
}) => {
  await assertRoomMember(input.roomId, input.senderId);

  if (input.fileSize > env.MAX_FILE_SIZE_BYTES) {
    throw new AppError('File is too large for temporary sharing.', 400);
  }

  let uploadDataUrl = input.dataUrl;
  let imageIvHex: string | undefined;

  if (input.fileType?.startsWith('image/')) {
    const base64Data = input.dataUrl.replace(/^data:[^;]+;base64,/, '');
    const originalBuffer = Buffer.from(base64Data, 'base64');
    const { encryptedBuffer, iv } = encryptImageBuffer(originalBuffer);

    imageIvHex = iv;
    uploadDataUrl = `data:application/octet-stream;base64,${encryptedBuffer.toString('base64')}`;

    console.info('[image-encrypt]', {
      mimetype: input.fileType,
      originalBytes: originalBuffer.length,
      encryptedBytes: encryptedBuffer.length,
      originalHeader: originalBuffer.subarray(0, 8).toString('hex'),
      encryptedHeader: encryptedBuffer.subarray(0, 8).toString('hex'),
    });
  }

  // Upload the encrypted file to Cloudinary
  const folder = `chattogram_rooms/${input.roomId}`;
  const cloudinaryResult = await cloudinaryService.uploadFile(
    uploadDataUrl,
    folder,
    input.roomId,
    imageIvHex ? 'raw' : 'auto'
  );
  const contentToStore = imageIvHex
    ? imageIvHex + cloudinaryResult.secure_url
    : cloudinaryResult.secure_url;

  console.info('[image-upload-result]', {
    secure_url: cloudinaryResult.secure_url,
    encryptedImage: Boolean(imageIvHex),
  });

  const message = await Message.create({
    roomId: input.roomId,
    sender: input.senderId,
    senderName: input.senderName,
    type: 'file',
    content: encrypt(contentToStore), // Store IV + encrypted Cloudinary URL for images
    cloudinaryPublicId: cloudinaryResult.public_id, // Store ID for cleanup
    fileName: input.fileName,
    fileType: input.fileType,
    fileSize: input.fileSize,
    replyTo: input.replyTo ? {
      id: new Types.ObjectId(input.replyTo.id),
      content: encrypt(input.replyTo.content),
      senderName: input.replyTo.senderName,
    } : undefined,
    tempId: input.tempId,
  });

  await touchRoom(input.roomId);
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
  const updatedReactions = message.reactions.filter(
    (reaction) => reaction.users.length > 0
  );
  
  // Reassign and mark as modified for Mongoose to track subdocument changes
  message.reactions = updatedReactions as any;
  message.markModified('reactions');

  await message.save();
  await touchRoom(message.roomId);
  return formatMessage(message);
};

export const markMessageAsDelivered = async (messageId: string, userId: string) => {
  const message = await Message.findById(messageId);
  if (!message) return null;

  // Don't mark as delivered if it's the sender
  if (message.sender.toString() === userId) return formatMessage(message);

  if (!message.deliveredTo.some((id) => id.toString() === userId)) {
    message.deliveredTo.push(new Types.ObjectId(userId));
    await message.save();
  }

  return formatMessage(message);
};

export const markMessageAsSeen = async (messageId: string, userId: string) => {
  const message = await Message.findById(messageId);
  if (!message) return null;

  // Don't mark as seen if it's the sender
  if (message.sender.toString() === userId) return formatMessage(message);

  let updated = false;

  // Ensure it's also marked as delivered if it's being seen
  if (!message.deliveredTo.some((id) => id.toString() === userId)) {
    message.deliveredTo.push(new Types.ObjectId(userId));
    updated = true;
  }

  if (!message.seenBy.some((id) => id.toString() === userId)) {
    message.seenBy.push(new Types.ObjectId(userId));
    updated = true;
  }

  if (updated) {
    await message.save();
  }

  return formatMessage(message);
};
