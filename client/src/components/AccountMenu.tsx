import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { ThemeSelector } from './ThemeSelector';
import { GlassThemeToggle } from './GlassThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { getThemePureColor } from '../config/themes';

export const AccountMenu = () => {
  const { user, logout } = useAuth();
  const { themeId, currentTheme } = useTheme();
  const navigate = useNavigate();
  const pureColor = getThemePureColor(themeId);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-3xl bg-[var(--color-surface)] p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="mb-4 pb-3 flex items-center gap-3 bg-[var(--color-hover)]/40 p-2.5 rounded-2xl">
            {/* Inner avatar with crisp theme ring */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/15 ring-1 ring-[var(--color-primary)]/20 p-1">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold shadow-2xs"
                style={{
                  backgroundColor: pureColor.bg,
                  color: pureColor.text,
                }}
              >
                {user?.name?.slice(0, 2).toUpperCase() || 'U'}
              </div>
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-[var(--color-text-primary)] truncate">{user?.name}</p>
              <p className="truncate text-xs text-[var(--color-text-secondary)]">{user?.email}</p>
            </div>
          </div>

          <div className="mb-4 space-y-3 pb-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">Appearance</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]">
                Theme {currentTheme.id}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between rounded-2xl bg-[var(--color-hover)] p-2.5">
                <span className="text-xs font-medium text-[var(--color-text-primary)]">Palette</span>
                <ThemeSelector />
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[var(--color-hover)] p-2.5">
                <span className="text-xs font-medium text-[var(--color-text-primary)]">Quick Toggle</span>
                <div className="flex items-center gap-2">
                  <GlassThemeToggle />
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full rounded-2xl bg-[var(--color-error)]/10 py-2.5 text-xs font-semibold text-[var(--color-error)] transition hover:bg-[var(--color-error)]/20 cursor-pointer"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};
