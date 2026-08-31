import { useTheme } from '../context/ThemeContext';
import { MaterialIcon } from '../components/MaterialIcon';

export const GlassThemeToggle = () => {
  const { glassTheme, toggleGlassTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleGlassTheme}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300 active:scale-[0.88] hover:scale-105 sm:h-10 sm:w-10 cursor-pointer ${
        glassTheme === 'adaptive'
          ? 'border-[var(--color-primary)] bg-[var(--color-selected)] text-[var(--color-primary)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-hover)] hover:border-[var(--color-primary)]'
      }`}
      title={glassTheme === 'adaptive' ? 'Switch to Default Glass' : 'Switch to Adaptive Glass'}
    >
      <div className={`flex items-center justify-center transition-transform duration-500 ease-out ${glassTheme === 'adaptive' ? 'rotate-180 scale-110' : 'rotate-0'}`}>
        <MaterialIcon
          icon={glassTheme === 'adaptive' ? "auto_awesome" : "brush"}
          size={20}
        />
      </div>
    </button>
  );
};
