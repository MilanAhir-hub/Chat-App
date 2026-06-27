import { Types } from 'mongoose';
import bcrypt from 'bcrypt';
import { SecureChat, type ISecureChat } from '../models/SecureChat';
import { SecureParticipant } from '../models/SecureParticipant';
import { SecureMessage, type ISecureMessage } from '../models/SecureMessage';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import { signUnlockToken } from '../utils/secureJwt';
import { encrypt, decrypt } from '../utils/crypto';
import { encryptImageBuffer, IV_HEX_LENGTH } from '../utils/imageCrypto';
import { env } from '../config/env';
import { cloudinaryService } from './cloudinary.service';
import { userStatusTracker } from '../utils/userStatus';

export interface SecureChatDTO {
  id: string;
  recipient: {
    id: string;
    name: string;
    email: string;
  };
  isOnline: boolean;
  lastMessage?: {
    content: string;
    type: 'text' | 'file';
    senderName: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SecureMessageDTO {
  id: string;
  chatId: string;
  sender: {
    id: string;
    name: string;
  };
  type: 'text' | 'file';
  content: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  status: 'sent' | 'delivered' | 'seen';
  deliveredTo: string[];
  seenBy: string[];
  tempId?: string;
  replyTo?: {
    id: string;
    content: string;
    senderName: string;
  };
  createdAt: string;
}

// Helpers
export const formatSecureMessage = (message: ISecureMessage): SecureMessageDTO => {
  const messageId = message._id.toString();
  const decryptedContent = decrypt(message.content);
  const isEncryptedImage =
    message.type === 'file' &&
    message.fileType?.startsWith('image/') &&
    decryptedContent.length > IV_HEX_LENGTH &&
    /^[0-9a-f]+$/i.test(decryptedContent.slice(0, IV_HEX_LENGTH));

  return {
    id: messageId,
    chatId: message.chatId.toString(),
    sender: {
      id: message.sender.toString(),
      name: message.senderName,
    },
    type: message.type,
    content: isEncryptedImage ? `/api/images/${messageId}` : decryptedContent,
    fileName: message.fileName,
    fileType: message.fileType,
    fileSize: message.fileSize,
    status: message.seenBy.length > 0 ? 'seen' : (message.deliveredTo.length > 0 ? 'delivered' : 'sent'),
    deliveredTo: message.deliveredTo.map(id => id.toString()),
    seenBy: message.seenBy.map(id => id.toString()),
    tempId: message.tempId,
    replyTo: message.replyTo ? {
      id: message.replyTo.id.toString(),
      content: decrypt(message.replyTo.content),
      senderName: message.replyTo.senderName,
    } : undefined,
    createdAt: message.createdAt.toISOString(),
  };
};

export const assertSecureChatMember = async (chatId: string, userId: string) => {
  const isMember = await SecureParticipant.exists({ chatId, userId });
  if (!isMember) {
    throw new AppError('You are not a participant of this secure chat.', 403);
  }
};

export const secureChatService = {
  // Users Search
  async searchUsers(query: string, currentUserId: string) {
    const searchRegex = new RegExp(query, 'i');
    const users = await User.find({
      _id: { $ne: new Types.ObjectId(currentUserId) },
      $or: [{ name: searchRegex }, { email: searchRegex }],
    })
      .select('name email')
      .limit(10);

    return users.map((u) => ({
      id: u._id.toString(),
      name: u.name,
      email: u.email,
    }));
  },

  // Create Chat
  async createSecureChat(creatorId: string, recipientId: string, passwordRaw: string) {
    if (creatorId === recipientId) {
      throw new AppError('You cannot create a secure chat with yourself.', 400);
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      throw new AppError('Recipient not found.', 404);
    }

    // Check if chat already exists
    const creatorChats = await SecureParticipant.find({ userId: creatorId }).distinct('chatId');
    const existingParticipant = await SecureParticipant.findOne({
      chatId: { $in: creatorChats },
      userId: recipientId,
    });

    if (existingParticipant) {
      // Find the chat and return
      const existingChat = await SecureChat.findById(existingParticipant.chatId);
      if (existingChat) {
        return existingChat;
      }
    }

    // Create new chat
    const passwordHash = await bcrypt.hash(passwordRaw, 12);
    const newChat = await SecureChat.create({
      passwordHash,
      createdBy: creatorId,
    });

    // Create participants
    await SecureParticipant.insertMany([
      { chatId: newChat._id, userId: creatorId },
      { chatId: newChat._id, userId: recipientId },
    ]);

    return newChat;
  },

  // List Chats
  async getSecureChatsForUser(userId: string): Promise<SecureChatDTO[]> {
    const participants = await SecureParticipant.find({ userId });
    const chatIds = participants.map((p) => p.chatId);

    const chats = await SecureChat.find({ _id: { $in: chatIds } }).sort({ updatedAt: -1 });

    const results: SecureChatDTO[] = [];

    for (const chat of chats) {
      // Find other participant
      const otherParticipantRecord = await SecureParticipant.findOne({
        chatId: chat._id,
        userId: { $ne: new Types.ObjectId(userId) },
      }).populate('userId', 'name email');

      if (!otherParticipantRecord || !otherParticipantRecord.userId) {
        continue;
      }

      const otherUser = otherParticipantRecord.userId as any;
      const otherUserIdStr = otherUser._id.toString();

      // Get last message
      const lastMessageDoc = await SecureMessage.findOne({ chatId: chat._id })
        .sort({ createdAt: -1 })
        .limit(1);

      let lastMessageInfo: SecureChatDTO['lastMessage'];
      if (lastMessageDoc) {
        lastMessageInfo = {
          content: decrypt(lastMessageDoc.content),
          type: lastMessageDoc.type,
          senderName: lastMessageDoc.senderName,
          createdAt: lastMessageDoc.createdAt.toISOString(),
        };
      }

      results.push({
        id: chat._id.toString(),
        recipient: {
          id: otherUserIdStr,
          name: otherUser.name,
          email: otherUser.email,
        },
        isOnline: userStatusTracker.isOnline(otherUserIdStr),
        lastMessage: lastMessageInfo,
        createdAt: chat.createdAt.toISOString(),
        updatedAt: chat.updatedAt.toISOString(),
      });
    }

    return results;
  },

  // Verify and Unlock
  async verifyAndUnlock(chatId: string, userId: string, passwordRaw: string): Promise<string> {
    await assertSecureChatMember(chatId, userId);

    const chat = await SecureChat.findById(chatId);
    if (!chat) {
      throw new AppError('Secure chat not found.', 404);
    }

    const matches = await bcrypt.compare(passwordRaw, chat.passwordHash);
    if (!matches) {
      throw new AppError('Incorrect password.', 401);
    }

    return signUnlockToken(chatId, userId);
  },

  // Get Messages
  async getSecureMessages(chatId: string, userId: string): Promise<SecureMessageDTO[]> {
    await assertSecureChatMember(chatId, userId);

    const messages = await SecureMessage.find({ chatId })
      .sort({ createdAt: 1 })
      .limit(150);

    return messages.map(formatSecureMessage);
  },

  // Send Text Message
  async createSecureTextMessage(
    chatId: string,
    senderId: string,
    senderName: string,
    content: string,
    replyTo?: { id: string; content: string; senderName: string },
    tempId?: string
  ) {
    await assertSecureChatMember(chatId, senderId);

    const cleanContent = content.trim();
    if (!cleanContent) {
      throw new AppError('Message cannot be empty.', 400);
    }

    const message = await SecureMessage.create({
      chatId,
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

    await SecureChat.updateOne({ _id: chatId }, { updatedAt: new Date() });
    return formatSecureMessage(message);
  },

  // Send File Message
  async createSecureFileMessage(input: {
    chatId: string;
    senderId: string;
    senderName: string;
    dataUrl: string;
    fileName: string;
    fileType?: string;
    fileSize: number;
    replyTo?: { id: string; content: string; senderName: string };
    tempId?: string;
  }) {
    await assertSecureChatMember(input.chatId, input.senderId);

    if (input.fileSize > env.MAX_FILE_SIZE_BYTES) {
      throw new AppError('File size exceeds sharing limits.', 400);
    }

    let uploadDataUrl = input.dataUrl;
    let imageIvHex: string | undefined;

    if (input.fileType?.startsWith('image/')) {
      const base64Data = input.dataUrl.replace(/^data:[^;]+;base64,/, '');
      const originalBuffer = Buffer.from(base64Data, 'base64');
      const { encryptedBuffer, iv } = encryptImageBuffer(originalBuffer);

      imageIvHex = iv;
      uploadDataUrl = `data:application/octet-stream;base64,${encryptedBuffer.toString('base64')}`;
    }

    // Upload to Cloudinary under folder chattogram_secure/:chatId
    const folder = `chattogram_secure/${input.chatId}`;
    const cloudinaryResult = await cloudinaryService.uploadFile(
      uploadDataUrl,
      folder,
      input.chatId,
      imageIvHex ? 'raw' : 'auto'
    );

    const contentToStore = imageIvHex
      ? imageIvHex + cloudinaryResult.secure_url
      : cloudinaryResult.secure_url;

    const message = await SecureMessage.create({
      chatId: input.chatId,
      sender: input.senderId,
      senderName: input.senderName,
      type: 'file',
      content: encrypt(contentToStore),
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

    await SecureChat.updateOne({ _id: input.chatId }, { updatedAt: new Date() });
    return formatSecureMessage(message);
  },

  // Seen and Delivered
  async markMessageAsDelivered(messageId: string, userId: string) {
    const message = await SecureMessage.findById(messageId);
    if (!message) return null;

    if (message.sender.toString() === userId) return formatSecureMessage(message);

    if (!message.deliveredTo.some((id) => id.toString() === userId)) {
      message.deliveredTo.push(new Types.ObjectId(userId));
      await message.save();
    }

    return formatSecureMessage(message);
  },

  async markMessageAsSeen(messageId: string, userId: string) {
    const message = await SecureMessage.findById(messageId);
    if (!message) return null;

    if (message.sender.toString() === userId) return formatSecureMessage(message);

    let updated = false;

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

    return formatSecureMessage(message);
  }
};
