import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { MaterialIcon } from './MaterialIcon';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  customFooter?: React.ReactNode;
  actions?: React.ReactNode;
}

export const AppSidebar = ({ isOpen, onClose, customFooter, actions }: AppSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, togglePairedTheme } = useTheme();
  const { logout } = useAuth();
  const [isPlusOpen, setIsPlusOpen] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsPlusOpen(false);
    }
  }, [isOpen]);

  // Click anywhere outside the actions/plus area to close it automatically
  useEffect(() => {
    if (!isPlusOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setIsPlusOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isPlusOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { path: '/home', label: 'Home', icon: 'home' },
    { path: '/rooms', label: 'Temporary Rooms', icon: 'forum' },
    { path: '/secure-chats', label: 'Secure Chats', icon: 'lock' },
    { path: '/theme', label: 'Theme', icon: 'palette' },
    { path: '/account', label: 'Account', icon: 'person' },
  ];

  return (
    <>
      {/* MOBILE BACKDROP OVERLAY (z-60) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs transition-opacity md:hidden"
          onClick={onClose}
        />
      )}

      {/* SLIDING LEFT SIDEBAR / DRAWER (z-70: HIGHEST z-index) */}
      <aside
        className={`fixed inset-y-0 left-0 z-70 flex w-72 flex-col rounded-r-3xl bg-[var(--color-surface)] shadow-2xl transition-transform duration-300 ease-in-out md:static md:z-auto md:shadow-none overflow-hidden ${
          isOpen
            ? 'translate-x-0 md:w-64 md:translate-x-0'
            : '-translate-x-full md:w-0 md:-translate-x-full'
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between px-4">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] transition cursor-pointer"
            title="Collapse menu"
            aria-label="Collapse navigation menu"
          >
            <MaterialIcon icon="drag_handle" size={24} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 py-3 pr-3 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-4 rounded-r-full pl-6 pr-4 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[var(--color-selected)] text-[var(--color-primary)] font-bold shadow-xs'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <MaterialIcon
                  icon={item.icon}
                  size={22}
                  className={isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer: Plus option (above Logout button on right) + Light/Dark toggle & Logout */}
        <div className="p-4 space-y-3">
          {customFooter}

          {/* Expanded Actions Panel & Plus trigger wrapped in ref */}
          {actions && (
            <div ref={actionsRef} className="flex flex-col items-end space-y-2">
              <div
                className={`flex flex-col items-end gap-2 origin-bottom-right transition-all duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] ${
                  isPlusOpen
                    ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                    : 'opacity-0 scale-75 translate-y-4 pointer-events-none max-h-0 overflow-hidden'
                }`}
              >
                {actions}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsPlusOpen((prev) => !prev)}
                  className={`flex h-12 w-12 items-center justify-center bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-md hover:shadow-xl hover:scale-105 active:scale-90 transition-all duration-300 ease-out cursor-pointer ${
                    isPlusOpen ? 'rounded-full ring-4 ring-[var(--color-primary)]/20' : 'rounded-2xl'
                  }`}
                  title={isPlusOpen ? 'Close Actions' : 'Room Actions'}
                  aria-label={isPlusOpen ? 'Close Actions' : 'Room Actions'}
                >
                  <div
                    className={`transform transition-transform duration-300 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] flex items-center justify-center ${
                      isPlusOpen ? 'rotate-45' : 'rotate-0'
                    }`}
                  >
                    <MaterialIcon icon="add" size={24} />
                  </div>
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={togglePairedTheme}
              className="px-6 py-3 rounded-full text-xs font-bold bg-[var(--color-hover)] text-[var(--color-text-primary)] hover:bg-[var(--color-selected)] transition cursor-pointer"
            >
              {isDark ? 'Dark' : 'Light'}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="px-6 py-3 rounded-full text-xs font-bold bg-[var(--color-error)]/10 text-[var(--color-error)] hover:bg-[var(--color-error)]/20 transition cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
