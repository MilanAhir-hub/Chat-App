import { useState, useRef, useEffect } from 'react';
import { useTheme, type Accent } from '../context/ThemeContext';
import { HugeiconsIcon } from '@hugeicons/react';
import { PaintBrush01Icon } from '@hugeicons/core-free-icons';

export const ThemeSelector = () => {
  const { accent, setAccent } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const themes: { name: string; value: Accent; color: string }[] = [
    { name: 'Cyan', value: 'cyan', color: 'bg-cyan-500' },
    { name: 'Indigo', value: 'indigo', color: 'bg-indigo-500' },
    { name: 'Emerald', value: 'emerald', color: 'bg-emerald-500' },
    { name: 'Rose', value: 'rose', color: 'bg-rose-500' },
    { name: 'Amber', value: 'amber', color: 'bg-amber-500' },
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
        className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all ${
          isOpen 
            ? 'border-primary-500 bg-primary-50 text-primary-600 dark:bg-primary-950/30' 
            : 'border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
        }`}
        title="Change Accent Color"
      >
        <HugeiconsIcon icon={PaintBrush01Icon} size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-950 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-1 gap-1">
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
    </div>
  );
};
