import { HugeiconsIcon } from '@hugeicons/react';
import { PaintBrush01Icon, SparklesIcon } from '@hugeicons/core-free-icons';
import { useTheme } from '../context/ThemeContext';

export const GlassThemeToggle = () => {
  const { glassTheme, toggleGlassTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleGlassTheme}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-300 active:scale-[0.88] hover:scale-105 sm:h-10 sm:w-10 ${
        glassTheme === 'adaptive'
          ? 'border-primary-500 bg-primary-500/10 text-primary-600'
          : 'border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
      }`}
      title={glassTheme === 'adaptive' ? 'Switch to Default Glass' : 'Switch to Adaptive Glass'}
    >
      <div className={`flex items-center justify-center transition-transform duration-500 ease-out ${glassTheme === 'adaptive' ? 'rotate-180 scale-110' : 'rotate-0'}`}>
        <HugeiconsIcon
          icon={glassTheme === 'adaptive' ? SparklesIcon : PaintBrush01Icon}
          size={20}
        />
      </div>
    </button>
  );
};
