import { useNavigate } from 'react-router-dom';
import { MaterialIcon } from '../components/MaterialIcon';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getThemePureColor } from '../config/themes';

export const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { themeId } = useTheme();
  const pureColor = getThemePureColor(themeId);

  return (
    <main className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 py-8 max-w-xl mx-auto text-center">
      {/* Minimal Greeting Header */}
      <div className="space-y-3 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl shadow-sm transition-transform hover:scale-105"
          style={{
            backgroundColor: pureColor.bg,
            color: pureColor.text,
          }}
        >
          <MaterialIcon icon="chat" size={32} />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Welcome{user?.name ? `, ${user.name}` : ' to Chattogram'}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto leading-relaxed">
            Fast, private real-time messaging and temporary rooms.
          </p>
        </div>
      </div>

      {/* 2 Main Action Navigation Buttons */}
      <div className="w-full max-w-md space-y-3.5 animate-in fade-in slide-in-from-bottom-4 duration-400">
        {/* Temporary Rooms */}
        <button
          type="button"
          onClick={() => navigate('/rooms')}
          className="group w-full flex items-center justify-between rounded-3xl bg-[var(--color-surface)] p-4.5 sm:p-5 shadow-xs hover:shadow-md hover:bg-[var(--color-hover)] transition-all duration-200 cursor-pointer text-left"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] group-hover:scale-105 transition-transform">
              <MaterialIcon icon="bolt" size={24} />
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                Temporary Rooms
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] truncate">
                Join or create ephemeral group rooms
              </p>
            </div>
          </div>
          <div className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all">
            <MaterialIcon icon="arrow_forward" size={20} />
          </div>
        </button>

        {/* Secure Chats */}
        <button
          type="button"
          onClick={() => navigate('/secure-chats')}
          className="group w-full flex items-center justify-between rounded-3xl bg-[var(--color-surface)] p-4.5 sm:p-5 shadow-xs hover:shadow-md hover:bg-[var(--color-hover)] transition-all duration-200 cursor-pointer text-left"
        >
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary)] text-[var(--color-on-primary)] group-hover:scale-105 transition-transform shadow-xs">
              <MaterialIcon icon="lock" size={24} />
            </div>
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
                Secure Chats
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)] truncate">
                Encrypted & passcode-protected 1-on-1 chats
              </p>
            </div>
          </div>
          <div className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all">
            <MaterialIcon icon="arrow_forward" size={20} />
          </div>
        </button>
      </div>
    </main>
  );
};
