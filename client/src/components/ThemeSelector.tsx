import { useState, useRef, useEffect } from 'react';
import { useTheme, type Accent } from '../context/ThemeContext';
import { HugeiconsIcon } from '@hugeicons/react';
import { PaintBrush01Icon } from '@hugeicons/core-free-icons';

export const themes: { name: string; value: Accent; color: string }[] = [
  { name: 'Deep Slate', value: '#1A1D27', color: '#1A1D27' },
  { name: 'Dark Gray', value: '#1C1C1E', color: '#1C1C1E' },
  { name: 'Navy Blue', value: '#0D2137', color: '#0D2137' },
  { name: 'WhatsApp Green', value: '#005C4B', color: '#005C4B' },
  { name: 'WhatsApp Teal', value: '#1F2C34', color: '#1F2C34' },
  { name: 'Dark Blue-Gray', value: '#182229', color: '#182229' },
  { name: 'Discord Dark', value: '#1E1F22', color: '#1E1F22' },
  { name: 'Space Cadet', value: '#0F1117', color: '#0F1117' },
  { name: 'Midnight Blue', value: '#1B1F3B', color: '#1B1F3B' },
  { name: 'Dark Purple', value: '#1A0533', color: '#1A0533' },
  { name: 'Deep Space', value: '#0A1628', color: '#0A1628' },
  { name: 'Dark Plum', value: '#1F1B2E', color: '#1F1B2E' },
  { name: 'Forest Green', value: '#0D1F12', color: '#0D1F12' },
  { name: 'Steel Blue', value: '#162032', color: '#162032' },
  { name: 'Gothic Purple', value: '#1C1A2E', color: '#1C1A2E' },
];

export const ThemeSelector = ({ isInline = false }: { isInline?: boolean }) => {
  const { accent, setAccent } = useTheme();
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
        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all sm:h-10 sm:w-10 ${
          isOpen 
            ? 'border-primary-500 bg-primary-50 text-primary-600 dark:bg-primary-950/30' 
            : 'border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
        }`}
        title="Change Theme Color"
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
                className={`flex items-center gap-3 rounded-full px-3 py-2 text-sm font-semibold transition hover:bg-slate-50 dark:hover:bg-slate-900 ${
                  accent === theme.value ? 'bg-slate-100 dark:bg-slate-900 ring-1 ring-primary-500' : ''
                }`}
              >
                <span className="h-4 w-4 rounded-full border border-slate-200 dark:border-slate-800" style={{ backgroundColor: theme.color }} />
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
              <span className="h-full w-full rounded-full shadow-sm border border-slate-200 dark:border-slate-800" style={{ backgroundColor: theme.color }} />
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
