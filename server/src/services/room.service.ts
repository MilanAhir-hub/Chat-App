import { Types } from 'mongoose';
import { Message } from '../models/Message';
import { Room, type IRoom } from '../models/Room';
import type { IUser } from '../models/User';
import type { AuthUser } from '../types/auth';
import { AppError } from '../utils/AppError';
import { cloudinaryService } from './cloudinary.service';

export interface RoomDTO {
  id: string;
  roomId: string;
  createdBy: AuthUser;
  users: AuthUser[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const ROOM_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const normalizeRoomId = (roomId: string) => roomId.trim().toUpperCase();

const buildRoomId = () =>
  Array.from({ length: 6 }, () =>
    ROOM_ID_ALPHABET[Math.floor(Math.random() * ROOM_ID_ALPHABET.length)]
  ).join('');

const toUserSummary = (user: unknown): AuthUser => {
  const document = user as IUser;

  return {
    id: document._id.toString(),
    name: document.name,
    email: document.email,
    credits: document.credits,
  };
};

const populateRoom = async (room: IRoom) => {
  await room.populate([
    { path: 'createdBy', select: 'name email credits' },
    { path: 'users', select: 'name email credits' },
  ]);

  return room;
};

export const formatRoom = (room: IRoom): RoomDTO => ({
  id: room._id.toString(),
  roomId: room.roomId,
  createdBy: toUserSummary(room.createdBy),
  users: (room.users as unknown[]).map(toUserSummary),
  isActive: room.isActive,
  createdAt: room.createdAt.toISOString(),
  updatedAt: room.updatedAt.toISOString(),
});

export const generateUniqueRoomId = async () => {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const roomId = buildRoomId();
    const roomExists = await Room.exists({ roomId });

    if (!roomExists) {
      return roomId;
    }
  }

  throw new AppError('Unable to generate a unique room ID. Please try again.', 500);
};

export const getRoom = async (roomId: string) => {
  const room = await Room.findOne({
    roomId: normalizeRoomId(roomId),
    isActive: true,
  });

  if (!room) {
    throw new AppError('Room not found or already closed.', 404);
  }

  await populateRoom(room);
  return formatRoom(room);
};

export const createRoom = async (creatorId: string) => {
  const room = await Room.create({
    roomId: await generateUniqueRoomId(),
    createdBy: creatorId,
    users: [creatorId],
  });

  await populateRoom(room);
  return formatRoom(room);
};

export const joinRoom = async (roomId: string, userId: string) => {
  const room = await Room.findOne({
    roomId: normalizeRoomId(roomId),
    isActive: true,
  });

  if (!room) {
    throw new AppError('Room not found or already closed.', 404);
  }

  const alreadyJoined = room.users.some((id) => id.toString() === userId);

  if (!alreadyJoined) {
    room.users.push(new Types.ObjectId(userId));
    await room.save();
  }

  await populateRoom(room);
  return formatRoom(room);
};

export const leaveRoom = async (roomId: string, userId: string) => {
  const normalizedRoomId = normalizeRoomId(roomId);
  const room = await Room.findOne({ roomId: normalizedRoomId, isActive: true });

  if (!room) {
    return { deleted: true, room: null };
  }

  room.users = room.users.filter((id) => id.toString() !== userId);

  if (room.users.length === 0) {
    await deleteRoomAndMessages(normalizedRoomId);
    return { deleted: true, room: null };
  }

  await room.save();
  await populateRoom(room);

  return { deleted: false, room: formatRoom(room) };
};

export const closeRoom = async (roomId: string, userId: string) => {
  const normalizedRoomId = normalizeRoomId(roomId);
  const room = await Room.findOne({ roomId: normalizedRoomId, isActive: true });

  if (!room) {
    throw new AppError('Room not found or already closed.', 404);
  }

  if (room.createdBy.toString() !== userId) {
    throw new AppError('Only the room creator can close this room.', 403);
  }

  await deleteRoomAndMessages(normalizedRoomId);
};

export const deleteRoomAndMessages = async (roomId: string) => {
  const normalizedRoomId = normalizeRoomId(roomId);

  try {
    // 1. Find all messages with files uploaded to Cloudinary
    const fileMessages = await Message.find({
      roomId: normalizedRoomId,
      type: 'file',
      cloudinaryPublicId: { $exists: true, $ne: null },
    });

    const publicIds = fileMessages
      .map((msg) => msg.cloudinaryPublicId)
      .filter((id): id is string => Boolean(id));

    // 2. Delete the assets from Cloudinary
    if (publicIds.length > 0) {
      await cloudinaryService.deleteFilesByPublicIds(publicIds);
    }
  } catch (error) {
    console.error(`Error during Cloudinary cleanup for room ${normalizedRoomId}:`, error);
    // Continue with DB deletion even if Cloudinary cleanup fails
  }

  // 3. Delete from Database
  await Promise.all([
    Room.deleteOne({ roomId: normalizedRoomId }),
    Message.deleteMany({ roomId: normalizedRoomId }),
  ]);
};

export const assertRoomMember = async (roomId: string, userId: string) => {
  const room = await Room.exists({
    roomId: normalizeRoomId(roomId),
    isActive: true,
    users: userId,
  });

  if (!room) {
    throw new AppError('Join the room before sending or reading messages.', 403);
  }
};

export const touchRoom = async (roomId: string) => {
  await Room.updateOne(
    { roomId: normalizeRoomId(roomId) },
    { updatedAt: new Date() }
  );
};
