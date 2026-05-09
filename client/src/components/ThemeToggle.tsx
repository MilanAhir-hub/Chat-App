import { HugeiconsIcon } from '@hugeicons/react';
import { Sun01Icon, Moon01Icon } from '@hugeicons/core-free-icons';
import { useTheme } from '../context/ThemeContext';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <HugeiconsIcon 
        icon={theme === 'dark' ? Sun01Icon : Moon01Icon} 
        size={20} 
      />
    </button>
  );
};
