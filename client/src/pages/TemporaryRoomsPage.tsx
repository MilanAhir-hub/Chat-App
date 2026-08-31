import { useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { roomService } from '../services/room.service';
import { getErrorMessage } from '../services/http';
import { Loader } from '../components/Loader';
import { MaterialIcon } from '../components/MaterialIcon';
import type { Room } from '../types';

export const TemporaryRoomsPage = () => {
  const navigate = useNavigate();

  // States
  const [modalJoinRoomId, setModalJoinRoomId] = useState('');
  const [createdRoom, setCreatedRoom] = useState<Room | null>(null);
  const [modalError, setModalError] = useState('');
  const [modalSuccess, setModalSuccess] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);

  // Modal Panels
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const createRoom = async () => {
    setModalError('');
    setModalSuccess('');
    setIsCreating(true);
    setIsFabOpen(false);

    try {
      const response = await roomService.createRoom();
      setCreatedRoom(response.room);
      setShowCreateModal(true);
    } catch (createError) {
      setModalError(getErrorMessage(createError));
    } finally {
      setIsCreating(false);
    }
  };

  const handleFabOpenJoinModal = () => {
    setIsFabOpen(false);
    setModalJoinRoomId('');
    setModalError('');
    setModalSuccess('');
    setShowJoinModal(true);
  };

  const handleModalJoinRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setModalError('');
    setModalSuccess('');
    setIsJoining(true);

    try {
      const response = await roomService.joinRoom(modalJoinRoomId);
      setShowJoinModal(false);
      navigate(`/rooms/${response.room.roomId}`);
    } catch (joinError) {
      setModalError(getErrorMessage(joinError));
    } finally {
      setIsJoining(false);
    }
  };

  const copyRoomId = async (roomId: string) => {
    await navigator.clipboard.writeText(roomId);
    setModalSuccess('Copied');
  };

  const isModalJoinValid = modalJoinRoomId.trim().length === 6;

  return (
    <div className="mx-auto max-w-[832px] px-4 py-4 sm:py-6 space-y-6 relative min-h-[calc(100dvh-5rem)] flex flex-col">
      {/* ============================================================
          BACKDROP OVERLAY (z-40: blurs top navbar at z-20 while footer & FAB are at z-50)
          ============================================================ */}
      {(isFabOpen || showJoinModal || (showCreateModal && createdRoom)) &&
        createPortal(
          <div
            onClick={() => {
              if (isFabOpen) setIsFabOpen(false);
              if (showJoinModal) setShowJoinModal(false);
              if (showCreateModal) setShowCreateModal(false);
            }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300 cursor-pointer"
            aria-hidden="true"
          />,
          document.body
        )}

      {/* ============================================================
          SPEED DIAL FAB (Rendered in Portal at z-50 so it sits in front of backdrop)
          ============================================================ */}
      {createPortal(
        <div className="fixed bottom-20 md:bottom-8 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
          {/* Speed Dial Action: Join Room (Unified Pill with Icon + Text) */}
          <button
            type="button"
            onClick={handleFabOpenJoinModal}
            title="Join Room"
            aria-label="Join Room"
            className={`flex items-center gap-2.5 rounded-full bg-[var(--color-surface)] text-[var(--color-text-primary)] ring-1.5 ring-[var(--color-primary)]/35 px-5 py-3 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 origin-bottom-right cursor-pointer ${
              isFabOpen
                ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 scale-75 translate-y-6 pointer-events-none'
            }`}
          >
            <MaterialIcon icon="login" size={20} className="text-[var(--color-primary)]" />
            <span className="text-sm font-semibold tracking-wide whitespace-nowrap">Join Room</span>
          </button>

          {/* Speed Dial Action: Create Room (Unified Pill with Icon + Text) */}
          <button
            type="button"
            onClick={createRoom}
            disabled={isCreating}
            title="Create Temporary Room"
            aria-label="Create Temporary Room"
            className={`flex items-center gap-2.5 rounded-full bg-[var(--color-surface)] text-[var(--color-text-primary)] ring-1.5 ring-[var(--color-primary)]/35 px-5 py-3 shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 origin-bottom-right delay-75 cursor-pointer disabled:opacity-50 ${
              isFabOpen
                ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 scale-75 translate-y-4 pointer-events-none'
            }`}
          >
            <MaterialIcon icon="add_box" size={20} className="text-[var(--color-primary)]" />
            <span className="text-sm font-semibold tracking-wide whitespace-nowrap">Create Room</span>
          </button>

          {/* Main FAB Toggle Button (Smooth Plus -> Cross Rotation) */}
          <button
            type="button"
            onClick={() => setIsFabOpen((prev) => !prev)}
            disabled={isCreating}
            title={isFabOpen ? 'Close Actions' : 'Room Actions'}
            aria-label={isFabOpen ? 'Close Actions' : 'Room Actions'}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed pointer-events-auto"
          >
            {isCreating ? (
              <Loader size="sm" light />
            ) : (
              <div
                className={`transform transition-transform duration-300 ease-out flex items-center justify-center ${
                  isFabOpen ? 'rotate-45' : 'rotate-0'
                }`}
              >
                <MaterialIcon icon="add" size={28} />
              </div>
            )}
          </button>
        </div>,
        document.body
      )}

      {/* ============================================================
          GOOGLE KEEP-STYLE PANEL: JOIN ROOM
          ============================================================ */}
      {showJoinModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-[480px] rounded-2xl bg-[var(--color-surface)] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col transition-all pointer-events-auto">
              {/* Google Keep Card Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-2">
                <input
                  type="text"
                  readOnly
                  value="Join temporary room"
                  className="w-full bg-transparent text-[17px] font-medium text-[var(--color-text-primary)] outline-none select-none cursor-default"
                />
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)] transition cursor-pointer shrink-0"
                >
                  <MaterialIcon icon="close" size={20} />
                </button>
              </div>

              {/* Google Keep Card Body (Seamless Note-Style Input) */}
              <form onSubmit={handleModalJoinRoom} className="px-6 py-3 space-y-4">
                <div className="rounded-xl bg-[var(--color-hover)] px-4 py-3 focus-within:bg-[var(--color-surface)] focus-within:ring-2 focus-within:ring-[var(--color-primary)] transition-all">
                  <p className="text-[11px] font-medium text-[var(--color-text-muted)]">Room Code</p>
                  <input
                    type="text"
                    autoFocus
                    value={modalJoinRoomId}
                    maxLength={6}
                    onChange={(e) => setModalJoinRoomId(e.target.value.toUpperCase())}
                    placeholder="Enter 6-character code (e.g. AB12CD)"
                    className="w-full bg-transparent text-[15px] font-mono font-semibold tracking-wider text-[var(--color-text-primary)] placeholder:text-[14px] placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-[var(--color-text-muted)] outline-none mt-1"
                  />
                </div>

                {modalError && (
                  <p className="text-xs font-medium text-[var(--color-error)] px-1">
                    {modalError}
                  </p>
                )}

                {/* Google Keep Card Action Toolbar */}
                <div className="flex items-center gap-2 pt-2 pb-1">
                  <button
                    type="button"
                    onClick={() => setShowJoinModal(false)}
                    className="flex-1 h-10 py-6 rounded-full text-[16px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)] transition cursor-pointer flex items-center justify-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isJoining || !isModalJoinValid}
                    className={`flex-1 h-10 py-6 rounded-full text-[16px] font-medium transition active:scale-[0.98] flex items-center justify-center cursor-pointer shadow-xs ${
                      isModalJoinValid
                        ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:opacity-95'
                        : 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {isJoining ? <Loader size="sm" light={isModalJoinValid} /> : 'Join'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* ============================================================
          GOOGLE KEEP-STYLE PANEL: CREATE ROOM (Note Style Showcase)
          ============================================================ */}
      {showCreateModal &&
        createdRoom &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-[480px] rounded-2xl bg-[var(--color-surface)] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col transition-all pointer-events-auto">
              {/* Google Keep Card Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-2">
                <input
                  type="text"
                  readOnly
                  value="Temporary Room Created"
                  className="w-full bg-transparent text-[17px] font-medium text-[var(--color-text-primary)] outline-none select-none cursor-default"
                />
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)] transition cursor-pointer shrink-0"
                >
                  <MaterialIcon icon="close" size={20} />
                </button>
              </div>

              {/* Google Keep Card Body (Note style chip display) */}
              <div className="px-6 py-2.5 space-y-3.5">
                <p className="text-[12px] font-normal text-[var(--color-text-secondary)] leading-tight">
                  Share this code with invitees · Closes automatically when all leave
                </p>

                <div className="flex items-center justify-between gap-3 rounded-xl bg-[var(--color-primary-container)]/40 px-4 py-3">
                  <div className="min-w-0">
                    <span className="text-[11px] font-medium text-[var(--color-on-primary-container)] block">
                      Room Code
                    </span>
                    <code className="font-mono text-xl font-bold tracking-widest text-[var(--color-text-primary)]">
                      {createdRoom.roomId}
                    </code>
                  </div>

                  <button
                    type="button"
                    onClick={() => copyRoomId(createdRoom.roomId)}
                    className="flex items-center gap-1.5 h-8.5 rounded-full bg-[var(--color-surface)] px-3.5 text-xs font-semibold text-[var(--color-text-primary)] shadow-xs hover:bg-[var(--color-hover)] transition cursor-pointer"
                  >
                    <MaterialIcon icon="content_copy" size={16} />
                    <span>{modalSuccess ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                {/* Google Keep Card Action Toolbar */}
                <div className="flex items-center gap-2 pt-2 pb-1">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 h-10 py-6 rounded-full text-[16px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)] transition cursor-pointer flex items-center justify-center"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      navigate(`/rooms/${createdRoom.roomId}`);
                    }}
                    className="flex-1 h-10 py-6 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-[16px] font-medium hover:opacity-95 transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <span>Enter</span>
                    <MaterialIcon icon="arrow_forward" size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
