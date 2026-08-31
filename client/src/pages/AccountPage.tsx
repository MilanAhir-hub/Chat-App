import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getThemePureColor } from '../config/themes';
import { MaterialIcon } from '../components/MaterialIcon';

export const AccountPage = () => {
  const { user, logout } = useAuth();
  const { themeId, currentTheme } = useTheme();
  const navigate = useNavigate();
  const pureColor = getThemePureColor(themeId);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="mx-auto max-w-[720px] px-4 py-4 sm:py-6">
      {/* User Profile Card */}
      <div className="rounded-2xl bg-[var(--color-surface)] p-6 sm:p-8 shadow-xs flex flex-col gap-6">
        {/* User Profile Header */}
        <div className="flex items-center justify-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 ring-2 ring-[var(--color-primary)]/25 p-1">
            <div
              className="flex h-full w-full items-center justify-center rounded-full text-lg font-bold shadow-2xs"
              style={{
                backgroundColor: pureColor.bg,
                color: pureColor.text,
              }}
            >
              {user?.name?.slice(0, 2).toUpperCase() || 'U'}
            </div>
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-[var(--color-text-primary)] truncate">
              {user?.name || 'User'}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] truncate mt-0.5">
              {user?.email || 'No email provided'}
            </p>
          </div>
        </div>

        {/* Info Grid (Theme & Status) */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div
            onClick={() => navigate('/theme')}
            className="rounded-4xl bg-[var(--color-hover)] p-5 flex flex-col justify-between gap-3.5 cursor-pointer hover:bg-[var(--color-selected)] transition-all"
            title="Change theme"
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Active Theme
              </p>
              <MaterialIcon icon="palette" size={16} className="text-[var(--color-text-secondary)]" />
            </div>

            {/* Split Dual-Color Theme Bar (Left: Receiver, Right: Sender) */}
            <div className="h-8 w-full rounded-full overflow-hidden flex shadow-2xs">
              <div
                className="h-full w-1/2 transition-colors duration-200"
                style={{ backgroundColor: currentTheme.previewTokens.incoming }}
              />
              <div
                className="h-full w-1/2 transition-colors duration-200"
                style={{ backgroundColor: currentTheme.previewTokens.outgoing }}
              />
            </div>
          </div>

          <div className="rounded-4xl bg-[var(--color-hover)] p-5 flex flex-col justify-between gap-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Account Status
              </p>
              <MaterialIcon icon="verified" size={16} className="text-[var(--color-success)]" />
            </div>
            <p className="text-sm font-semibold text-[var(--color-success)] flex items-center gap-1.5 h-8">
              <span className="h-2 w-2 rounded-full bg-[var(--color-success)] inline-block" />
              Active Member
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center pt-1">
          <button
            type="button"
            onClick={handleLogout}
            className="h-10 rounded-full bg-[var(--color-error)]/10 px-6 text-sm font-bold text-[var(--color-error)] transition hover:bg-[var(--color-error)]/20 cursor-pointer flex items-center gap-2"
          >
            <MaterialIcon icon="logout" size={18} />
            <span>Logout from Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
