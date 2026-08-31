import { useState, useEffect, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { secureChatService, type SecureChat } from '../services/secureChat.service';
import { getErrorMessage } from '../services/http';
import { Loader } from '../components/Loader';
import { MaterialIcon } from '../components/MaterialIcon';
import { useTheme } from '../context/ThemeContext';
import { getThemePureColor } from '../config/themes';
import type { User } from '../types';

export const SecureChatsListPage = () => {
  const navigate = useNavigate();
  const { themeId } = useTheme();
  const pureColor = getThemePureColor(themeId);

  // Secure Chat states
  const [secureChats, setSecureChats] = useState<SecureChat[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    loadSecureChats();
  }, []);

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
      setShowSecureModal(false);
      resetModalState();
      navigate(`/secure-chats/${response.chat.id}`);
    } catch (createSecureError) {
      setSecureError(getErrorMessage(createSecureError));
    } finally {
      setIsCreatingSecure(false);
    }
  };

  const resetModalState = () => {
    setSearchQuery('');
    setUsersList([]);
    setSelectedUser(null);
    setSecurePassword('');
    setSecureConfirmPassword('');
    setSecureError('');
  };

  const isUnlocked = (chatId: string) => {
    return Boolean(sessionStorage.getItem(`secure_unlock_${chatId}`));
  };

  return (
    <div className="h-full w-full bg-[var(--color-background)] px-4 py-4 sm:py-6 max-w-[832px] mx-auto flex flex-col overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 shrink-0">
        <div className="min-w-0">
          <h2 className="text-[16px] font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <MaterialIcon icon="lock" size={22} className="text-[var(--color-primary)]" />
            Secure Conversations
          </h2>
          <p className="text-[13px] text-[var(--color-text-secondary)] mt-0.5">
            End-to-end encrypted chats protected with your private passcode.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowSecureModal(true)}
          className="hidden sm:flex items-center gap-2 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] px-5 py-2.5 text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition cursor-pointer shrink-0"
        >
          <MaterialIcon icon="add" size={18} />
          <span>New Secure Chat</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-[var(--color-error)]/10 p-3.5 text-xs font-medium text-[var(--color-error)] shrink-0">
          <div className="flex items-center gap-2">
            <MaterialIcon icon="error" size={18} />
            <p>{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            className="p-1 hover:opacity-75 cursor-pointer"
          >
            <MaterialIcon icon="close" size={16} />
          </button>
        </div>
      )}

      {loadingChats ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader size="md" />
        </div>
      ) : secureChats.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 select-none py-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] shadow-2xs">
            <MaterialIcon icon="lock" size={32} />
          </div>
          <div className="space-y-1 max-w-xs">
            <h3 className="text-base font-bold text-[var(--color-text-primary)]">
              No Secure Chats
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Start a passcode-protected encrypted conversation with another user.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowSecureModal(true)}
            className="rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] px-6 py-2.5 text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition cursor-pointer"
          >
            Start Conversation
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto scrollbar-thin space-y-3 pr-1 pb-16 md:pb-4">
          {secureChats.map((chat) => {
            const unlocked = isUnlocked(chat.id);
            return (
              <div
                key={chat.id}
                onClick={() => navigate(`/secure-chats/${chat.id}`)}
                className="group flex cursor-pointer items-center justify-between rounded-3xl bg-[var(--color-surface)] p-4.5 transition-all hover:bg-[var(--color-hover)] hover:shadow-md shadow-xs"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Recipient Avatar */}
                  <div
                    className="relative h-11 w-11 shrink-0 rounded-full flex items-center justify-center font-bold text-sm shadow-2xs"
                    style={{
                      backgroundColor: pureColor.bg,
                      color: pureColor.text,
                    }}
                  >
                    {chat.recipient.name?.slice(0, 2).toUpperCase() || 'U'}
                    <span
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[var(--color-surface)] ${
                        chat.isOnline
                          ? 'bg-[var(--color-success)] animate-pulse'
                          : 'bg-[var(--color-text-muted)]'
                      }`}
                    />
                  </div>

                  {/* Recipient Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate text-[15px] font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                        {chat.recipient.name}
                      </h4>
                      <span className="text-[11px] text-[var(--color-text-secondary)] hidden sm:inline truncate">
                        {chat.recipient.email}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[var(--color-text-secondary)] max-w-[280px] sm:max-w-md">
                      {chat.lastMessage ? (
                        <span>
                          <span className="font-semibold text-[var(--color-text-primary)]">
                            {chat.lastMessage.senderName}:{' '}
                          </span>
                          {chat.lastMessage.type === 'file'
                            ? '📁 Shared media'
                            : chat.lastMessage.content}
                        </span>
                      ) : (
                        <span className="italic text-[var(--color-text-muted)]">No messages yet</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-[var(--color-text-secondary)] hidden md:block">
                    {chat.lastMessage
                      ? new Date(chat.lastMessage.createdAt).toLocaleDateString()
                      : ''}
                  </span>
                  <div
                    className="flex items-center justify-center h-8 w-8 rounded-full bg-[var(--color-hover)] text-[var(--color-text-secondary)]"
                    title={unlocked ? 'Unlocked session' : 'Password locked'}
                  >
                    <MaterialIcon
                      icon={unlocked ? 'lock_open' : 'lock'}
                      size={16}
                      className={unlocked ? 'text-[var(--color-success)]' : 'text-[var(--color-text-muted)]'}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Action Button (Google M3 FAB) - Smooth Plus -> Cross Rotation */}
      {createPortal(
        <div className="fixed bottom-20 md:bottom-8 right-6 z-50">
          <button
            type="button"
            onClick={() => {
              if (showSecureModal) {
                setShowSecureModal(false);
                resetModalState();
              } else {
                setShowSecureModal(true);
              }
            }}
            className={`flex h-14 w-14 items-center justify-center bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-lg hover:shadow-xl hover:scale-105 active:scale-90 transition-all duration-300 ease-out cursor-pointer ${
              showSecureModal ? 'rounded-full ring-4 ring-[var(--color-primary)]/20' : 'rounded-2xl'
            }`}
            title={showSecureModal ? 'Close' : 'Create Secure Chat'}
            aria-label={showSecureModal ? 'Close' : 'Create Secure Chat'}
          >
            <div
              className={`transform transition-transform duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] flex items-center justify-center ${
                showSecureModal ? 'rotate-45' : 'rotate-0'
              }`}
            >
              <MaterialIcon icon="add" size={28} />
            </div>
          </button>
        </div>,
        document.body
      )}

      {/* Backdrop Overlay (Portal-rendered at z-40 to cover top navbar) */}
      {showSecureModal &&
        createPortal(
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => {
              setShowSecureModal(false);
              resetModalState();
            }}
          />,
          document.body
        )}

      {/* Google Keep-Style Note Card Dialog (Portal-rendered at z-50) */}
      {showSecureModal &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-[480px] rounded-2xl bg-[var(--color-surface)] shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden flex flex-col transition-all pointer-events-auto">
              {/* Google Keep Card Header (Note Title - No Cross Icon) */}
              <div className="px-6 pt-5 pb-1">
                <input
                  type="text"
                  readOnly
                  value="New Secure Chat"
                  className="w-full bg-transparent text-[17px] font-medium text-[var(--color-text-primary)] outline-none select-none cursor-default"
                />
              </div>

              {/* Google Keep Card Body */}
              <div className="px-6 py-3 space-y-4">
                {!selectedUser ? (
                  /* Step 1: Search User */
                  <form onSubmit={handleUserSearch} className="space-y-4">
                    {/* Input Alone */}
                    <div className="rounded-2xl bg-[var(--color-hover)] px-5 py-3.5 focus-within:bg-[var(--color-surface)] focus-within:ring-2 focus-within:ring-[var(--color-primary)] transition-all">
                      <p className="text-[11px] font-medium text-[var(--color-text-muted)]">Find User</p>
                      <input
                        type="text"
                        autoFocus
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full bg-transparent text-[15px] font-medium text-[var(--color-text-primary)] placeholder:text-[14px] placeholder:font-normal placeholder:text-[var(--color-text-muted)] outline-none mt-1"
                      />
                    </div>

                    {/* Users list if searched */}
                    {usersList.length > 0 && (
                      <div className="max-h-52 overflow-y-auto space-y-2 scrollbar-thin">
                        {usersList.map((usr) => (
                          <div
                            key={usr.id}
                            onClick={() => setSelectedUser(usr)}
                            className="flex cursor-pointer items-center justify-between rounded-2xl bg-[var(--color-hover)] p-3.5 transition hover:bg-[var(--color-selected)]"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-2xs"
                                style={{
                                  backgroundColor: pureColor.bg,
                                  color: pureColor.text,
                                }}
                              >
                                {usr.name?.slice(0, 2).toUpperCase() || 'U'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">
                                  {usr.name}
                                </p>
                                <p className="text-[10px] text-[var(--color-text-secondary)] truncate">
                                  {usr.email}
                                </p>
                              </div>
                            </div>
                            <span className="text-[11px] font-bold text-[var(--color-primary)] shrink-0">
                              Select
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {secureError && (
                      <p className="text-xs font-medium text-[var(--color-error)] px-1">
                        {secureError}
                      </p>
                    )}

                    {/* Google Keep Card Action Toolbar: Close & Search */}
                    <div className="flex items-center gap-2 pt-2 pb-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowSecureModal(false);
                          resetModalState();
                        }}
                        className="flex-1 h-10 py-6 rounded-full text-[16px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)] transition cursor-pointer flex items-center justify-center"
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        disabled={searchingUsers || !searchQuery.trim()}
                        className="flex-1 h-10 py-6 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-[16px] font-medium hover:opacity-95 transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {searchingUsers ? <Loader size="sm" light /> : 'Search'}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Step 2: Set Passcode */
                  <form onSubmit={handleCreateSecureChat} className="space-y-4">
                    {/* Selected User Header Chip */}
                    <div className="flex items-center justify-between rounded-2xl bg-[var(--color-primary-container)]/40 px-4 py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-2xs"
                          style={{
                            backgroundColor: pureColor.bg,
                            color: pureColor.text,
                          }}
                        >
                          {selectedUser.name?.slice(0, 2).toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[var(--color-text-primary)] truncate">
                            {selectedUser.name}
                          </p>
                          <p className="text-[10px] text-[var(--color-text-secondary)] truncate">
                            {selectedUser.email}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="text-[11px] font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
                      >
                        Change
                      </button>
                    </div>

                    {/* Passcode Inputs */}
                    <div className="rounded-2xl bg-[var(--color-hover)] px-5 py-3.5 focus-within:bg-[var(--color-surface)] focus-within:ring-2 focus-within:ring-[var(--color-primary)] transition-all">
                      <p className="text-[11px] font-medium text-[var(--color-text-muted)]">Passcode</p>
                      <input
                        type="password"
                        autoFocus
                        value={securePassword}
                        onChange={(e) => setSecurePassword(e.target.value)}
                        placeholder="Min 8 characters..."
                        className="w-full bg-transparent text-[15px] font-medium text-[var(--color-text-primary)] placeholder:text-[14px] placeholder:font-normal placeholder:text-[var(--color-text-muted)] outline-none mt-1"
                        required
                      />
                    </div>

                    <div className="rounded-2xl bg-[var(--color-hover)] px-5 py-3.5 focus-within:bg-[var(--color-surface)] focus-within:ring-2 focus-within:ring-[var(--color-primary)] transition-all">
                      <p className="text-[11px] font-medium text-[var(--color-text-muted)]">Confirm Passcode</p>
                      <input
                        type="password"
                        value={secureConfirmPassword}
                        onChange={(e) => setSecureConfirmPassword(e.target.value)}
                        placeholder="Re-enter passcode..."
                        className="w-full bg-transparent text-[15px] font-medium text-[var(--color-text-primary)] placeholder:text-[14px] placeholder:font-normal placeholder:text-[var(--color-text-muted)] outline-none mt-1"
                        required
                      />
                    </div>

                    {secureError && (
                      <p className="text-xs font-medium text-[var(--color-error)] px-1">
                        {secureError}
                      </p>
                    )}

                    {/* Google Keep Card Action Toolbar: Back & Start Chat */}
                    <div className="flex items-center gap-2 pt-2 pb-1">
                      <button
                        type="button"
                        onClick={() => setSelectedUser(null)}
                        className="flex-1 h-10 py-6 rounded-full text-[16px] font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)] transition cursor-pointer flex items-center justify-center"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isCreatingSecure || !securePassword || !secureConfirmPassword}
                        className="flex-1 h-10 py-6 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] text-[16px] font-medium hover:opacity-95 transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        {isCreatingSecure ? <Loader size="sm" light /> : 'Start Chat'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
