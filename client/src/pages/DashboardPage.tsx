import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeToggle } from '../components/ThemeToggle';
import { ThemeSelector } from '../components/ThemeSelector';
import { useAuth } from '../context/AuthContext';
import { Loader } from '../components/Loader';
import { getErrorMessage } from '../services/http';
import { roomService } from '../services/room.service';
import { secureChatService, type SecureChat } from '../services/secureChat.service';
import type { Room, User } from '../types';

export const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Tabs state
  const [activeTab, setActiveTab] = useState<'rooms' | 'secure'>('rooms');

  // Room states (Existing)
  const [joinRoomId, setJoinRoomId] = useState('');
  const [createdRoom, setCreatedRoom] = useState<Room | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Secure Chat states (New)
  const [secureChats, setSecureChats] = useState<SecureChat[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);

  // Modal states
  const [showSecureModal, setShowSecureModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [securePassword, setSecurePassword] = useState('');
  const [secureConfirmPassword, setSecureConfirmPassword] = useState('');
  const [secureError, setSecureError] = useState('');
  const [isCreatingSecure, setIsCreatingSecure] = useState(false);

  const loadSecureChats = async () => {
    setError('');
    setLoadingChats(true);
    try {
      const chats = await secureChatService.getSecureChats();
      setSecureChats(chats);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setLoadingChats(false);
    }
  };

  const handleTabChange = (tab: 'rooms' | 'secure') => {
    setActiveTab(tab);
    if (tab === 'secure') {
      void loadSecureChats();
    }
  };


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

  // Secure Chat logic
  const handleUserSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSecureError('');
    setSearchingUsers(true);
    try {
      const users = await secureChatService.searchUsers(searchQuery);
      setUsersList(users);
    } catch (searchError) {
      setSecureError(getErrorMessage(searchError));
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleCreateSecureChat = async (e: FormEvent) => {
    e.preventDefault();
    setSecureError('');

    if (securePassword !== secureConfirmPassword) {
      setSecureError('Passwords do not match.');
      return;
    }

    if (securePassword.length < 8) {
      setSecureError('Password must be at least 8 characters.');
      return;
    }

    if (!selectedUser) return;

    setIsCreatingSecure(true);
    try {
      const response = await secureChatService.createSecureChat(selectedUser.id, securePassword);
      // Close modal & reset
      setShowSecureModal(false);
      setSearchQuery('');
      setUsersList([]);
      setSelectedUser(null);
      setSecurePassword('');
      setSecureConfirmPassword('');
      // Navigate to the secure chat
      navigate(`/secure-chats/${response.chat.id}`);
    } catch (createSecureError) {
      setSecureError(getErrorMessage(createSecureError));
    } finally {
      setIsCreatingSecure(false);
    }
  };

  const isUnlocked = (chatId: string) => {
    return Boolean(sessionStorage.getItem(`secure_unlock_${chatId}`));
  };

  return (
    <main className="h-dvh overflow-y-auto bg-[var(--base-color)] text-text-primary scrollbar-thin">
      <header className="glass-header sticky top-0 z-20 px-3 py-3 sm:px-6 sm:py-4">
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
              className="rounded-full border border-slate-300 px-2.5 py-1.5 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 sm:px-4 sm:py-2 sm:text-sm cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs Selector */}
      <div className="mx-auto mt-6 flex max-w-6xl justify-center px-3 sm:px-6">
        <div className="flex rounded-full bg-slate-200/60 p-1 dark:bg-slate-900 shadow-inner">
          <button
            onClick={() => handleTabChange('rooms')}
            className={`rounded-full px-5 py-2 text-xs font-bold transition-all sm:text-sm cursor-pointer ${
              activeTab === 'rooms'
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Temporary Rooms
          </button>
          <button
            onClick={() => handleTabChange('secure')}
            className={`rounded-full px-5 py-2 text-xs font-bold transition-all sm:text-sm cursor-pointer ${
              activeTab === 'secure'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950 shadow-md'
                : 'text-slate-600 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            🔒 Secure Chats
          </button>
        </div>
      </div>

      {activeTab === 'rooms' ? (
        <section className="mx-auto grid max-w-6xl gap-4 px-3 py-4 sm:gap-6 sm:px-6 sm:py-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="glass-card p-4 sm:p-6 md:p-8 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <p className="text-xs text-text-secondary sm:text-sm">
                  Signed in as
                </p>
                <h2 className="mt-1 truncate text-xl font-bold sm:text-2xl md:text-3xl">{user?.name}</h2>
                <p className="mt-0.5 truncate text-xs text-text-secondary sm:mt-1 sm:text-sm">
                  {user?.email}
                </p>
              </div>
              <button
                type="button"
                onClick={createRoom}
                disabled={isCreating}
                className="w-full shrink-0 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-primary-800 sm:w-auto sm:px-6 sm:py-3 cursor-pointer shadow-md"
              >
                {isCreating ? <Loader size="sm" light /> : 'Create Room'}
              </button>
            </div>

            {createdRoom && (
              <div className="mt-6 rounded-2xl border border-primary-200 bg-primary-50/50 p-3 dark:border-primary-900/30 dark:bg-primary-950/20 sm:mt-8 sm:p-4 md:p-6">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-800 dark:text-primary-200 sm:text-xs md:text-sm">
                  Room is ready
                </p>
                <div className="mt-3 flex flex-col gap-2.5 sm:mt-4 sm:flex-row sm:items-center sm:gap-3">
                  <code className="flex-1 break-all rounded-lg border border-primary-200 bg-white px-3 py-2.5 text-lg font-black tracking-[0.2em] text-slate-950 dark:border-primary-900/40 dark:bg-slate-950 dark:text-white sm:px-4 sm:py-3 sm:text-xl md:text-2xl">
                    {createdRoom.roomId}
                  </code>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => copyRoomId(createdRoom.roomId)}
                      className="flex-1 rounded-full border border-primary-300 px-4 py-2.5 text-xs font-bold text-primary-800 transition hover:bg-primary-100 dark:border-primary-800 dark:text-primary-200 dark:hover:bg-primary-950 sm:flex-none sm:px-5 sm:py-3 sm:text-sm cursor-pointer"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/rooms/${createdRoom.roomId}`)}
                      className="flex-[2] rounded-full bg-slate-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 sm:flex-none sm:px-5 sm:py-3 sm:text-sm cursor-pointer shadow-md"
                    >
                      Enter
                    </button>
                  </div>
                </div>
              </div>
            )}

            {(error || success) && (
              <p
                className={`mt-4 rounded-xl px-3 py-2.5 text-xs font-medium sm:mt-6 sm:px-4 sm:py-3 sm:text-sm ${
                  error
                    ? 'border border-red-200 bg-red-50 text-red-750 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200'
                    : 'border border-emerald-200 bg-emerald-50 text-emerald-750 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200'
                }`}
              >
                {error || success}
              </p>
            )}
          </div>

          <div className="glass-card p-4 sm:p-6 md:p-8 shadow-sm">
            <h2 className="text-lg font-bold sm:text-xl">Join Room</h2>
            <form onSubmit={joinRoom} className="mt-4 space-y-4 sm:mt-5 sm:space-y-5">
              <label className="block text-xs font-semibold text-text-secondary sm:text-sm">
                Room ID
                <div className="relative mt-1.5 sm:mt-2">
                  <input
                    type="text"
                    value={joinRoomId}
                    maxLength={6}
                    onChange={(event) =>
                      setJoinRoomId(event.target.value.toUpperCase())
                    }
                    className="design-input w-full px-3 py-3 text-lg font-bold uppercase tracking-[0.2em] outline-none sm:px-4 sm:py-4 sm:text-xl md:text-2xl text-center"
                    placeholder="AB12CD"
                  />
                </div>
              </label>
              <button
                type="submit"
                disabled={isJoining || joinRoomId.trim().length !== 6}
                className="flex w-full items-center justify-center rounded-full bg-slate-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 dark:disabled:bg-slate-700 dark:disabled:text-slate-400 sm:py-4 cursor-pointer shadow-md"
              >
                {isJoining ? <Loader size="sm" light /> : 'Join Room'}
              </button>
            </form>
          </div>
        </section>
      ) : (
        /* Secure Chats View */
        <section className="mx-auto max-w-4xl px-3 py-4 sm:px-6 sm:py-8">
          <div className="glass-card p-4 sm:p-6 md:p-8 shadow-lg">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 dark:border-slate-855">
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold sm:text-2xl flex items-center gap-2 text-slate-900 dark:text-white">
                  🔒 Secure Conversations
                </h2>
                <p className="text-xs text-text-secondary mt-1">
                  End-to-end encrypted chats stored in database and protected with passcode.
                </p>
              </div>
              <button
                onClick={() => setShowSecureModal(true)}
                className="w-full sm:w-auto justify-center rounded-full bg-slate-900 hover:bg-slate-800 px-5 py-2.5 text-xs font-bold text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition active:scale-[0.98] flex items-center gap-1.5 sm:text-sm shadow-md cursor-pointer whitespace-nowrap"
              >
                <span>+</span> New Secure Chat
              </button>
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-750 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-200">
                {error}
              </div>
            )}

            {loadingChats ? (
              <div className="flex py-12 justify-center">
                <Loader size="md" />
              </div>
            ) : secureChats.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-605 dark:bg-emerald-950/30 dark:text-emerald-400 text-2xl">
                  🔒
                </div>
                <h3 className="text-lg font-bold">No Secure Chats</h3>
                <p className="mx-auto mt-2 max-w-sm text-xs text-text-secondary">
                  Create a passcode-protected chat with another registered user. Messages persist securely.
                </p>
                <button
                  onClick={() => setShowSecureModal(true)}
                  className="mt-6 rounded-full border border-slate-900 px-5 py-2.5 text-xs font-bold text-slate-900 hover:bg-slate-100 dark:border-white dark:text-white dark:hover:bg-slate-900 transition sm:text-sm cursor-pointer"
                >
                  Start Chatting
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {secureChats.map((chat) => {
                  const unlocked = isUnlocked(chat.id);
                  return (
                    <div
                      key={chat.id}
                      onClick={() => navigate(`/secure-chats/${chat.id}`)}
                      className="group flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/50 p-4 transition-all hover:-translate-y-0.5 hover:border-emerald-500/50 hover:bg-white dark:border-slate-800/80 dark:bg-slate-950/40 dark:hover:bg-slate-900 shadow-sm"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Avatar */}
                        <div className="relative h-11 w-11 shrink-0 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                          {chat.recipient.name.slice(0, 2).toUpperCase()}
                          {/* Online Indicator */}
                          <span
                            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${
                              chat.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                            }`}
                          />
                        </div>
                        {/* Info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="truncate font-bold text-slate-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                              {chat.recipient.name}
                            </h4>
                            <span className="text-[10px] text-text-secondary hidden sm:inline">({chat.recipient.email})</span>
                          </div>
                          <p className="mt-1 truncate text-xs text-text-secondary max-w-[280px] sm:max-w-md">
                            {chat.lastMessage ? (
                              <span>
                                <span className="font-semibold text-slate-600 dark:text-slate-300">
                                  {chat.lastMessage.senderName}:{' '}
                                </span>
                                {chat.lastMessage.type === 'file' ? '📁 Shared file' : chat.lastMessage.content}
                              </span>
                            ) : (
                              <span className="italic text-slate-450 dark:text-slate-500">No messages yet</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Lock Status & Action */}
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-text-secondary hidden md:block">
                          {chat.lastMessage ? new Date(chat.lastMessage.createdAt).toLocaleDateString() : ''}
                        </span>
                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs">
                          {unlocked ? '🔓' : '🔒'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Start Secure Chat Modal */}
      {showSecureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-2xl bg-white/95 dark:bg-slate-900/95 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-md animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-105 pb-3 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                🔒 Start Secure Chat
              </h3>
              <button
                onClick={() => {
                  setShowSecureModal(false);
                  setSelectedUser(null);
                  setSearchQuery('');
                  setUsersList([]);
                  setSecurePassword('');
                  setSecureConfirmPassword('');
                  setSecureError('');
                }}
                className="rounded-full p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {secureError && (
              <div className="mt-3 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-650 dark:bg-red-950/20 dark:border-red-900/40 dark:text-red-400">
                {secureError}
              </div>
            )}

            {!selectedUser ? (
              /* Search User Screen */
              <div className="mt-4 space-y-4">
                <form onSubmit={handleUserSearch} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="design-input flex-1 min-w-0 px-5 py-2 text-sm outline-none"
                  />
                  <button
                    type="submit"
                    disabled={searchingUsers || !searchQuery.trim()}
                    className="rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 disabled:opacity-50 cursor-pointer shrink-0 w-full sm:w-auto"
                  >
                    {searchingUsers ? '...' : 'Search'}
                  </button>
                </form>

                <div className="max-h-60 overflow-y-auto space-y-1.5 scrollbar-thin">
                  {usersList.length === 0 ? (
                    <p className="text-center py-8 text-xs text-text-secondary">
                      {searchQuery ? 'No users found.' : 'Search for users to secure chat.'}
                    </p>
                  ) : (
                    usersList.map((usr) => (
                      <div
                        key={usr.id}
                        onClick={() => setSelectedUser(usr)}
                        className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-100 p-3 transition hover:border-emerald-500/50 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-950"
                      >
                        <div>
                          <p className="text-sm font-bold">{usr.name}</p>
                          <p className="text-[11px] text-text-secondary">{usr.email}</p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          Select ➔
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              /* Set Password Screen */
              <form onSubmit={handleCreateSecureChat} className="mt-4 space-y-4">
                <div className="rounded-xl bg-emerald-50/50 p-3 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30">
                  <p className="text-xs text-text-secondary">Selected User</p>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedUser.name}</p>
                  <p className="text-[10px] text-text-secondary">{selectedUser.email}</p>
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="mt-2 text-[10px] font-bold text-red-500 hover:underline cursor-pointer"
                  >
                    Change User
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                      Set Password
                    </label>
                    <input
                      type="password"
                      value={securePassword}
                      onChange={(e) => setSecurePassword(e.target.value)}
                      placeholder="Min 8 characters..."
                      className="design-input mt-1 w-full px-5 py-2.5 text-sm outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={secureConfirmPassword}
                      onChange={(e) => setSecureConfirmPassword(e.target.value)}
                      placeholder="Repeat password..."
                      className="design-input mt-1 w-full px-5 py-2.5 text-sm outline-none"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingSecure || !securePassword || !secureConfirmPassword}
                  className="w-full rounded-full bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isCreatingSecure ? 'Creating Secure Chat...' : 'Start Secure Conversation'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
};
