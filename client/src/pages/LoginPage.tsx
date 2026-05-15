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
import { Loader } from '../components/Loader';

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
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Email Address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <HugeiconsIcon icon={Mail02Icon} size={20} className="text-slate-400" />
            </div>
            <input
              type="text"
              inputMode="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              className="block w-full rounded-xl border-2 border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-base text-slate-900 transition-all placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:border-primary-400 dark:focus:bg-slate-800 sm:py-4 sm:text-lg"
              placeholder="Enter your email"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <HugeiconsIcon icon={SquareLockPasswordIcon} size={20} className="text-slate-400" />
            </div>
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
              className="block w-full rounded-xl border-2 border-slate-200 bg-slate-50 py-3.5 pl-12 pr-14 text-base text-slate-900 transition-all placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary-500/15 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:focus:border-primary-400 dark:focus:bg-slate-800 sm:py-4 sm:text-lg"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              <HugeiconsIcon icon={showPassword ? ViewOffSlashIcon : ViewIcon} size={20} />
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border-2 border-red-200/50 bg-red-50/80 px-4 py-3.5 text-sm font-medium text-red-600 backdrop-blur-sm dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-xl border-2 border-emerald-200/50 bg-emerald-50/80 px-4 py-3.5 text-sm font-medium text-emerald-600 backdrop-blur-sm dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-4 text-lg font-semibold text-white shadow-lg shadow-primary-500/30 transition-all hover:from-primary-500 hover:to-primary-400 hover:shadow-xl hover:shadow-primary-500/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-500 disabled:shadow-none sm:mt-8"
        >
          {isSubmitting ? <Loader size="sm" light /> : 'Sign In'}
        </button>
      </form>

      <p className="mt-10 text-center text-base text-slate-500 dark:text-slate-400">
        Don't have an account?{' '}
        <Link
          to="/signup"
          className="font-semibold text-primary-600 transition-colors hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300"
        >
          Create one
        </Link>
      </p>
    </AuthShell>
  );
};