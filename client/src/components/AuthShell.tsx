import type { ReactNode } from 'react';
import { ThemeToggle } from './ThemeToggle';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export const AuthShell = ({ title, subtitle, children }: AuthShellProps) => (
  <main className="relative grid h-dvh overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 text-slate-950 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 dark:text-white lg:grid-cols-[0.85fr_1.15fr]">

    {/* Theme toggle — hidden on mobile (shown inside card instead) */}
    <div className="absolute top-4 right-4 z-10 hidden sm:block">
      <ThemeToggle />
    </div>

    {/* Left branding panel — desktop only */}
    <section className="hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-400">
          Chattogram
        </p>
        <h1 className="mt-6 max-w-lg text-4xl font-bold leading-tight tracking-tight lg:mt-8 lg:text-5xl xl:text-6xl">
          Instant conversations,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-300">
            zero traces.
          </span>
        </h1>
        <p className="mt-6 max-w-md text-lg text-slate-400 lg:text-xl">
          Room-based messaging that keeps things clean and temporary.
        </p>
      </div>
      <div className="space-y-5 text-base text-slate-400">
        <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-700 to-transparent" />
        <div className="flex gap-8">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>JWT Auth</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary-500" />
            <span>Socket.IO</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Real-time</span>
          </div>
        </div>
      </div>
    </section>

    {/* Right auth section */}
    <section className="flex min-h-dvh items-center justify-center px-6 py-8 sm:min-h-0 sm:px-10 sm:py-12">
      <div className="
        w-full max-w-[calc(100vw-3rem)] sm:max-w-lg
        min-h-dvh sm:min-h-0
        flex flex-col justify-center
        bg-white/80 dark:bg-slate-900/80
        px-8 py-10 sm:px-12 sm:py-12
        rounded-2xl sm:rounded-3xl
        border border-slate-200/80 dark:border-slate-700/80
        shadow-2xl shadow-slate-200/50
        dark:shadow-2xl dark:shadow-black/30
        backdrop-blur-md
      ">
        {/* Card header — theme toggle on mobile, title always */}
        <div className="mb-8 sm:mb-10">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
              Chattogram
            </p>
            {/* Theme toggle inside card — mobile only */}
            <div className="sm:hidden">
              <ThemeToggle />
            </div>
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:mt-5 sm:text-3xl md:text-4xl">
            {title}
          </h2>
          <p className="mt-3 text-base text-slate-500 dark:text-slate-400 sm:mt-4">
            {subtitle}
          </p>
        </div>

        {children}
      </div>
    </section>

  </main>
);