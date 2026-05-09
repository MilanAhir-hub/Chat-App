import type { ReactNode } from 'react';
import { ThemeToggle } from './ThemeToggle';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export const AuthShell = ({ title, subtitle, children }: AuthShellProps) => (
  <main className="relative grid min-h-dvh bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white lg:grid-cols-[0.85fr_1.15fr]">

    {/* Theme toggle — hidden on mobile (shown inside card instead) */}
    <div className="absolute top-4 right-4 z-10 hidden sm:block">
      <ThemeToggle />
    </div>

    {/* Left branding panel — desktop only */}
    <section className="hidden bg-slate-950 text-white lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-300 lg:text-sm">
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
        bg-white dark:bg-slate-900
        px-5 py-8 sm:p-10
        sm:rounded-lg sm:border sm:border-slate-200 sm:shadow-xl sm:shadow-slate-200/70
        dark:sm:border-slate-800 dark:sm:shadow-black/20
      ">
        {/* Card header — theme toggle on mobile, title always */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-300 sm:text-sm">
              Chattogram
            </p>
            {/* Theme toggle inside card — mobile only */}
            <div className="sm:hidden">
              <ThemeToggle />
            </div>
          </div>
          <h2 className="mt-3 text-xl font-bold sm:text-2xl md:text-3xl">{title}</h2>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 sm:mt-2 sm:text-sm">
            {subtitle}
          </p>
        </div>

        {children}
      </div>
    </section>

  </main>
);