import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getThemePureColor } from '../config/themes';
import { MaterialIcon } from '../components/MaterialIcon';

const FONT_SIZE_PRESETS = [
  { label: 'Small', size: 13, desc: 'Compact' },
  { label: 'Normal', size: 14.5, desc: 'Standard' },
  { label: 'Default', size: 16, desc: 'Material 3' },
  { label: 'Large', size: 18, desc: 'Spacious' },
  { label: 'Extra', size: 20, desc: 'Maximum' },
];

export const AccountPage = () => {
  const { user, logout } = useAuth();
  const { themeId, currentTheme, messageFontSize, setMessageFontSize, messageFontColor, setMessageFontColor } = useTheme();
  const navigate = useNavigate();
  const pureColor = getThemePureColor(themeId);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="mx-auto max-w-[720px] px-4 py-4 sm:py-6 flex flex-col gap-6">
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
      </div>

      {/* Message Typography & Style Settings Card */}
      <div className="rounded-2xl bg-[var(--color-surface)] p-6 sm:p-8 shadow-xs flex flex-col gap-6">
        {/* Font Size Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <MaterialIcon icon="format_size" size={22} />
            </div>
            <div>
              <h4 className="text-base font-bold text-[var(--color-text-primary)]">
                Message Text Size
              </h4>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Customizes readability for message bubbles only without altering the application UI
              </p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-bold text-[var(--color-primary)]">
            {messageFontSize}px
          </span>
        </div>

        {/* Preset Pills */}
        <div className="grid grid-cols-5 gap-2">
          {FONT_SIZE_PRESETS.map((preset) => {
            const isSelected = messageFontSize === preset.size;
            return (
              <button
                key={preset.size}
                type="button"
                onClick={() => setMessageFontSize(preset.size)}
                className={`flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-2xl text-xs font-bold transition-all duration-200 cursor-pointer border ${
                  isSelected
                    ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-primary)] shadow-xs scale-[1.02]'
                    : 'bg-[var(--color-hover)] text-[var(--color-text-secondary)] border-transparent hover:bg-[var(--color-selected)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <span className="text-[15px] leading-none font-semibold">Aa</span>
                <span className="text-[11px] truncate max-w-full">{preset.label}</span>
              </button>
            );
          })}
        </div>

        {/* Continuous Range Slider */}
        <div className="flex items-center gap-3 px-1">
          <span className="text-xs font-semibold text-[var(--color-text-muted)] select-none">A</span>
          <input
            type="range"
            min="12"
            max="22"
            step="0.5"
            value={messageFontSize}
            onChange={(e) => setMessageFontSize(Number(e.target.value))}
            aria-label="Message font size slider"
            className="w-full accent-[var(--color-primary)] h-1.5 bg-[var(--color-border)] rounded-lg cursor-pointer transition-all"
          />
          <span className="text-base font-bold text-[var(--color-text-muted)] select-none">A</span>
        </div>

        {/* Font Color Options (Black and White) */}
        <div className="flex flex-col gap-3 pt-4 border-t border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                <MaterialIcon icon="format_color_text" size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--color-text-primary)]">
                  Message Font Color
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Choose text contrast for message bubbles
                </p>
              </div>
            </div>
            {messageFontColor !== 'theme' && (
              <button
                type="button"
                onClick={() => setMessageFontColor('theme')}
                className="text-[11px] font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
              >
                Reset to Theme
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
            {/* Black Option */}
            <button
              type="button"
              onClick={() => setMessageFontColor('black')}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                messageFontColor === 'black'
                  ? 'border-[var(--color-primary)] bg-[var(--color-selected)] shadow-xs ring-2 ring-[var(--color-primary)]/25'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-hover)]'
              }`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-white shadow-xs">
                <span className="text-xs font-bold">Aa</span>
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-bold text-[var(--color-text-primary)]">Black</p>
                <p className="text-[10px] text-[var(--color-text-secondary)]">#000000</p>
              </div>
            </button>

            {/* White Option */}
            <button
              type="button"
              onClick={() => setMessageFontColor('white')}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                messageFontColor === 'white'
                  ? 'border-[var(--color-primary)] bg-[var(--color-selected)] shadow-xs ring-2 ring-[var(--color-primary)]/25'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-hover)]'
              }`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black ring-1 ring-slate-300 dark:ring-slate-700 shadow-xs">
                <span className="text-xs font-bold">Aa</span>
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-bold text-[var(--color-text-primary)]">White</p>
                <p className="text-[10px] text-[var(--color-text-secondary)]">#FFFFFF</p>
              </div>
            </button>

            {/* Theme Default Option */}
            <button
              type="button"
              onClick={() => setMessageFontColor('theme')}
              className={`hidden sm:flex items-center gap-3 p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                messageFontColor === 'theme'
                  ? 'border-[var(--color-primary)] bg-[var(--color-selected)] shadow-xs ring-2 ring-[var(--color-primary)]/25'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-hover)]'
              }`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-xs">
                <span className="text-xs font-bold">Aa</span>
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs font-bold text-[var(--color-text-primary)]">Theme</p>
                <p className="text-[10px] text-[var(--color-text-secondary)]">Auto-adaptive</p>
              </div>
            </button>
          </div>
        </div>

        {/* Live Interactive Chat Preview */}
        <div className="mt-1 flex flex-col gap-3 rounded-2xl bg-[var(--color-background)] p-4 border border-[var(--color-border)] select-none overflow-hidden">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
            <span>Live Bubble Preview</span>
            <span className="text-[10px] font-medium lowercase">real-time appearance</span>
          </div>

          {/* Incoming Sample */}
          <div className="flex justify-start pr-8">
            <div className="message-bubble message-bubble-text message-bubble-other flex flex-col gap-1">
              <span className="message-content">
                How does this font size and color feel?
              </span>
              <span className="message-timestamp text-[11px] self-end opacity-75">10:42 AM</span>
            </div>
          </div>

          {/* Outgoing Sample */}
          <div className="flex justify-end pl-8">
            <div className="message-bubble message-bubble-text message-bubble-mine flex flex-col gap-1">
              <span className="message-content">
                Looks crisp and readable in every theme!
              </span>
              <span className="message-timestamp text-[11px] self-end opacity-75">10:43 AM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Action Button */}
      <div className="flex justify-center pt-2 pb-6">
        <button
          type="button"
          onClick={handleLogout}
          className="h-11 rounded-full bg-[var(--color-error)]/10 px-8 text-sm font-bold text-[var(--color-error)] transition hover:bg-[var(--color-error)]/20 cursor-pointer flex items-center gap-2"
        >
          <MaterialIcon icon="logout" size={18} />
          <span>Logout from Session</span>
        </button>
      </div>
    </div>
  );
};
