import { useState, useRef, useEffect } from 'react';
import { useTheme, type Accent } from '../context/ThemeContext';
import { HugeiconsIcon } from '@hugeicons/react';
import { PaintBrush01Icon } from '@hugeicons/core-free-icons';

export const ThemeSelector = ({ isInline = false }: { isInline?: boolean }) => {
  const { accent, setAccent } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const themes: { name: string; value: Accent; color: string }[] = [
    { name: 'Cyan', value: 'cyan', color: 'bg-cyan-500' },
    { name: 'Teal', value: 'teal', color: 'bg-teal-500' },
    { name: 'Emerald', value: 'emerald', color: 'bg-emerald-500' },
    { name: 'Green', value: 'green', color: 'bg-green-500' },
    { name: 'Lime', value: 'lime', color: 'bg-lime-500' },
    { name: 'Yellow', value: 'yellow', color: 'bg-yellow-500' },
    { name: 'Amber', value: 'amber', color: 'bg-amber-500' },
    { name: 'Orange', value: 'orange', color: 'bg-orange-500' },
    { name: 'Rose', value: 'rose', color: 'bg-rose-500' },
    { name: 'Pink', value: 'pink', color: 'bg-pink-500' },
    { name: 'Fuchsia', value: 'fuchsia', color: 'bg-fuchsia-500' },
    { name: 'Violet', value: 'violet', color: 'bg-violet-500' },
    { name: 'Indigo', value: 'indigo', color: 'bg-indigo-500' },
    { name: 'Blue', value: 'blue', color: 'bg-blue-500' },
    { name: 'Sky', value: 'sky', color: 'bg-sky-500' },
  ];

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
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all sm:h-10 sm:w-10 ${
          isOpen 
            ? 'border-primary-500 bg-primary-50 text-primary-600 dark:bg-primary-950/30' 
            : 'border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
        }`}
        title="Change Accent Color"
      >
        <HugeiconsIcon icon={PaintBrush01Icon} size={18} />
      </button>

      {isOpen && !isInline && (
        <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-950 z-50 animate-in fade-in slide-in-from-top-2 duration-200 sm:w-64">
          <div className="grid grid-cols-2 gap-1 max-h-[320px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 p-1">
            {themes.map((theme) => (
              <button
                key={theme.value}
                onClick={() => {
                  setAccent(theme.value);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900 ${
                  accent === theme.value ? 'bg-slate-100 dark:bg-slate-900 ring-1 ring-primary-500' : ''
                }`}
              >
                <span className={`h-4 w-4 rounded-full ${theme.color}`} />
                <span className="flex-1 text-left">{theme.name}</span>
                {accent === theme.value && (
                  <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {isInline && (
        <div className="grid grid-cols-5 gap-2 py-2">
          {themes.map((theme) => (
            <button
              key={theme.value}
              onClick={() => setAccent(theme.value)}
              className={`group relative flex h-8 w-8 items-center justify-center rounded-full transition-all hover:scale-110 ${
                accent === theme.value ? 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-slate-950' : ''
              }`}
              title={theme.name}
            >
              <span className={`h-full w-full rounded-full ${theme.color} shadow-sm`} />
              {accent === theme.value && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-white shadow-sm" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
