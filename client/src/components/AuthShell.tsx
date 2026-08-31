import type { ReactNode } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { ThemeSelector } from './ThemeSelector';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export const AuthShell = ({ title, subtitle, children }: AuthShellProps) => (
  <main className="relative grid h-dvh overflow-y-auto bg-[var(--color-background)] text-[var(--color-text-primary)] lg:grid-cols-[0.85fr_1.15fr] transition-colors duration-200">
    {/* Theme toggles top right */}
    <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center gap-2">
      <ThemeSelector />
      <ThemeToggle />
    </div>

    {/* Left branding panel — desktop only */}
    <section className="hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)] lg:text-sm">
          Temporary Chat
        </p>
        <h1 className="mt-4 max-w-md text-3xl font-bold leading-tight lg:mt-5 lg:text-4xl xl:text-5xl">
          Room-based conversations that disappear cleanly.
        </h1>
      </div>
      <div className="space-y-4 text-sm text-slate-300">
        <div className="h-px w-full bg-slate-800" />
        <p>JWT cookies, protected routes, live rooms, and Socket.IO.</p>
      </div>
    </section>

    {/* Right auth section */}
    <section className="flex min-h-dvh items-center justify-center px-4 py-6 sm:min-h-0 sm:px-8 sm:py-8">
      <div className="
        w-full max-w-[calc(100vw-2rem)] sm:max-w-md
        min-h-dvh sm:min-h-0
        flex flex-col justify-center
        bg-[var(--color-surface)]
        px-5 py-8 sm:p-10
        sm:rounded-[24px] sm:border sm:border-[var(--color-border)] sm:shadow-xl
      ">
        {/* Card header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-primary)] sm:text-sm">
              Chattogram
            </p>
            {/* Theme toggle inside card — mobile only */}
            <div className="sm:hidden flex items-center gap-1.5">
              <ThemeSelector />
              <ThemeToggle />
            </div>
          </div>
          <h2 className="mt-3 text-xl font-bold sm:text-2xl md:text-3xl text-[var(--color-text-primary)]">{title}</h2>
          <p className="mt-1.5 text-xs text-[var(--color-text-secondary)] sm:mt-2 sm:text-sm">
            {subtitle}
          </p>
        </div>

        {children}
      </div>
    </section>
  </main>
);
