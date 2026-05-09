import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ViewIcon,
  ViewOffSlashIcon,
  Mail02Icon,
  SquareLockPasswordIcon
} from '@hugeicons/core-free-icons';
import { AuthShell } from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as { from?: { pathname?: string } } | null;
  const redirectTo = routeState?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const message = await login(form);
      setSuccess(message);
      navigate(redirectTo, { replace: true });
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Login failed.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Login to create a room or continue to a shared room."
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <label className="block text-left text-sm font-semibold text-slate-700 dark:text-slate-200">
          Email
          <div className="relative mt-1.5 sm:mt-2">
            <HugeiconsIcon
              icon={Mail02Icon}
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              inputMode="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 sm:py-3 pl-10 pr-4 text-sm sm:text-base text-slate-950 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              placeholder="you@example.com"
            />
          </div>
        </label>

        <label className="block text-left text-sm font-semibold text-slate-700 dark:text-slate-200">
          Password
          <div className="relative mt-1.5 sm:mt-2">
            <HugeiconsIcon
              icon={SquareLockPasswordIcon}
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 sm:py-3 pl-10 pr-12 text-sm sm:text-base text-slate-950 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              placeholder="Your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200 p-1 -mr-1"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              <HugeiconsIcon icon={showPassword ? ViewOffSlashIcon : ViewIcon} size={20} />
            </button>
          </div>
        </label>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        )}

        {success && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 sm:py-3 text-sm font-bold text-white transition hover:bg-primary-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-primary-800"
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p className="mt-5 sm:mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        New here?{' '}
        <Link
          to="/signup"
          className="font-semibold text-primary-700 hover:text-primary-600 dark:text-primary-300"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
};