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
    <main className="flex min-h-dvh flex-col bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 text-slate-950 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 dark:text-white">
      <header className="border-b border-slate-200/80 bg-white/80 px-4 py-4 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80 sm:px-6 sm:py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 sm:text-sm">
              Chattogram
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
              Welcome back, {user?.name?.split(' ')[0]}
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <ThemeSelector />
            <ThemeToggle />
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 sm:px-4 sm:py-2 sm:text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <section className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="grid w-full max-w-4xl gap-6 lg:grid-cols-2">
          {(error || success) && (
            <div className="col-span-full rounded-xl border-2 px-4 py-3.5 text-sm font-medium lg:col-span-2 backdrop-blur-sm
              ${error
                ? 'border-red-200/50 bg-red-50/80 text-red-600 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300'
                : 'border-emerald-200/50 bg-emerald-50/80 text-emerald-600 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300'
              }"
            >
              {error || success}
            </div>
          )}

          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-slate-200/30 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80 dark:shadow-2xl dark:shadow-black/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/30">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold">Create a Room</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Start a new chat session</p>
              </div>
            </div>

            <button
              type="button"
              onClick={createRoom}
              disabled={isCreating}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-5 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary-500/30 transition-all hover:from-primary-500 hover:to-primary-400 hover:shadow-xl hover:shadow-primary-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none"
            >
              {isCreating ? <Loader size="sm" light /> : 'Create New Room'}
            </button>

            {createdRoom && (
              <div className="mt-6 rounded-xl border-2 border-primary-200/50 bg-primary-50/80 p-4 backdrop-blur-sm dark:border-primary-900/50 dark:bg-primary-950/50">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                  Room is ready
                </p>
                <div className="mt-3 flex flex-col gap-3">
                  <code className="break-all rounded-lg border border-primary-200 bg-white px-4 py-3 text-xl font-black tracking-[0.15em] text-slate-900 dark:border-primary-900 dark:bg-slate-950 dark:text-white">
                    {createdRoom.roomId}
                  </code>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void copyRoomId(createdRoom.roomId)}
                      className="flex-1 rounded-lg border border-primary-300 px-3 py-2.5 text-sm font-bold text-primary-700 transition hover:bg-primary-100 dark:border-primary-800 dark:text-primary-200 dark:hover:bg-primary-950"
                    >
                      Copy ID
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/rooms/${createdRoom.roomId}`)}
                      className="flex-[2] rounded-lg bg-gradient-to-r from-slate-900 to-slate-800 px-3 py-2.5 text-sm font-bold text-white transition hover:from-slate-800 hover:to-slate-700 dark:from-white dark:to-slate-100 dark:text-slate-900 dark:hover:from-slate-100 dark:hover:to-white"
                    >
                      Enter Room
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-slate-200/30 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80 dark:shadow-2xl dark:shadow-black/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 text-white shadow-lg shadow-slate-500/30">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold">Join a Room</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Enter an existing room</p>
              </div>
            </div>

            <form onSubmit={joinRoom} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Room ID
                </span>
                <input
                  type="text"
                  value={joinRoomId}
                  maxLength={6}
                  onChange={(event) =>
                    setJoinRoomId(event.target.value.toUpperCase())
                  }
                  className="mt-2 block w-full rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3.5 text-xl font-bold uppercase tracking-[0.2em] text-slate-900 outline-none transition-all placeholder:text-slate-300 focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-primary-400 dark:focus:bg-slate-800"
                  placeholder="ABCDEF"
                />
              </label>
              <button
                type="submit"
                disabled={isJoining || joinRoomId.trim().length !== 6}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:from-slate-800 hover:to-slate-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none dark:from-white dark:to-slate-100 dark:text-slate-900 dark:hover:from-slate-100 dark:hover:to-white"
              >
                {isJoining ? <Loader size="sm" light /> : 'Join Room'}
              </button>
            </form>
          </div>

          <div className="col-span-full rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-xl shadow-slate-200/30 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80 dark:shadow-2xl dark:shadow-black/20 lg:col-span-2">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-500 text-lg font-bold text-white shadow-lg shadow-primary-500/30">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-xl font-bold">{user?.name}</h2>
                <p className="truncate text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
