import { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { AccountMenu } from '../components/AccountMenu';
import { MaterialIcon } from '../components/MaterialIcon';
import { AppSidebar } from '../components/AppSidebar';

export const AppLayout = () => {
  const location = useLocation();
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Close drawer on mobile upon navigating
  useEffect(() => {
    setIsNavOpen(false);
  }, [location.pathname]);

  const navItems = [
    { path: '/home', label: 'Home', icon: 'home' },
    { path: '/rooms', label: 'Temporary Rooms', icon: 'forum' },
    { path: '/secure-chats', label: 'Secure Chats', icon: 'lock' },
    { path: '/theme', label: 'Theme', icon: 'palette' },
    { path: '/account', label: 'Account', icon: 'person' },
  ];

  const currentNavItem = navItems.find((item) =>
    location.pathname.startsWith(item.path)
  );
  const title = currentNavItem?.label || 'Home';

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--color-background)] text-[var(--color-text-primary)] transition-colors duration-200">
      {/* REUSABLE APP SIDEBAR */}
      <AppSidebar isOpen={isNavOpen} onClose={() => setIsNavOpen(false)} />

      {/* MAIN CONTENT AREA */}
      <div className="flex flex-1 flex-col overflow-hidden relative">
        {/* TOP APP BAR (56px Material 3 standard height - completely flat, borderless, shadowless) */}
        <header className="sticky top-0 z-20 px-4 bg-[var(--color-background)]">
          <div className="mx-auto flex h-14 items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setIsNavOpen(true)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] transition cursor-pointer"
                title="Open menu"
                aria-label="Open navigation menu"
              >
                <MaterialIcon icon="drag_handle" size={24} />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-bold text-[var(--color-text-primary)]">{title}</h1>
              </div>
            </div>

            {/* Right actions: 32px avatar */}
            <div className="flex shrink-0 items-center">
              <AccountMenu />
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto scrollbar-thin pb-16 md:pb-0 relative z-10 bg-[var(--color-background)]">
          <Outlet />
        </main>

        {/* MOBILE BOTTOM NAVIGATION (Icon-only with Material 3 pill highlights) */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-5 h-16 bg-[var(--color-surface)] pb-safe backdrop-blur-md shadow-[0_-2px_10px_rgba(0,0,0,0.04)] md:hidden">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={item.label}
                aria-label={item.label}
                className="flex items-center justify-center w-full h-full text-center transition-colors"
              >
                <div
                  className={`w-14 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]'
                  }`}
                >
                  <MaterialIcon
                    icon={item.icon}
                    size={24}
                    className={isActive ? 'text-[var(--color-on-primary-container)]' : 'text-[var(--color-text-secondary)]'}
                  />
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
