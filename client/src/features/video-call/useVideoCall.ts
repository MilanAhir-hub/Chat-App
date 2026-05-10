import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { connectSocket, getSocket } from '../../socket/socket';
import type { User } from '../../types';
import {
  cameraMediaConstraints,
  createPeerConnectionConfig,
  screenMediaConstraints,
  tuneVideoSender,
} from './webrtcConfig';
import type {
  RemoteVideoParticipant,
  VideoCallEndedPayload,
  VideoCallStartedPayload,
  VideoCallStatus,
  VideoMediaState,
  VideoMediaStatePayload,
  VideoParticipant,
  VideoPeerJoinedPayload,
  VideoPeerLeftPayload,
  VideoSignalPayload,
} from './types';

const createEmptyMediaState = (): VideoMediaState => ({
  isAudioEnabled: true,
  isVideoEnabled: true,
  isScreenSharing: false,
});

const getMediaErrorMessage = (error: unknown) => {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      return 'Camera or microphone permission was blocked. Please allow access in your browser settings.';
    }
    if (error.name === 'NotFoundError') {
      return 'No camera or microphone was found on this device.';
    }
    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return 'Camera or microphone is already in use by another application or another tab. Please close other apps using the camera.';
    }
  }

  return error instanceof Error
    ? error.message
    : 'Unable to start the video call. Please check your connection and hardware.';
};

export const useVideoCall = (roomId: string, currentUser: User | null) => {
  const [status, setStatus] = useState<VideoCallStatus>('idle');
  const [error, setError] = useState('');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<
    RemoteVideoParticipant[]
  >([]);
  const [hasActiveRoomCall, setHasActiveRoomCall] = useState(false);
  const [startedByName, setStartedByName] = useState('');
  const [mediaState, setMediaState] = useState<VideoMediaState>(
    createEmptyMediaState
  );

  const roomIdRef = useRef(roomId);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef(new Map<string, RTCPeerConnection>());
  const remoteStreamsRef = useRef(new Map<string, MediaStream>());
  const participantsRef = useRef(new Map<string, VideoParticipant>());
  const pendingCandidatesRef = useRef(new Map<string, RTCIceCandidateInit[]>());

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  const isInCall = status !== 'idle';

  const emitMediaState = useCallback((nextMediaState: Partial<VideoMediaState>) => {
    if (!roomIdRef.current) {
      return;
    }

    getSocket().emit('video:media-state', {
      roomId: roomIdRef.current,
      media: nextMediaState,
    });
  }, []);

  const updateParticipant = useCallback(
    (
      participant: VideoParticipant,
      patch: Partial<RemoteVideoParticipant> = {}
    ) => {
      participantsRef.current.set(participant.socketId, participant);
      setRemoteParticipants((current) => {
        const existing = current.find(
          (item) => item.socketId === participant.socketId
        );
        const nextParticipant: RemoteVideoParticipant = {
          ...participant,
          stream:
            patch.stream ||
            existing?.stream ||
            remoteStreamsRef.current.get(participant.socketId),
          connectionState:
            patch.connectionState ||
            existing?.connectionState ||
            'new',
        };

        if (existing) {
          return current.map((item) =>
            item.socketId === participant.socketId ? nextParticipant : item
          );
        }

        return [...current, nextParticipant];
      });
    },
    []
  );

  const removePeer = useCallback((socketId: string) => {
    const peerConnection = peerConnectionsRef.current.get(socketId);

    if (peerConnection) {
      peerConnection.onicecandidate = null;
      peerConnection.ontrack = null;
      peerConnection.onconnectionstatechange = null;
      peerConnection.close();
    }

    peerConnectionsRef.current.delete(socketId);
    pendingCandidatesRef.current.delete(socketId);
    remoteStreamsRef.current.get(socketId)?.getTracks().forEach((track) => {
      track.stop();
    });
    remoteStreamsRef.current.delete(socketId);
    participantsRef.current.delete(socketId);
    setRemoteParticipants((current) =>
      current.filter((participant) => participant.socketId !== socketId)
    );
  }, []);

  const sendSignal = useCallback(
    (
      to: string,
      payload: Omit<VideoSignalPayload, 'from' | 'user'> & { to: string }
    ) => {
      if (!roomIdRef.current) {
        return;
      }

      getSocket().emit('video:signal', {
        roomId: roomIdRef.current,
        to,
        type: payload.type,
        description: payload.description,
        candidate: payload.candidate,
      });
    },
    []
  );

  const flushPendingCandidates = useCallback(
    async (socketId: string, peerConnection: RTCPeerConnection) => {
      const candidates = pendingCandidatesRef.current.get(socketId) || [];
      pendingCandidatesRef.current.delete(socketId);

      await Promise.all(
        candidates.map((candidate) =>
          peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
        )
      );
    },
    []
  );

  const createOffer = useCallback(
    async (socketId: string, peerConnection: RTCPeerConnection) => {
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await peerConnection.setLocalDescription(offer);
      sendSignal(socketId, {
        to: socketId,
        type: 'offer',
        description: peerConnection.localDescription?.toJSON(),
      });
    },
    [sendSignal]
  );

  const createPeerConnection = useCallback(
    (participant: VideoParticipant) => {
      const existing = peerConnectionsRef.current.get(participant.socketId);

      if (existing) {
        return existing;
      }

      const peerConnection = new RTCPeerConnection(createPeerConnectionConfig());
      const activeStream = localStreamRef.current;

      if (activeStream) {
        activeStream.getTracks().forEach((track) => {
          const sender = peerConnection.addTrack(track, activeStream);

          if (track.kind === 'video') {
            void tuneVideoSender(sender).catch(() => undefined);
          }
        });
      }

      peerConnection.onicecandidate = (event) => {
        if (!event.candidate) {
          return;
        }

        sendSignal(participant.socketId, {
          to: participant.socketId,
          type: 'ice-candidate',
          candidate: event.candidate.toJSON(),
        });
      };

      peerConnection.ontrack = (event) => {
        const stream =
          remoteStreamsRef.current.get(participant.socketId) ||
          new MediaStream();

        if (!stream.getTracks().some((track) => track.id === event.track.id)) {
          stream.addTrack(event.track);
        }

        remoteStreamsRef.current.set(participant.socketId, stream);
        updateParticipant(participant, {
          stream,
          connectionState: peerConnection.connectionState,
        });
      };

      peerConnection.onconnectionstatechange = () => {
        updateParticipant(participant, {
          connectionState: peerConnection.connectionState,
        });

        if (
          peerConnection.connectionState === 'failed' ||
          peerConnection.connectionState === 'disconnected'
        ) {
          peerConnection.restartIce();
        }
      };

      peerConnectionsRef.current.set(participant.socketId, peerConnection);
      updateParticipant(participant, {
        connectionState: peerConnection.connectionState,
      });

      return peerConnection;
    },
    [sendSignal, updateParticipant]
  );

  const replaceOutgoingVideoTrack = useCallback(
    async (track: MediaStreamTrack | null) => {
      await Promise.all(
        Array.from(peerConnectionsRef.current.values()).map(
          async (peerConnection) => {
            const sender = peerConnection
              .getSenders()
              .find((item) => item.track?.kind === 'video');

            if (sender) {
              await sender.replaceTrack(track);

              if (track) {
                await tuneVideoSender(sender).catch(() => undefined);
              }
            }
          }
        )
      );
    },
    []
  );

  const setLocalVideoTrack = useCallback((track: MediaStreamTrack | null) => {
    const stream = localStreamRef.current;

    if (!stream) {
      return;
    }

    stream.getVideoTracks().forEach((existingTrack) => {
      stream.removeTrack(existingTrack);
      existingTrack.stop();
    });

    if (track) {
      stream.addTrack(track);
    }

    setLocalStream(new MediaStream(stream.getTracks()));
  }, []);

  const stopScreenShare = useCallback(async () => {
    screenStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    screenStreamRef.current = null;

    if (!localStreamRef.current) {
      return;
    }

    const cameraStream = await navigator.mediaDevices.getUserMedia({
      video: cameraMediaConstraints.video,
      audio: false,
    });
    const cameraTrack = cameraStream.getVideoTracks()[0] || null;

    await replaceOutgoingVideoTrack(cameraTrack);
    setLocalVideoTrack(cameraTrack);
    setMediaState((current) => ({
      ...current,
      isScreenSharing: false,
      isVideoEnabled: Boolean(cameraTrack),
    }));
    emitMediaState({ isScreenSharing: false, isVideoEnabled: Boolean(cameraTrack) });
  }, [emitMediaState, replaceOutgoingVideoTrack, setLocalVideoTrack]);

  const cleanupCall = useCallback(
    (shouldNotifyServer: boolean) => {
      if (shouldNotifyServer && roomIdRef.current) {
        getSocket().emit('video:leave', { roomId: roomIdRef.current });
      }

      peerConnectionsRef.current.forEach((peerConnection) => {
        peerConnection.close();
      });
      peerConnectionsRef.current.clear();
      pendingCandidatesRef.current.clear();
      participantsRef.current.clear();
      remoteStreamsRef.current.forEach((stream) => {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      });
      remoteStreamsRef.current.clear();
      screenStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });
      screenStreamRef.current = null;
      localStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });
      localStreamRef.current = null;

      setLocalStream(null);
      setRemoteParticipants([]);
      setMediaState(createEmptyMediaState());
      setStatus('idle');
    },
    []
  );

  const handleSignal = useCallback(
    async (payload: VideoSignalPayload) => {
      if (!localStreamRef.current) {
        return;
      }

      const participant =
        participantsRef.current.get(payload.from) ||
        ({
          socketId: payload.from,
          user: payload.user,
          joinedAt: new Date().toISOString(),
          media: createEmptyMediaState(),
        } satisfies VideoParticipant);
      const peerConnection = createPeerConnection(participant);

      if (payload.type === 'offer' && payload.description) {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(payload.description)
        );
        await flushPendingCandidates(payload.from, peerConnection);

        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        sendSignal(payload.from, {
          to: payload.from,
          type: 'answer',
          description: peerConnection.localDescription?.toJSON(),
        });
        setStatus('connected');
        return;
      }

      if (payload.type === 'answer' && payload.description) {
        await peerConnection.setRemoteDescription(
          new RTCSessionDescription(payload.description)
        );
        await flushPendingCandidates(payload.from, peerConnection);
        setStatus('connected');
        return;
      }

      if (payload.type === 'ice-candidate' && payload.candidate) {
        if (!peerConnection.remoteDescription) {
          const pending =
            pendingCandidatesRef.current.get(payload.from) || [];
          pending.push(payload.candidate);
          pendingCandidatesRef.current.set(payload.from, pending);
          return;
        }

        await peerConnection.addIceCandidate(
          new RTCIceCandidate(payload.candidate)
        );
      }
    },
    [createPeerConnection, flushPendingCandidates, sendSignal]
  );

  const startCall = useCallback(async () => {
    if (!roomIdRef.current || !currentUser || status !== 'idle') {
      return;
    }

    setStatus('starting');
    setError('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        cameraMediaConstraints
      );
      const nextMediaState = {
        isAudioEnabled: stream.getAudioTracks().some((track) => track.enabled),
        isVideoEnabled: stream.getVideoTracks().some((track) => track.enabled),
        isScreenSharing: false,
      };
      const socket = connectSocket();

      localStreamRef.current = stream;
      setLocalStream(stream);
      setMediaState(nextMediaState);

      await new Promise<void>((resolve, reject) => {
        socket.emit('room:join', { roomId: roomIdRef.current }, (response) => {
          if (!response.ok) {
            reject(
              new Error(response.message || 'Join the room before calling.')
            );
            return;
          }

          resolve();
        });
      });

      const participants = await new Promise<VideoParticipant[]>(
        (resolve, reject) => {
          socket.emit(
            'video:join',
            { roomId: roomIdRef.current, media: nextMediaState },
            (response) => {
              if (!response.ok) {
                reject(new Error(response.message || 'Unable to join call.'));
                return;
              }

              resolve(response.data?.participants || []);
            }
          );
        }
      );

      setHasActiveRoomCall(true);
      setStartedByName(currentUser.name);
      setStatus(participants.length > 0 ? 'connecting' : 'connected');

      await Promise.all(
        participants.map(async (participant) => {
          const peerConnection = createPeerConnection(participant);
          await createOffer(participant.socketId, peerConnection);
        })
      );
    } catch (callError) {
      cleanupCall(false);
      setError(getMediaErrorMessage(callError));
    }
  }, [
    cleanupCall,
    createOffer,
    createPeerConnection,
    currentUser,
    status,
  ]);

  const endCall = useCallback(() => {
    if (status === 'idle') {
      return;
    }

    setStatus('ending');
    cleanupCall(true);
  }, [cleanupCall, status]);

  const toggleAudio = useCallback(() => {
    const stream = localStreamRef.current;

    if (!stream) {
      return;
    }

    const nextAudioEnabled = !mediaState.isAudioEnabled;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = nextAudioEnabled;
    });
    setMediaState((current) => ({
      ...current,
      isAudioEnabled: nextAudioEnabled,
    }));
    emitMediaState({ isAudioEnabled: nextAudioEnabled });
  }, [emitMediaState, mediaState.isAudioEnabled]);

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current;

    if (!stream) {
      return;
    }

    const nextVideoEnabled = !mediaState.isVideoEnabled;
    stream.getVideoTracks().forEach((track) => {
      track.enabled = nextVideoEnabled;
    });
    setMediaState((current) => ({
      ...current,
      isVideoEnabled: nextVideoEnabled,
    }));
    emitMediaState({ isVideoEnabled: nextVideoEnabled });
  }, [emitMediaState, mediaState.isVideoEnabled]);

  const toggleScreenShare = useCallback(async () => {
    if (!localStreamRef.current) {
      return;
    }

    try {
      if (mediaState.isScreenSharing) {
        await stopScreenShare();
        return;
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia(
        screenMediaConstraints
      );
      const screenTrack = screenStream.getVideoTracks()[0];

      if (!screenTrack) {
        return;
      }

      screenStreamRef.current = screenStream;
      screenTrack.onended = () => {
        void stopScreenShare();
      };

      await replaceOutgoingVideoTrack(screenTrack);
      setLocalVideoTrack(screenTrack);
      setMediaState((current) => ({
        ...current,
        isScreenSharing: true,
        isVideoEnabled: true,
      }));
      emitMediaState({ isScreenSharing: true, isVideoEnabled: true });
    } catch (shareError) {
      setError(getMediaErrorMessage(shareError));
    }
  }, [
    emitMediaState,
    mediaState.isScreenSharing,
    replaceOutgoingVideoTrack,
    setLocalVideoTrack,
    stopScreenShare,
  ]);

  useEffect(() => {
    const socket = getSocket();

    const handleCallStarted = (payload: VideoCallStartedPayload) => {
      if (payload.roomId !== roomIdRef.current) {
        return;
      }

      setHasActiveRoomCall(true);
      setStartedByName(payload.startedBy.name);
    };

    const handleCallEnded = (payload: VideoCallEndedPayload) => {
      if (payload.roomId !== roomIdRef.current) {
        return;
      }

      setHasActiveRoomCall(false);
      setStartedByName('');
      cleanupCall(false);
    };

    const handlePeerJoined = ({ participant }: VideoPeerJoinedPayload) => {
      if (!localStreamRef.current) {
        return;
      }

      updateParticipant(participant);
    };

    const handlePeerLeft = ({ socketId }: VideoPeerLeftPayload) => {
      removePeer(socketId);
    };

    const handleMediaState = (payload: VideoMediaStatePayload) => {
      const participant = participantsRef.current.get(payload.socketId);

      if (!participant) {
        return;
      }

      updateParticipant({
        ...participant,
        media: payload.media,
      });
    };

    const handleIncomingSignal = (payload: VideoSignalPayload) => {
      void handleSignal(payload).catch((signalError) => {
        setError(getMediaErrorMessage(signalError));
      });
    };

    socket.on('video:call-started', handleCallStarted);
    socket.on('video:call-ended', handleCallEnded);
    socket.on('video:peer-joined', handlePeerJoined);
    socket.on('video:peer-left', handlePeerLeft);
    socket.on('video:media-state', handleMediaState);
    socket.on('video:signal', handleIncomingSignal);

    return () => {
      socket.off('video:call-started', handleCallStarted);
      socket.off('video:call-ended', handleCallEnded);
      socket.off('video:peer-joined', handlePeerJoined);
      socket.off('video:peer-left', handlePeerLeft);
      socket.off('video:media-state', handleMediaState);
      socket.off('video:signal', handleIncomingSignal);
    };
  }, [cleanupCall, handleSignal, removePeer, updateParticipant]);

  useEffect(() => () => cleanupCall(true), [cleanupCall]);

  const participantCount = useMemo(
    () => remoteParticipants.length + (isInCall ? 1 : 0),
    [isInCall, remoteParticipants.length]
  );

  return {
    status,
    error,
    localStream,
    remoteParticipants,
    mediaState,
    isInCall,
    hasActiveRoomCall,
    startedByName,
    participantCount,
    startCall,
    endCall,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    dismissError: () => setError(''),
  };
};
