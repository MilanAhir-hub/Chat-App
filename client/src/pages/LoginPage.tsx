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
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <label className="block text-left text-xs font-semibold text-[var(--text-primary)] sm:text-sm">
          Email
          <div className="relative mt-1.5 sm:mt-2">
            <HugeiconsIcon
              icon={Mail02Icon}
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] sm:left-3.5"
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
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--input-color)] py-2.5 pl-9 pr-4 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary-500)] focus:ring-4 focus:ring-[var(--primary-500)]/10 sm:py-3 sm:pl-10 sm:text-base"
              placeholder="you@example.com"
            />
          </div>
        </label>

        <label className="block text-left text-xs font-semibold text-[var(--text-primary)] sm:text-sm">
          Password
          <div className="relative mt-1.5 sm:mt-2">
            <HugeiconsIcon
              icon={SquareLockPasswordIcon}
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] sm:left-3.5"
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
              className="w-full rounded-lg border border-[var(--border-color)] bg-[var(--input-color)] py-2.5 pl-9 pr-12 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--primary-500)] focus:ring-4 focus:ring-[var(--primary-500)]/10 sm:py-3 sm:pl-10 sm:text-base"
              placeholder="Your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 -mr-1 text-[var(--text-tertiary)] transition hover:text-[var(--text-secondary)]"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              <HugeiconsIcon icon={showPassword ? ViewOffSlashIcon : ViewIcon} size={18} />
            </button>
          </div>
        </label>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700 sm:px-4 sm:py-3 sm:text-sm">
            {error}
          </p>
        )}

        {success && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700 sm:px-4 sm:py-3 sm:text-sm">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--primary-500)] px-4 py-2.5 text-sm font-bold text-black transition hover:bg-[color-mix(in_srgb,var(--primary-500)_90%,white)] hover:shadow-[0_0_15px_color-mix(in_srgb,var(--primary-500)_30%,transparent)] active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-primary-800 sm:py-3"
        >
          {isSubmitting ? <Loader size="sm" light /> : 'Login'}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-[var(--text-secondary)] sm:mt-6 sm:text-sm">
        New here?{' '}
        <Link
          to="/signup"
          className="font-semibold text-[var(--primary-600)] hover:text-[var(--primary-500)]"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
};
