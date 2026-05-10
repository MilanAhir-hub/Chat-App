import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import { playIncomingRing, playOutgoingRing } from '../../utils/sound';
import {
  CallEnd01Icon,
  ComputerScreenShareIcon,
  Mic01Icon,
  MicOff01Icon,
  Video01Icon,
  VideoOffIcon,
  ArrowLeft02Icon,
  Maximize01Icon,
  Minimize01Icon,
  UserIcon,
  MoreHorizontalIcon,
  Camera01Icon,
} from '@hugeicons/core-free-icons';
import type { User } from '../../types';
import { useVideoCall } from './useVideoCall';
import type { VideoMediaState } from './types';

interface VideoCallPanelProps {
  roomId: string;
  currentUser: User | null;
}

interface VideoTileProps {
  label: string;
  stream?: MediaStream | null;
  isLocal?: boolean;
  media: VideoMediaState;
  connectionState?: RTCPeerConnectionState;
  isFloating?: boolean;
  onDragStart?: (e: React.MouseEvent | React.TouchEvent) => void;
  position?: { x: number; y: number };
}

const VideoTile = ({
  label,
  stream,
  isLocal = false,
  media,
  connectionState,
  isFloating = false,
  position,
  onDragStart,
}: VideoTileProps) => {
  // useRef + useEffect is the correct pattern here.
  // A callback ref (useCallback) only fires on mount/unmount, NOT when 'stream'
  // changes on an already-mounted element — causing black screens after camera
  // switching or stream recreation.
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (stream) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
        // Trigger play() explicitly for iOS Safari autoplay restrictions
        video.play().catch(() => {
          // Autoplay blocked — user interaction required; video will play on touch
        });
      }
    } else {
      video.srcObject = null;
    }
  }, [stream]);

  const showVideo = Boolean(
    stream && 
    media.isVideoEnabled && 
    stream.getVideoTracks().length > 0
  );

  return (
    <div
      style={isFloating && position ? { transform: `translate(${position.x}px, ${position.y}px)` } : {}}
      className={`relative overflow-hidden transition-all duration-500 ease-out group pointer-events-auto ${
        isFloating
          ? 'absolute right-6 top-24 z-50 w-32 h-44 sm:w-56 sm:h-80 rounded-2xl border-2 border-white/20 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.6)] cursor-grab active:cursor-grabbing backdrop-blur-xl animate-in zoom-in-90 duration-500'
          : 'w-full h-full rounded-2xl sm:rounded-[2.5rem] bg-slate-900 shadow-inner border border-white/5'
      }`}
      onMouseDown={isFloating ? onDragStart : undefined}
      onTouchStart={isFloating ? onDragStart : undefined}
    >
      {/* Video Content */}
      <div className="absolute inset-0 z-0">
        {/* ALWAYS render the video element so the ref is stable.
            Conditional rendering causes a race between mount and useEffect. */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`h-full w-full object-cover transition-opacity duration-700 ${isLocal ? 'scale-x-[-1]' : ''} ${showVideo ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Avatar fallback shown when video is off */}
        {!showVideo && (
          <div className="absolute inset-0 flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950">
            <div className="flex h-24 w-24 sm:h-32 sm:w-32 items-center justify-center rounded-full bg-slate-800/50 text-4xl font-black uppercase text-white/20 border border-white/5 backdrop-blur-sm shadow-2xl">
              {label ? label.slice(0, 1) : <HugeiconsIcon icon={UserIcon} size={48} />}
            </div>
            {!isFloating && (
              <p className="mt-6 text-sm font-bold tracking-widest text-slate-500 uppercase">
                {stream ? 'Camera Off' : 'Connecting...'}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Overlays */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Info Label */}
      <div className={`absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-2 px-4 py-4 transition-transform duration-300 ${isFloating ? 'hidden sm:flex' : 'flex'}`}>
        <div className="flex items-center gap-2 rounded-full bg-black/30 backdrop-blur-md px-3 py-1.5 border border-white/10">
          <span className="truncate text-[11px] font-bold text-white tracking-wide">
            {label}
            {isLocal ? ' (You)' : ''}
          </span>
          {!media.isAudioEnabled && (
            <div className="flex items-center justify-center text-red-400">
              <HugeiconsIcon icon={MicOff01Icon} size={12} />
            </div>
          )}
        </div>
      </div>

      {/* Connection State Indicator */}
      {connectionState && !['connected', 'completed'].includes(connectionState) && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/40 backdrop-blur-md transition-all duration-500">
          <div className="h-12 w-12 rounded-full border-4 border-white/10 border-t-white animate-spin mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/80">
            {connectionState === 'connecting' ? 'Connecting...' : connectionState}
          </p>
        </div>
      )}
    </div>
  );
};

export const VideoCallPanel = ({ roomId, currentUser }: VideoCallPanelProps) => {
  const {
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
    switchCamera,
    canScreenShare,
    dismissError,
  } = useVideoCall(roomId, currentUser);

  const [isFullscreen, setIsFullscreen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const isBusy = status === 'starting' || status === 'ending';

  // Draggable state for self-view
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const onDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    startPos.current = { x: clientX - dragPos.x, y: clientY - dragPos.y };
  }, [dragPos]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      setDragPos({
        x: clientX - startPos.current.x,
        y: clientY - startPos.current.y,
      });
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onMouseMove);
    window.addEventListener('touchend', onMouseUp);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onMouseMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, []);

  useEffect(() => {
    let stopRing: (() => void) | undefined;
    if (hasActiveRoomCall && !isInCall) {
      stopRing = playIncomingRing();
    } else if (isInCall && participantCount === 1) {
      stopRing = playOutgoingRing();
    }
    return () => {
      if (stopRing) stopRing();
    };
  }, [hasActiveRoomCall, isInCall, participantCount]);

  const isOneOnOne = participantCount === 2;

  const overlay = isInCall ? createPortal(
    <section className={`fixed inset-0 z-[9999] flex flex-col overflow-hidden bg-slate-950 text-white transition-all duration-500 ease-in-out ${isMinimized ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}>
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-black" />
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(50,50,255,0.1),transparent_50%)]" />
      </div>

      {/* Premium Header */}
      <header className="absolute inset-x-0 top-0 z-50 flex items-center justify-between p-6 sm:p-10 bg-gradient-to-b from-black/80 via-black/20 to-transparent">
        <div className="flex items-center gap-4">
          <button
            onClick={endCall}
            className="group flex h-12 w-12 items-center justify-center rounded-full bg-white/5 backdrop-blur-xl border border-white/10 transition-all hover:bg-white/10 active:scale-90"
            title="Leave Call"
          >
            <HugeiconsIcon icon={ArrowLeft02Icon} size={24} className="text-white/80 group-hover:text-white transition-colors" />
          </button>
          
          <div className="hidden sm:block text-left">
            <h2 className="text-lg font-black tracking-tight text-white leading-none">
              {roomId}
            </h2>
            <p className="mt-1.5 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              {participantCount === 1 ? 'Calling...' : `${participantCount} Participants`}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col items-center sm:hidden">
          <h2 className="text-sm font-black tracking-widest text-white/90 uppercase">{roomId}</h2>
          <span className="mt-1 text-[8px] font-bold tracking-widest text-emerald-400 uppercase">Live</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMinimized(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 backdrop-blur-xl border border-white/10 transition-all hover:bg-white/10 active:scale-90"
            title="Minimize"
          >
            <HugeiconsIcon icon={Minimize01Icon} size={20} className="text-white/70" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="hidden sm:flex h-12 w-12 items-center justify-center rounded-full bg-white/5 backdrop-blur-xl border border-white/10 transition-all hover:bg-white/10 active:scale-90"
            title="Fullscreen"
          >
            <HugeiconsIcon icon={isFullscreen ? Minimize01Icon : Maximize01Icon} size={20} className="text-white/70" />
          </button>
          <button
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 backdrop-blur-xl border border-white/10 transition-all hover:bg-white/10 active:scale-90"
          >
            <HugeiconsIcon icon={MoreHorizontalIcon} size={20} className="text-white/70" />
          </button>
        </div>
      </header>

      {/* Main Video Area */}
      <main className={`flex-1 relative w-full h-full flex items-center justify-center p-4 sm:p-12 overflow-hidden transition-all duration-500 ${isFullscreen ? 'p-0 sm:p-0' : ''}`}>
        {remoteParticipants.length > 0 ? (
          <div className={`grid w-full h-full gap-4 sm:gap-8 p-4 content-center transition-all duration-700 ${
            remoteParticipants.length === 1 
              ? 'grid-cols-1 max-w-5xl aspect-video rounded-[2rem] sm:rounded-[3rem] overflow-hidden ring-1 ring-white/10' 
              : remoteParticipants.length === 2 
                ? 'grid-cols-1 md:grid-cols-2' 
                : 'grid-cols-2 lg:grid-cols-3'
          }`}>
            {remoteParticipants.map((participant) => (
              <VideoTile
                key={participant.socketId}
                label={participant.user.name}
                stream={participant.stream}
                media={participant.media}
                connectionState={participant.connectionState}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-1000">
            <div className="relative mb-8">
              <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
              <div className="relative h-32 w-32 rounded-full bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-xl">
                <HugeiconsIcon icon={UserIcon} size={48} className="text-white/20" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-black tracking-widest text-white mb-2 uppercase">Calling...</p>
              <p className="text-[10px] font-extrabold tracking-[0.4em] text-emerald-400 uppercase opacity-80">Waiting for others</p>
            </div>
          </div>
        )}

        {/* Persistent WhatsApp-style Local Preview (Floating) */}
        <div className="absolute inset-0 pointer-events-none z-[60]">
          <VideoTile
            label={currentUser?.name || 'You'}
            stream={localStream}
            isLocal
            media={mediaState}
            isFloating
            position={dragPos}
            onDragStart={onDragStart}
          />
        </div>

        {/* Floating Error Toast */}
        {error && (
          <div className="absolute top-32 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-md rounded-[1.5rem] border border-red-500/20 bg-red-500/10 backdrop-blur-3xl p-6 text-center shadow-[0_20px_50px_rgba(255,0,0,0.2)] animate-in slide-in-from-top-10">
            <p className="text-sm font-bold text-red-100 mb-5 leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={dismissError}
              className="w-full rounded-xl bg-red-500/20 py-3.5 text-[10px] font-black uppercase tracking-[0.3em] text-white hover:bg-red-500/30 transition-all active:scale-95 border border-red-500/20"
            >
              Dismiss
            </button>
          </div>
        )}
      </main>

      {/* Modern Floating Control Bar */}
      <footer className="absolute inset-x-0 bottom-0 z-50 p-10 sm:p-20 bg-gradient-to-t from-black/95 via-black/40 to-transparent">
        <div className="flex items-center justify-center gap-4 sm:gap-8 max-w-fit mx-auto px-8 py-5 rounded-[2.5rem] bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <button
            type="button"
            onClick={toggleVideo}
            className={`group flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full transition-all duration-500 hover:scale-110 active:scale-90 border-2 ${
              mediaState.isVideoEnabled
                ? 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                : 'bg-red-500 text-white border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.5)]'
            }`}
          >
            <HugeiconsIcon
              icon={mediaState.isVideoEnabled ? Video01Icon : VideoOffIcon}
              size={24}
              className="sm:scale-125"
            />
          </button>

          <button
            type="button"
            onClick={switchCamera}
            disabled={mediaState.isScreenSharing || !mediaState.isVideoEnabled}
            className={`group flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full transition-all duration-500 hover:scale-110 active:scale-90 border-2 bg-white/5 text-white border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none`}
            title="Flip Camera"
          >
            <HugeiconsIcon icon={Camera01Icon} size={24} className="sm:scale-125" />
          </button>

          <button
            type="button"
            onClick={toggleAudio}
            className={`group flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full transition-all duration-500 hover:scale-110 active:scale-90 border-2 ${
              mediaState.isAudioEnabled
                ? 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                : 'bg-white text-slate-950 border-white shadow-[0_0_30px_rgba(255,255,255,0.3)]'
            }`}
          >
            <HugeiconsIcon
              icon={mediaState.isAudioEnabled ? Mic01Icon : MicOff01Icon}
              size={24}
              className="sm:scale-125"
            />
          </button>

          {canScreenShare && (
            <button
              type="button"
              onClick={toggleScreenShare}
              className={`group flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full transition-all duration-500 hover:scale-110 active:scale-90 border-2 ${
                mediaState.isScreenSharing
                  ? 'bg-primary-500 text-white border-primary-400 shadow-[0_0_30px_rgba(var(--primary-500-rgb),0.5)]'
                  : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
              }`}
            >
              <HugeiconsIcon icon={ComputerScreenShareIcon} size={24} className="sm:scale-125" />
            </button>
          )}

          <button
            type="button"
            onClick={endCall}
            className="group flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_0_50px_rgba(239,68,68,0.4)] transition-all duration-500 hover:bg-red-600 hover:scale-110 active:scale-90 border-4 border-red-400/20"
          >
            <HugeiconsIcon icon={CallEnd01Icon} size={32} className="sm:scale-125" />
          </button>
        </div>
      </footer>
    </section>,
    document.body
  ) : null;

  return (
    <>
      {overlay}
      
      {/* Minimized / Floating Window Entry */}
      {isMinimized && (
        <div 
          onClick={() => setIsMinimized(false)}
          className="fixed bottom-6 right-6 z-[9999] w-32 h-44 sm:w-48 sm:h-64 rounded-3xl overflow-hidden shadow-2xl border-2 border-primary-500/50 bg-slate-900 cursor-pointer animate-in zoom-in-75 duration-300 group"
        >
          <div className="absolute inset-0 bg-primary-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm z-10">
            <HugeiconsIcon icon={Maximize01Icon} size={32} className="text-white drop-shadow-lg" />
          </div>
          <VideoTile
            label="Live Call"
            stream={isOneOnOne ? remoteParticipants[0].stream : localStream}
            media={{ isAudioEnabled: true, isVideoEnabled: true, isScreenSharing: false }}
          />
        </div>
      )}

      {/* Global Error Banner (When not in call) */}
      {error && !isInCall && (
        <div className="fixed right-6 top-24 z-50 max-w-sm rounded-[1.5rem] border border-red-200 bg-white/95 backdrop-blur-xl px-5 py-4 text-sm font-bold text-red-600 shadow-[0_20px_50px_rgba(255,0,0,0.1)] animate-in slide-in-from-right-10 dark:border-red-900/50 dark:bg-slate-900/95 dark:text-red-400">
          <div className="flex items-center gap-4">
            <span className="flex-1 leading-tight">{error}</span>
            <button
              type="button"
              onClick={dismissError}
              className="text-[10px] font-black uppercase tracking-[0.2em] bg-red-50 px-3 py-1.5 rounded-lg dark:bg-red-900/30 hover:bg-red-100 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={startCall}
        disabled={!currentUser || isBusy}
        className={`group relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-500 active:scale-90 disabled:opacity-50 ${
          hasActiveRoomCall
            ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:bg-emerald-600'
            : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
        }`}
        title={hasActiveRoomCall ? `Join ${startedByName}'s Call` : 'Video Call'}
      >
        <HugeiconsIcon icon={Video01Icon} size={22} className="group-hover:scale-110 transition-transform" />
        {hasActiveRoomCall && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center">
            <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative h-2.5 w-2.5 rounded-full bg-white shadow-sm"></span>
          </span>
        )}
      </button>
    </>
  );
};
