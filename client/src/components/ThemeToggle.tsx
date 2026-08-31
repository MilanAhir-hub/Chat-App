import { useTheme } from '../context/ThemeContext';
import { MaterialIcon } from './MaterialIcon';
import { getThemeById } from '../config/themes';

export const ThemeToggle = () => {
  const { currentTheme, togglePairedTheme, isDark } = useTheme();
  const paired = getThemeById(currentTheme.pairedTheme);

  return (
    <button
      type="button"
      onClick={togglePairedTheme}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all cursor-pointer sm:h-10 sm:w-10 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] hover:border-[var(--color-primary)] shadow-sm"
      title={`Switch to paired theme: ${paired.name} (${paired.mode})`}
      aria-label={`Switch to paired theme: ${paired.name}`}
    >
      <MaterialIcon
        icon={isDark ? 'light_mode' : 'dark_mode'}
        size={20}
        className="transition-transform duration-200 hover:scale-110"
      />
    </button>
  );
};
