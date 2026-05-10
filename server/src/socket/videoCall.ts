import type { Server, Socket } from 'socket.io';
import type { AuthUser } from '../types/auth';

type Ack<T = unknown> = (response: {
  ok: boolean;
  message?: string;
  data?: T;
}) => void;

interface VideoMediaState {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
}

interface VideoParticipant {
  socketId: string;
  user: AuthUser;
  joinedAt: string;
  media: VideoMediaState;
}

interface VideoSignalPayload {
  roomId: string;
  to: string;
  type: 'offer' | 'answer' | 'ice-candidate';
  description?: unknown;
  candidate?: unknown;
}

const roomParticipants = new Map<string, Map<string, VideoParticipant>>();

const normalizeRoomId = (roomId: string) => roomId.trim().toUpperCase();

const defaultMediaState: VideoMediaState = {
  isAudioEnabled: true,
  isVideoEnabled: true,
  isScreenSharing: false,
};

const assertActiveRoom = (socket: Socket, roomId: string) => {
  const activeRoomId = socket.data.activeRoomId as string | undefined;

  if (activeRoomId !== roomId) {
    throw new Error('Join this room before starting a video call.');
  }
};

const getRoomParticipants = (roomId: string) => {
  const participants = roomParticipants.get(roomId);

  if (participants) {
    return participants;
  }

  const nextParticipants = new Map<string, VideoParticipant>();
  roomParticipants.set(roomId, nextParticipants);
  return nextParticipants;
};

const removeParticipant = (
  io: Server,
  socket: Socket,
  roomId: string,
  reason = 'left'
) => {
  const participants = roomParticipants.get(roomId);

  if (!participants || !participants.has(socket.id)) {
    return;
  }

  const participant = participants.get(socket.id);
  participants.delete(socket.id);

  socket.to(roomId).emit('video:peer-left', {
    socketId: socket.id,
    userId: participant?.user.id,
    reason,
  });

  if (participants.size === 0) {
    roomParticipants.delete(roomId);
    io.to(roomId).emit('video:call-ended', {
      roomId,
      createdAt: new Date().toISOString(),
    });
  }
};

export const closeVideoCallForRoom = (io: Server, roomId: string) => {
  const normalizedRoomId = normalizeRoomId(roomId);
  const participants = roomParticipants.get(normalizedRoomId);

  if (!participants) {
    return;
  }

  participants.forEach((participant) => {
    io.to(participant.socketId).emit('video:call-ended', {
      roomId: normalizedRoomId,
      createdAt: new Date().toISOString(),
    });
  });

  roomParticipants.delete(normalizedRoomId);
};

export const registerVideoCallHandlers = (
  io: Server,
  socket: Socket,
  getSocketUser: (socket: Socket) => AuthUser
) => {
  socket.on(
    'video:join',
    (
      payload: { roomId: string; media?: Partial<VideoMediaState> },
      ack?: Ack<{ participants: VideoParticipant[] }>
    ) => {
      try {
        const roomId = normalizeRoomId(payload.roomId);
        assertActiveRoom(socket, roomId);

        const user = getSocketUser(socket);
        const participants = getRoomParticipants(roomId);
        const existingParticipants = Array.from(participants.values()).filter(
          (participant) => participant.socketId !== socket.id
        );
        const participant: VideoParticipant = {
          socketId: socket.id,
          user,
          joinedAt: new Date().toISOString(),
          media: {
            ...defaultMediaState,
            ...payload.media,
          },
        };
        const isFirstParticipant = participants.size === 0;

        participants.set(socket.id, participant);

        if (isFirstParticipant) {
          io.to(roomId).emit('video:call-started', {
            roomId,
            startedBy: user,
            createdAt: participant.joinedAt,
          });
        }

        socket.to(roomId).emit('video:peer-joined', { participant });
        ack?.({
          ok: true,
          message: 'Joined video call.',
          data: { participants: existingParticipants },
        });
      } catch (error) {
        ack?.({
          ok: false,
          message:
            error instanceof Error
              ? error.message
              : 'Unable to join the video call.',
        });
      }
    }
  );

  socket.on('video:signal', (payload: VideoSignalPayload) => {
    try {
      const roomId = normalizeRoomId(payload.roomId);
      assertActiveRoom(socket, roomId);

      const participants = roomParticipants.get(roomId);

      if (!participants?.has(socket.id) || !participants.has(payload.to)) {
        return;
      }

      io.to(payload.to).emit('video:signal', {
        from: socket.id,
        user: getSocketUser(socket),
        type: payload.type,
        description: payload.description,
        candidate: payload.candidate,
      });
    } catch {
      socket.emit('socket:error', {
        message: 'Video signaling failed. Please rejoin the room.',
      });
    }
  });

  socket.on(
    'video:media-state',
    (payload: { roomId: string; media: Partial<VideoMediaState> }) => {
      try {
        const roomId = normalizeRoomId(payload.roomId);
        assertActiveRoom(socket, roomId);

        const participants = roomParticipants.get(roomId);
        const participant = participants?.get(socket.id);

        if (!participant) {
          return;
        }

        participant.media = {
          ...participant.media,
          ...payload.media,
        };

        socket.to(roomId).emit('video:media-state', {
          socketId: socket.id,
          userId: participant.user.id,
          media: participant.media,
        });
      } catch {
        socket.emit('socket:error', {
          message: 'Unable to update video call media state.',
        });
      }
    }
  );

  socket.on('video:leave', (payload: { roomId: string }, ack?: Ack) => {
    const roomId = normalizeRoomId(payload.roomId);
    removeParticipant(io, socket, roomId);
    ack?.({ ok: true, message: 'Left video call.' });
  });

  socket.on('disconnect', () => {
    const activeRoomId = socket.data.activeRoomId as string | undefined;

    if (activeRoomId) {
      removeParticipant(io, socket, activeRoomId, 'disconnected');
    }
  });
};
