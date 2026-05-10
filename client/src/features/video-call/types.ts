import type { User } from '../../types';

export interface VideoMediaState {
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
}

export interface VideoParticipant {
  socketId: string;
  user: User;
  joinedAt: string;
  media: VideoMediaState;
}

export interface RemoteVideoParticipant extends VideoParticipant {
  stream?: MediaStream;
  connectionState: RTCPeerConnectionState;
}

export interface VideoSignalPayload {
  from: string;
  user: User;
  type: 'offer' | 'answer' | 'ice-candidate';
  description?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit;
}

export interface VideoCallStartedPayload {
  roomId: string;
  startedBy: User;
  createdAt: string;
}

export interface VideoCallEndedPayload {
  roomId: string;
  createdAt: string;
}

export interface VideoPeerJoinedPayload {
  participant: VideoParticipant;
}

export interface VideoPeerLeftPayload {
  socketId: string;
  userId?: string;
  reason?: string;
}

export interface VideoMediaStatePayload {
  socketId: string;
  userId: string;
  media: VideoMediaState;
}

export type VideoCallStatus =
  | 'idle'
  | 'starting'
  | 'connecting'
  | 'connected'
  | 'ending';
