import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MaterialIcon } from '../components/MaterialIcon';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getThemePureColor } from '../config/themes';
import { Loader } from '../components/Loader';

export const SignupPage = () => {
  const { register } = useAuth();
  const { themeId } = useTheme();
  const pureColor = getThemePureColor(themeId);
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
    <div className="fixed inset-0 h-dvh overflow-hidden flex flex-col justify-between bg-[var(--color-background)] text-[var(--color-text-primary)] transition-colors duration-200 select-none">
      <div />

      {/* Main Center Area: Centered Branding + Google Keep Note Card */}
      <main className="flex-1 min-h-0 flex flex-col items-center justify-center px-4 py-6 sm:px-6">
        {/* Centered Chattogram Branding */}
        <div className="flex items-center justify-center gap-3 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-2xl shadow-xs transition-transform hover:scale-105"
            style={{
              backgroundColor: pureColor.bg,
              color: pureColor.text,
            }}
          >
            <MaterialIcon icon="lightbulb" size={24} />
          </div>
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Chattogram
          </span>
        </div>

        <div className="w-full max-w-md rounded-3xl bg-[var(--color-surface)] shadow-xl p-6 sm:p-8 space-y-6 relative animate-in fade-in zoom-in-95 duration-300">
          {/* Keep Note Pin */}
          <div
            className="absolute top-5 right-5 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
            title="Pinned Note"
          >
            <MaterialIcon icon="push_pin" size={20} />
          </div>

          {/* Note Card Header */}
          <div className="space-y-2 text-left pr-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] px-3 py-1 text-xs font-semibold">
              <MaterialIcon icon="person_add" size={13} />
              <span>Create Account</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Get started
            </h1>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
              Signup once, then start or join temporary rooms and secure chats.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            {/* Name Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                Full name
              </label>
              <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-hover)]/70 px-4 py-2.5 sm:py-3 focus-within:bg-[var(--color-surface)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/30 transition-all">
                <MaterialIcon
                  icon="person"
                  size={18}
                  className="text-[var(--color-primary)] shrink-0"
                />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  className="w-full bg-transparent text-sm sm:text-base outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
                  placeholder="Your name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                Email address
              </label>
              <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-hover)]/70 px-4 py-2.5 sm:py-3 focus-within:bg-[var(--color-surface)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/30 transition-all">
                <MaterialIcon
                  icon="mail"
                  size={18}
                  className="text-[var(--color-primary)] shrink-0"
                />
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  className="w-full bg-transparent text-sm sm:text-base outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--color-text-secondary)]">
                Password
              </label>
              <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-hover)]/70 px-4 py-2.5 sm:py-3 focus-within:bg-[var(--color-surface)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/30 transition-all">
                <MaterialIcon
                  icon="lock"
                  size={18}
                  className="text-[var(--color-primary)] shrink-0"
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
                  className="w-full bg-transparent text-sm sm:text-base outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  <MaterialIcon icon={showPassword ? 'visibility_off' : 'visibility'} size={18} />
                </button>
              </div>
            </div>

            {/* Feedback Alerts */}
            {error && (
              <div className="flex items-center gap-2 rounded-2xl bg-[var(--color-error)]/10 px-4 py-2.5 text-xs font-medium text-[var(--color-error)] animate-in fade-in">
                <MaterialIcon icon="error" size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 rounded-2xl bg-[var(--color-success)]/10 px-4 py-2.5 text-xs font-medium text-[var(--color-success)] animate-in fade-in">
                <MaterialIcon icon="check_circle" size={16} className="shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-bold text-[var(--color-on-primary)] shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader size="sm" light /> : 'Sign Up'}
              </button>
            </div>
          </form>

          {/* Footer Link */}
          <div className="border-t border-[var(--color-border)]/50 pt-4 text-center">
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-[var(--color-primary)] hover:underline"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Keep Footer */}
      <footer className="flex-shrink-0 py-3 text-center text-[11px] text-[var(--color-text-muted)]">
        Chattogram • Ephemeral rooms & encrypted private messaging
      </footer>
    </div>
  );
};
