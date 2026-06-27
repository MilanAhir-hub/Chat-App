import type { Server, Socket } from 'socket.io';
import { User } from '../models/User';
import { SecureParticipant } from '../models/SecureParticipant';
import { secureChatService } from '../services/secureChat.service';
import { verifyUnlockToken } from '../utils/secureJwt';
import { parseCookies } from '../utils/socketCookie';
import { userStatusTracker } from '../utils/userStatus';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { verifyToken } from '../utils/jwt';

type Ack<T = unknown> = (response: {
  ok: boolean;
  message?: string;
  data?: T;
}) => void;

const getSocketUser = (socket: Socket) => socket.data.user;

const socketErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong.';

// Authenticate socket using standard JWT cookie or authorization header
const authenticateSecureSocket = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    let token = cookies[env.COOKIE_NAME] || socket.handshake.auth?.token;

    if (!token && socket.handshake.headers.authorization?.startsWith('Bearer')) {
      token = socket.handshake.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError('Please login before opening a socket connection.', 401);
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId).select('name email');

    if (!user) {
      throw new AppError('The user for this session no longer exists.', 401);
    }

    socket.data.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    };

    next();
  } catch (error) {
    next(new Error(socketErrorMessage(error)));
  }
};

// Broadcast online/offline status of a user to all their secure chats
const broadcastUserStatus = async (io: Server, userId: string, status: 'online' | 'offline') => {
  try {
    const participants = await SecureParticipant.find({ userId });
    const chatIds = participants.map((p) => p.chatId.toString());

    for (const chatId of chatIds) {
      io.of('/secure').to(`secure:${chatId}`).emit('secure:user:status', {
        userId,
        status,
      });
    }
  } catch (err) {
    console.error('Error broadcasting user status:', err);
  }
};

export const initializeSecureSocket = (io: Server) => {
  const secureNamespace = io.of('/secure');

  secureNamespace.use(authenticateSecureSocket);

  secureNamespace.on('connection', (socket) => {
    const user = getSocketUser(socket);

    // Track connection status
    const wentOnline = userStatusTracker.addConnection(user.id, socket.id);
    if (wentOnline) {
      console.log(`User ${user.name} (${user.id}) went online in Secure Namespace.`);
      void broadcastUserStatus(io, user.id, 'online');
    }

    // Join secure chat
    socket.on('secure:join', async (payload: { chatId: string; unlockToken: string }, ack?: Ack) => {
      try {
        const { chatId, unlockToken } = payload;

        // Verify the unlock token
        const decoded = verifyUnlockToken(unlockToken);
        if (!decoded || decoded.chatId !== chatId || decoded.userId !== user.id) {
          throw new AppError('Invalid or expired secure chat session. Please unlock again.', 403);
        }

        // Verify user is a participant of the chat
        const isParticipant = await SecureParticipant.exists({ chatId, userId: user.id });
        if (!isParticipant) {
          throw new AppError('Access denied.', 403);
        }

        const roomName = `secure:${chatId}`;
        socket.join(roomName);

        // Notify client
        ack?.({ ok: true, message: 'Joined secure chat.' });
      } catch (error) {
        const message = socketErrorMessage(error);
        ack?.({ ok: false, message });
        socket.emit('secure:error', { message });
      }
    });

    // Send text message
    socket.on(
      'secure:message:send',
      async (
        payload: {
          chatId: string;
          content: string;
          replyTo?: { id: string; content: string; senderName: string };
          tempId?: string;
        },
        ack?: Ack
      ) => {
        try {
          const { chatId, content, replyTo, tempId } = payload;
          const roomName = `secure:${chatId}`;

          // Check if socket is actually inside the room (prevent unauthorized emissions)
          if (!socket.rooms.has(roomName)) {
            throw new AppError('Please unlock and join the secure chat first.', 403);
          }

          const message = await secureChatService.createSecureTextMessage(
            chatId,
            user.id,
            user.name,
            content,
            replyTo,
            tempId
          );

          secureNamespace.to(roomName).emit('secure:message:new', message);
          ack?.({ ok: true, data: message });
        } catch (error) {
          const message = socketErrorMessage(error);
          ack?.({ ok: false, message });
          socket.emit('secure:error', { message });
        }
      }
    );

    // Send file message
    socket.on(
      'secure:file:send',
      async (
        payload: {
          chatId: string;
          dataUrl: string;
          fileName: string;
          fileType?: string;
          fileSize: number;
          replyTo?: { id: string; content: string; senderName: string };
          tempId?: string;
        },
        ack?: Ack
      ) => {
        try {
          const { chatId, dataUrl, fileName, fileType, fileSize, replyTo, tempId } = payload;
          const roomName = `secure:${chatId}`;

          if (!socket.rooms.has(roomName)) {
            throw new AppError('Please unlock and join the secure chat first.', 403);
          }

          const message = await secureChatService.createSecureFileMessage({
            chatId,
            senderId: user.id,
            senderName: user.name,
            dataUrl,
            fileName,
            fileType,
            fileSize,
            replyTo,
            tempId,
          });

          secureNamespace.to(roomName).emit('secure:message:new', message);
          ack?.({ ok: true, data: message });
        } catch (error) {
          const message = socketErrorMessage(error);
          ack?.({ ok: false, message });
          socket.emit('secure:error', { message });
        }
      }
    );

    // Typing start
    socket.on('secure:typing:start', (payload: { chatId: string }) => {
      const roomName = `secure:${payload.chatId}`;
      if (socket.rooms.has(roomName)) {
        socket.to(roomName).emit('secure:typing:update', {
          userId: user.id,
          name: user.name,
          isTyping: true,
        });
      }
    });

    // Typing stop
    socket.on('secure:typing:stop', (payload: { chatId: string }) => {
      const roomName = `secure:${payload.chatId}`;
      if (socket.rooms.has(roomName)) {
        socket.to(roomName).emit('secure:typing:update', {
          userId: user.id,
          name: user.name,
          isTyping: false,
        });
      }
    });

    // Delivered receipt
    socket.on('secure:message:delivered', async (payload: { chatId: string; messageId: string }) => {
      try {
        const roomName = `secure:${payload.chatId}`;
        if (!socket.rooms.has(roomName)) return;

        const message = await secureChatService.markMessageAsDelivered(payload.messageId, user.id);
        if (message) {
          secureNamespace.to(roomName).emit('secure:message:updated', message);
        }
      } catch (error) {
        console.error('Error in secure message delivered receipt:', error);
      }
    });

    // Seen receipt
    socket.on('secure:message:seen', async (payload: { chatId: string; messageId: string }) => {
      try {
        const roomName = `secure:${payload.chatId}`;
        if (!socket.rooms.has(roomName)) return;

        const message = await secureChatService.markMessageAsSeen(payload.messageId, user.id);
        if (message) {
          secureNamespace.to(roomName).emit('secure:message:updated', message);
        }
      } catch (error) {
        console.error('Error in secure message seen receipt:', error);
      }
    });

    // Temporary room redirect shortcut
    socket.on('secure:temp-room-create', (payload: { chatId: string; tempRoomId: string }) => {
      const roomName = `secure:${payload.chatId}`;
      if (socket.rooms.has(roomName)) {
        socket.to(roomName).emit('secure:temp-room-invite', {
          chatId: payload.chatId,
          tempRoomId: payload.tempRoomId,
          createdBy: user.name,
        });
      }
    });

    // Leave secure chat room
    socket.on('secure:leave', (payload: { chatId: string }, ack?: Ack) => {
      const roomName = `secure:${payload.chatId}`;
      socket.leave(roomName);
      ack?.({ ok: true, message: 'Left secure chat room.' });
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      const wentOffline = userStatusTracker.removeConnection(user.id, socket.id);
      if (wentOffline) {
        console.log(`User ${user.name} (${user.id}) went offline in Secure Namespace.`);
        void broadcastUserStatus(io, user.id, 'offline');
      }
    });
  });
};
