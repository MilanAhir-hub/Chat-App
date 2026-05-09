import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ViewIcon,
  ViewOffSlashIcon,
  Mail02Icon,
  SquareLockPasswordIcon,
  UserIcon
} from '@hugeicons/core-free-icons';
import { AuthShell } from '../components/AuthShell';
import { useAuth } from '../context/AuthContext';
import { Loader } from '../components/Loader';

export const SignupPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
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
      const message = await register(form);
      setSuccess(message);
      navigate('/dashboard', { replace: true });
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : 'Signup failed.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create account"
      subtitle="Signup once, then start or join temporary chat rooms."
    >
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <label className="block text-left text-xs font-semibold text-slate-700 dark:text-slate-200 sm:text-sm">
          Name
          <div className="relative mt-1.5 sm:mt-2">
            <HugeiconsIcon
              icon={UserIcon}
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 sm:left-3.5"
            />
            <input
              type="text"
              required
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-950 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:py-3 sm:pl-10 sm:text-base"
              placeholder="Milan"
            />
          </div>
        </label>

        <label className="block text-left text-xs font-semibold text-slate-700 dark:text-slate-200 sm:text-sm">
          Email
          <div className="relative mt-1.5 sm:mt-2">
            <HugeiconsIcon
              icon={Mail02Icon}
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 sm:left-3.5"
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
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-950 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:py-3 sm:pl-10 sm:text-base"
              placeholder="you@example.com"
            />
          </div>
        </label>

        <label className="block text-left text-xs font-semibold text-slate-700 dark:text-slate-200 sm:text-sm">
          Password
          <div className="relative mt-1.5 sm:mt-2">
            <HugeiconsIcon
              icon={SquareLockPasswordIcon}
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 sm:left-3.5"
            />
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-12 text-sm text-slate-950 outline-none transition focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:py-3 sm:pl-10 sm:text-base"
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 -mr-1 text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              <HugeiconsIcon icon={showPassword ? ViewOffSlashIcon : ViewIcon} size={18} />
            </button>
          </div>
        </label>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200 sm:px-4 sm:py-3 sm:text-sm">
            {error}
          </p>
        )}

        {success && (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200 sm:px-4 sm:py-3 sm:text-sm">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-primary-800 sm:py-3"
        >
          {isSubmitting ? <Loader size="sm" light /> : 'Signup'}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400 sm:mt-6 sm:text-sm">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-primary-700 hover:text-primary-600 dark:text-primary-300"
        >
          Login
        </Link>
      </p>
    </AuthShell>
  );
};
