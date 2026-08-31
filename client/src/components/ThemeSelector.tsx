import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { MaterialIcon } from './MaterialIcon';
import { THEMES, type ThemeId } from '../config/themes';

// Backward compatibility export for components referencing themes array
export const themes = THEMES.map((t) => ({
  name: t.name,
  value: t.id,
  color: t.previewTokens.outgoing,
  theme: t,
}));

export const ThemeSelector = ({ isInline = false }: { isInline?: boolean }) => {
  const { themeId, setThemeId } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all cursor-pointer sm:h-10 sm:w-10 ${
          isOpen
            ? 'border-[var(--color-primary)] bg-[var(--color-selected)] text-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20'
            : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] hover:border-[var(--color-primary)]'
        }`}
        title="Select Visual Theme (A–N)"
        aria-label="Select Visual Theme"
      >
        <MaterialIcon icon="palette" size={18} />
      </button>

      {isOpen && !isInline && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-3 py-2 border-b border-[var(--color-divider)] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">
              Visual Themes (14)
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]">
              {THEMES.find((t) => t.id === themeId)?.family}
            </span>
          </div>

          <div className="max-h-[320px] overflow-y-auto scrollbar-thin p-1 space-y-1 mt-1">
            {THEMES.map((theme) => {
              const isSelected = themeId === theme.id;
              return (
                <button
                  key={theme.id}
                  onClick={() => {
                    setThemeId(theme.id as ThemeId);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold transition cursor-pointer text-left ${
                    isSelected
                      ? 'bg-[var(--color-selected)] text-[var(--color-text-primary)] ring-1 ring-[var(--color-primary)]'
                      : 'hover:bg-[var(--color-hover)] text-[var(--color-text-primary)]'
                  }`}
                >
                  {/* Theme swatch showing incoming + outgoing bubble colors */}
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full overflow-hidden border border-black/10 dark:border-white/10 shadow-xs relative">
                    <span
                      className="absolute inset-y-0 left-0 w-1/2"
                      style={{ backgroundColor: theme.previewTokens.incoming }}
                    />
                    <span
                      className="absolute inset-y-0 right-0 w-1/2"
                      style={{ backgroundColor: theme.previewTokens.outgoing }}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold truncate">{theme.name}</span>
                      {theme.badge && (
                        <span className="text-[9px] px-1 rounded bg-[var(--color-primary)] text-[var(--color-on-primary)] font-bold">
                          {theme.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[var(--color-text-secondary)] capitalize">
                      {theme.family} · {theme.mode}
                    </span>
                  </div>

                  {isSelected && (
                    <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isInline && (
        <div className="grid grid-cols-7 gap-2 py-2">
          {THEMES.map((theme) => {
            const isSelected = themeId === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => setThemeId(theme.id as ThemeId)}
                className={`group relative flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-110 cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-background)]'
                    : ''
                }`}
                title={`${theme.name} (${theme.mode})`}
              >
                <span className="h-full w-full rounded-full shadow-sm border border-[var(--color-border)] overflow-hidden relative block">
                  <span
                    className="absolute inset-y-0 left-0 w-1/2"
                    style={{ backgroundColor: theme.previewTokens.incoming }}
                  />
                  <span
                    className="absolute inset-y-0 right-0 w-1/2"
                    style={{ backgroundColor: theme.previewTokens.outgoing }}
                  />
                </span>
                {isSelected && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-white shadow-sm ring-1 ring-black/20" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
