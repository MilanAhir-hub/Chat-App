import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MaterialIcon } from '../components/MaterialIcon';
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
        <label className="block text-left text-xs font-semibold text-[var(--color-text-primary)] sm:text-sm">
          Email
          <div className="relative mt-1.5 sm:mt-2">
            <MaterialIcon
              icon="mail"
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] sm:left-5"
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
              className="design-input w-full py-2.5 pl-11 pr-4 text-sm text-[var(--color-text-primary)] outline-none transition sm:py-3 sm:pl-13 sm:text-base"
              placeholder="you@example.com"
            />
          </div>
        </label>

        <label className="block text-left text-xs font-semibold text-[var(--color-text-primary)] sm:text-sm">
          Password
          <div className="relative mt-1.5 sm:mt-2">
            <MaterialIcon
              icon="lock"
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] sm:left-5"
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
              className="design-input w-full py-2.5 pl-11 pr-12 text-sm text-[var(--color-text-primary)] outline-none transition sm:py-3 sm:pl-13 sm:text-base"
              placeholder="Your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-muted)] transition hover:text-[var(--color-text-primary)]"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              <MaterialIcon icon={showPassword ? "visibility_off" : "visibility"} size={18} />
            </button>
          </div>
        </label>

        {error && (
          <p className="rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-3 py-2.5 text-xs font-medium text-[var(--color-error)] sm:px-4 sm:py-3 sm:text-sm">
            {error}
          </p>
        )}

        {success && (
          <p className="rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-3 py-2.5 text-xs font-medium text-[var(--color-success)] sm:px-4 sm:py-3 sm:text-sm">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-[var(--color-on-primary)] transition hover:opacity-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:py-3 cursor-pointer shadow-md"
        >
          {isSubmitting ? <Loader size="sm" light /> : 'Login'}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-[var(--color-text-secondary)] sm:mt-6 sm:text-sm">
        New here?{' '}
        <Link
          to="/signup"
          className="font-semibold text-[var(--color-primary)] hover:underline"
        >
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
};
