import type http from 'http';
import { Server, type Socket } from 'socket.io';
import { env } from '../config/env';
import { User } from '../models/User';
import { Room } from '../models/Room';
import { initializeSecureSocket } from './secureSocket';
import {
  createFileMessage,
  createTextMessage,
  markMessageAsDelivered,
  markMessageAsSeen,
  toggleMessageReaction,
} from '../services/message.service';
import {
  deleteRoomAndMessages,
  getRoom,
  joinRoom,
  leaveRoom,
} from '../services/room.service';
import type { AuthUser } from '../types/auth';
import { AppError } from '../utils/AppError';
import { verifyToken } from '../utils/jwt';
import { parseCookies } from '../utils/socketCookie';
import {
  closeVideoCallForRoom,
  registerVideoCallHandlers,
} from './videoCall';
import {
  reactionSchema,
  sendFileMessageSchema,
  sendTextMessageSchema,
} from '../validations/room.validation';

type Ack<T = unknown> = (response: {
  ok: boolean;
  message?: string;
  data?: T;
}) => void;

type PresenceMap = Map<string, Map<string, Set<string>>>;

let io: Server | null = null;
const roomPresence: PresenceMap = new Map();
const disconnectTimers = new Map<string, NodeJS.Timeout>();
const DISCONNECT_GRACE_MS = 10000;

const getSocketUser = (socket: Socket): AuthUser => socket.data.user;

const socketErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Something went wrong.';

const addPresence = (roomId: string, userId: string, socketId: string) => {
  const roomUsers = roomPresence.get(roomId) || new Map<string, Set<string>>();
  const userSockets = roomUsers.get(userId) || new Set<string>();
  const wasAbsent = userSockets.size === 0;

  userSockets.add(socketId);
  roomUsers.set(userId, userSockets);
  roomPresence.set(roomId, roomUsers);

  return wasAbsent;
};

const removePresence = (roomId: string, userId: string, socketId: string) => {
  const roomUsers = roomPresence.get(roomId);

  if (!roomUsers) {
    return { userLeftRoom: true };
  }

  const userSockets = roomUsers.get(userId);

  if (!userSockets) {
    return { userLeftRoom: true };
  }

  userSockets.delete(socketId);

  if (userSockets.size > 0) {
    return { userLeftRoom: false };
  }

  roomUsers.delete(userId);

  if (roomUsers.size === 0) {
    roomPresence.delete(roomId);
  }

  return { userLeftRoom: true };
};

export const emitRoomState = async (roomId: string) => {
  if (!io) {
    return;
  }

  try {
    const room = await getRoom(roomId);
    io.to(room.roomId).emit('room:state', room);
  } catch {
    emitRoomClosed(roomId, 'Room is no longer available.');
  }
};

export const emitRoomClosed = (
  roomId: string,
  message = 'Room closed and messages were permanently deleted.'
) => {
  if (!io) {
    return;
  }

  const normalizedRoomId = roomId.toUpperCase();
  io.to(normalizedRoomId).emit('room:closed', {
    roomId: normalizedRoomId,
    message,
    createdAt: new Date().toISOString(),
  });
  closeVideoCallForRoom(io, normalizedRoomId);
  io.in(normalizedRoomId).socketsLeave(normalizedRoomId);
  roomPresence.delete(normalizedRoomId);
};

const handleRoomExit = async (
  socket: Socket,
  roomId: string,
  shouldNotify: boolean
) => {
  if (!io) {
    return;
  }

  const user = getSocketUser(socket);
  const normalizedRoomId = roomId.toUpperCase();
  const presence = removePresence(normalizedRoomId, user.id, socket.id);

  socket.leave(normalizedRoomId);

  if (!presence.userLeftRoom) {
    return;
  }

  const result = await leaveRoom(normalizedRoomId, user.id);

  if (result.deleted) {
    emitRoomClosed(normalizedRoomId, 'Room deleted because everyone left.');
    return;
  }

  if (shouldNotify) {
    socket.to(normalizedRoomId).emit('room:notice', {
      type: 'left',
      user,
      message: `${user.name} left the room.`,
      createdAt: new Date().toISOString(),
    });
  }

  await emitRoomState(normalizedRoomId);
};

const authenticateSocket = async (socket: Socket, next: (err?: Error) => void) => {
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

export const initializeSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  // Background cleanup for inactive rooms (10 minutes)
  setInterval(async () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    try {
      const inactiveRooms = await Room.find({
        isActive: true,
        updatedAt: { $lt: tenMinutesAgo },
      });

      for (const room of inactiveRooms) {
        console.log(`Auto-terminating inactive room: ${room.roomId}`);
        emitRoomClosed(
          room.roomId,
          'INACTIVITY_TERMINATION: This room has been terminated due to 10 minutes of inactivity.'
        );
        await deleteRoomAndMessages(room.roomId);
      }
    } catch (err) {
      console.error('Cleanup job error:', err);
    }
  }, 60000); // Check every minute

  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    registerVideoCallHandlers(io as Server, socket, getSocketUser);

    socket.on('room:join', async (payload: { roomId: string }, ack?: Ack) => {
      try {
        const user = getSocketUser(socket);
        const roomId = payload.roomId.toUpperCase();

        if (socket.data.activeRoomId && socket.data.activeRoomId !== roomId) {
          await handleRoomExit(socket, socket.data.activeRoomId, false);
        }

        const room = await joinRoom(roomId, user.id);
        socket.join(room.roomId);
        socket.data.activeRoomId = room.roomId;

        const firstSocketForUser = addPresence(room.roomId, user.id, socket.id);

        if (firstSocketForUser) {
          socket.to(room.roomId).emit('room:notice', {
            type: 'joined',
            user,
            message: `${user.name} joined the room.`,
            createdAt: new Date().toISOString(),
          });
        }

        await emitRoomState(room.roomId);
        ack?.({ ok: true, message: 'Joined room.', data: room });
      } catch (error) {
        const message = socketErrorMessage(error);
        ack?.({ ok: false, message });
        socket.emit('socket:error', { message });
      }
    });

    socket.on('message:send', async (payload, ack?: Ack) => {
      try {
        const user = getSocketUser(socket);
        const data = sendTextMessageSchema.parse(payload);
        const message = await createTextMessage(
          data.roomId,
          user.id,
          user.name,
          data.content,
          data.replyTo,
          data.tempId
        );

        io?.to(data.roomId).emit('message:new', message);
        ack?.({ ok: true, data: message });
      } catch (error) {
        const message = socketErrorMessage(error);
        ack?.({ ok: false, message });
        socket.emit('socket:error', { message });
      }
    });
    socket.on('file:send', async (payload, ack?: Ack) => {
      try {
        const user = getSocketUser(socket);
        const data = sendFileMessageSchema.parse(payload);
        const message = await createFileMessage({
          roomId: data.roomId,
          senderId: user.id,
          senderName: user.name,
          dataUrl: data.dataUrl,
          fileName: data.fileName,
          fileType: data.fileType,
          fileSize: data.fileSize,
          replyTo: data.replyTo,
          tempId: data.tempId,
        });

        io?.to(data.roomId).emit('message:new', message);
        ack?.({ ok: true, data: message });
      } catch (error) {
        const message = socketErrorMessage(error);
        ack?.({ ok: false, message });
        socket.emit('socket:error', { message });
      }
    });

    socket.on('message:delivered', async (payload: { messageId: string }) => {
      try {
        const user = getSocketUser(socket);
        const message = await markMessageAsDelivered(payload.messageId, user.id);
        if (message) {
          io?.to(message.roomId).emit('message:updated', message);
        }
      } catch (error) {
        console.error('Error marking message as delivered:', error);
      }
    });

    socket.on('message:seen', async (payload: { messageId: string }) => {
      try {
        const user = getSocketUser(socket);
        const message = await markMessageAsSeen(payload.messageId, user.id);
        if (message) {
          io?.to(message.roomId).emit('message:updated', message);
        }
      } catch (error) {
        console.error('Error marking message as seen:', error);
      }
    });

    socket.on('message:react', async (payload, ack?: Ack) => {
      try {
        const user = getSocketUser(socket);
        const data = reactionSchema.parse(payload);
        const message = await toggleMessageReaction(
          data.messageId,
          data.emoji,
          user.id
        );

        io?.to(message.roomId).emit('message:updated', message);
        ack?.({ ok: true, data: message });
      } catch (error) {
        const message = socketErrorMessage(error);
        ack?.({ ok: false, message });
        socket.emit('socket:error', { message });
      }
    });

    socket.on('typing:start', (payload: { roomId: string }) => {
      const user = getSocketUser(socket);
      socket.to(payload.roomId.toUpperCase()).emit('typing:update', {
        userId: user.id,
        name: user.name,
        isTyping: true,
      });
    });

    socket.on('typing:stop', (payload: { roomId: string }) => {
      const user = getSocketUser(socket);
      socket.to(payload.roomId.toUpperCase()).emit('typing:update', {
        userId: user.id,
        name: user.name,
        isTyping: false,
      });
    });

    socket.on('room:leave', async (payload: { roomId: string }, ack?: Ack) => {
      try {
        await handleRoomExit(socket, payload.roomId, true);
        socket.data.activeRoomId = undefined;
        ack?.({ ok: true, message: 'Left room.' });
      } catch (error) {
        const message = socketErrorMessage(error);
        ack?.({ ok: false, message });
        socket.emit('socket:error', { message });
      }
    });

    socket.on('disconnect', async () => {
      const activeRoomId = socket.data.activeRoomId as string | undefined;

      if (activeRoomId) {
        const timer = setTimeout(() => {
          void handleRoomExit(socket, activeRoomId, true).finally(() => {
            disconnectTimers.delete(socket.id);
          });
        }, DISCONNECT_GRACE_MS);

        disconnectTimers.set(socket.id, timer);
      }
    });
  });

  initializeSecureSocket(io);

  return io;
};
