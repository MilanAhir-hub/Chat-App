import type { Request, RequestHandler } from 'express';
import {
  closeRoom,
  createRoom,
  getRoom,
  joinRoom,
  leaveRoom,
} from '../services/room.service';
import { getRoomMessages } from '../services/message.service';
import { emitRoomClosed, emitRoomState } from '../socket/socket';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';

const requireUser = (req: Request) => {
  if (!req.user) {
    throw new AppError('Please login to continue.', 401);
  }

  return req.user;
};

const getRoomIdParam = (req: Request) => String(req.params.roomId);

export const createRoomHandler: RequestHandler = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const room = await createRoom(user.id);

  res.status(201).json({
    success: true,
    message: 'Room created successfully.',
    room,
  });
});

export const joinRoomHandler: RequestHandler = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const room = await joinRoom(req.body.roomId, user.id);

  await emitRoomState(room.roomId);

  res.status(200).json({
    success: true,
    message: 'Joined room successfully.',
    room,
  });
});

export const getRoomHandler: RequestHandler = asyncHandler(async (req, res) => {
  const room = await getRoom(getRoomIdParam(req));

  res.status(200).json({
    success: true,
    room,
  });
});

export const getRoomMessagesHandler: RequestHandler = asyncHandler(
  async (req, res) => {
    const user = requireUser(req);
    const messages = await getRoomMessages(getRoomIdParam(req), user.id);

    res.status(200).json({
      success: true,
      messages,
    });
  }
);

export const leaveRoomHandler: RequestHandler = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const roomId = getRoomIdParam(req);
  const result = await leaveRoom(roomId, user.id);

  if (result.deleted) {
    emitRoomClosed(roomId, 'Room deleted because everyone left.');
  } else if (result.room) {
    await emitRoomState(result.room.roomId);
  }

  res.status(200).json({
    success: true,
    message: result.deleted
      ? 'Room deleted because everyone left.'
      : 'Left room successfully.',
    room: result.room,
    deleted: result.deleted,
  });
});

export const closeRoomHandler: RequestHandler = asyncHandler(async (req, res) => {
  const user = requireUser(req);
  const roomId = getRoomIdParam(req);

  await closeRoom(roomId, user.id);
  emitRoomClosed(roomId, 'Room closed by the creator.');

  res.status(200).json({
    success: true,
    message: 'Room closed and all messages were permanently deleted.',
  });
});
