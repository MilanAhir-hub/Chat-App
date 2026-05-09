import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';
import { ThemeSelector } from '../components/ThemeSelector';
import { useAuth } from '../context/AuthContext';
import { Loader } from '../components/Loader';
import { getErrorMessage } from '../services/http';
import { roomService } from '../services/room.service';
import type { Room } from '../types';

export const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [joinRoomId, setJoinRoomId] = useState('');
  const [createdRoom, setCreatedRoom] = useState<Room | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const createRoom = async () => {
    setError('');
    setSuccess('');
    setIsCreating(true);

    try {
      const response = await roomService.createRoom();
      setCreatedRoom(response.room);
      setSuccess(response.message);
    } catch (createError) {
      setError(getErrorMessage(createError));
    } finally {
      setIsCreating(false);
    }
  };

  const joinRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsJoining(true);

    try {
      const response = await roomService.joinRoom(joinRoomId);
      navigate(`/rooms/${response.room.roomId}`);
    } catch (joinError) {
      setError(getErrorMessage(joinError));
    } finally {
      setIsJoining(false);
    }
  };

  const copyRoomId = async (roomId: string) => {
    await navigator.clipboard.writeText(roomId);
    setSuccess('Room ID copied.');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <main className="min-h-dvh bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-slate-200 bg-white/90 px-3 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-primary-700 dark:text-primary-300 sm:text-xs md:text-sm">
              Chattogram
            </p>
            <h1 className="truncate text-lg font-bold sm:text-xl md:text-2xl">Dashboard</h1>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <ThemeSelector />
            <ThemeToggle />
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-slate-300 px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 sm:px-4 sm:py-2 sm:text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-4 px-3 py-4 sm:gap-6 sm:px-6 sm:py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 md:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400 sm:text-sm">
                Signed in as
              </p>
              <h2 className="mt-1 truncate text-xl font-bold sm:text-2xl md:text-3xl">{user?.name}</h2>
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400 sm:mt-1 sm:text-sm">
                {user?.email}
              </p>
            </div>
            <button
              type="button"
              onClick={createRoom}
              disabled={isCreating}
              className="w-full shrink-0 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-primary-800 sm:w-auto sm:px-5 sm:py-3"
            >
              {isCreating ? <Loader size="sm" light /> : 'Create Room'}
            </button>
          </div>

          {createdRoom && (
            <div className="mt-6 rounded-lg border border-primary-200 bg-primary-50 p-3 dark:border-primary-900/70 dark:bg-primary-950/30 sm:mt-8 sm:p-4 md:p-6">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-800 dark:text-primary-200 sm:text-xs md:text-sm">
                Room is ready
              </p>
              <div className="mt-3 flex flex-col gap-2.5 sm:mt-4 sm:flex-row sm:items-center sm:gap-3">
                <code className="flex-1 break-all rounded-lg border border-primary-200 bg-white px-3 py-2.5 text-lg font-black tracking-[0.2em] text-slate-950 dark:border-primary-900 dark:bg-slate-950 dark:text-white sm:px-4 sm:py-3 sm:text-xl md:text-2xl">
                  {createdRoom.roomId}
                </code>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => copyRoomId(createdRoom.roomId)}
                    className="flex-1 rounded-lg border border-primary-300 px-3 py-2.5 text-xs font-bold text-primary-800 transition hover:bg-primary-100 dark:border-primary-800 dark:text-primary-200 dark:hover:bg-primary-950 sm:flex-none sm:px-4 sm:py-3 sm:text-sm"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/rooms/${createdRoom.roomId}`)}
                    className="flex-[2] rounded-lg bg-slate-950 px-3 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 sm:flex-none sm:px-4 sm:py-3 sm:text-sm"
                  >
                    Enter
                  </button>
                </div>
              </div>
            </div>
          )}

          {(error || success) && (
            <p
              className={`mt-4 rounded-lg px-3 py-2.5 text-xs font-medium sm:mt-6 sm:px-4 sm:py-3 sm:text-sm ${
                error
                  ? 'border border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200'
                  : 'border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200'
              }`}
            >
              {error || success}
            </p>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 md:p-8">
          <h2 className="text-lg font-bold sm:text-xl">Join Room</h2>
          <form onSubmit={joinRoom} className="mt-4 space-y-4 sm:mt-5 sm:space-y-5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 sm:text-sm">
              Room ID
              <div className="relative mt-1.5 sm:mt-2">
                <input
                  type="text"
                  value={joinRoomId}
                  maxLength={6}
                  onChange={(event) =>
                    setJoinRoomId(event.target.value.toUpperCase())
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-lg font-bold uppercase tracking-[0.2em] text-slate-950 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:px-4 sm:py-4 sm:text-xl md:text-2xl"
                  placeholder="AB12CD"
                />
              </div>
            </label>
            <button
              type="submit"
              disabled={isJoining || joinRoomId.trim().length !== 6}
              className="flex w-full items-center justify-center rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 sm:py-4"
            >
              {isJoining ? <Loader size="sm" light /> : 'Join Room'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
};
