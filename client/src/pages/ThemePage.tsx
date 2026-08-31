import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTheme } from '../context/ThemeContext';
import { MaterialIcon } from '../components/MaterialIcon';
import { THEMES, getThemeById, type ThemeId } from '../config/themes';

export const ThemePage = () => {
  const { themeId, setThemeId, currentTheme } = useTheme();

  // Mode tab: 'light' or 'dark' (defaults to current theme's mode)
  const [selectedMode, setSelectedMode] = useState<'light' | 'dark'>(
    currentTheme.mode
  );

  // Sync mode tab when active theme mode changes externally
  useEffect(() => {
    setSelectedMode(currentTheme.mode);
  }, [currentTheme.mode]);

  // Handle switching between Light and Dark mode tabs
  const handleModeSelect = useCallback(
    (mode: 'light' | 'dark') => {
      setSelectedMode(mode);

      // If current active theme is already in the selected mode, nothing to switch
      if (currentTheme.mode === mode) return;

      if (mode === 'light') {
        // Retrieve last chosen light theme, or paired light theme, or default 'M'
        const savedLight = localStorage.getItem('selected-light-theme') as ThemeId | null;
        const validLight =
          savedLight && THEMES.some((t) => t.id === savedLight && t.mode === 'light')
            ? savedLight
            : currentTheme.pairedTheme && getThemeById(currentTheme.pairedTheme).mode === 'light'
            ? currentTheme.pairedTheme
            : 'M';

        setThemeId(validLight);
      } else {
        // Retrieve last chosen dark theme, or paired dark theme, or default 'N'
        const savedDark = localStorage.getItem('selected-dark-theme') as ThemeId | null;
        const validDark =
          savedDark && THEMES.some((t) => t.id === savedDark && t.mode === 'dark')
            ? savedDark
            : currentTheme.pairedTheme && getThemeById(currentTheme.pairedTheme).mode === 'dark'
            ? currentTheme.pairedTheme
            : 'N';

        setThemeId(validDark);
      }
    },
    [currentTheme, setThemeId]
  );

  // Handle selecting a specific theme from the list
  const handleThemeSelect = useCallback(
    (selectedId: ThemeId) => {
      setThemeId(selectedId);
      const selectedMeta = getThemeById(selectedId);
      if (selectedMeta.mode === 'light') {
        localStorage.setItem('selected-light-theme', selectedId);
      } else {
        localStorage.setItem('selected-dark-theme', selectedId);
      }
    },
    [setThemeId]
  );

  // Memoize filtered themes for fast and smooth rendering
  const filteredThemes = useMemo(
    () => THEMES.filter((t) => t.mode === selectedMode),
    [selectedMode]
  );

  return (
    <div className="mx-auto max-w-[720px] px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      {/* 2 Mode Options (Light / Dark) */}
      <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[var(--color-surface)] shadow-xs">
        <button
          type="button"
          onClick={() => handleModeSelect('light')}
          className={`flex items-center justify-center gap-2 py-6 px-8 rounded-full text-sm font-bold transition-all cursor-pointer ${
            selectedMode === 'light'
              ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]'
          }`}
        >
          <MaterialIcon icon="light_mode" size={20} />
          <span>Light</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeSelect('dark')}
          className={`flex items-center justify-center gap-2 py-6 px-8 rounded-full text-sm font-bold transition-all cursor-pointer ${
            selectedMode === 'dark'
              ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-hover)]'
          }`}
        >
          <MaterialIcon icon="dark_mode" size={20} />
          <span>Dark</span>
        </button>
      </div>

      {/* Full-width split color bars (Left: Receiver / Right: Sender, Checkmark directly on middle dividing line) */}
      <div className="space-y-4 pt-1">
        {filteredThemes.map((theme) => {
          const isSelected = themeId === theme.id;
          const { incoming, outgoing } = theme.previewTokens;

          return (
            <div
              key={theme.id}
              onClick={() => handleThemeSelect(theme.id as ThemeId)}
              className={`group relative flex h-16 sm:h-20 w-full overflow-hidden rounded-full sm:rounded-3xl transition-all duration-200 cursor-pointer shadow-xs ${
                isSelected
                  ? 'ring-3 ring-[var(--color-primary)] shadow-lg scale-[1.01]'
                  : 'hover:shadow-md hover:scale-[1.005]'
              }`}
              title={`${theme.name} (Receiver: ${incoming} | Sender: ${outgoing})`}
            >
              {/* Left half: Receiver message color (full 50% width) */}
              <div
                className="h-full w-1/2 transition-colors duration-200"
                style={{ backgroundColor: incoming }}
              />

              {/* Middle separating line */}
              <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-black/15 dark:bg-white/15 z-0" />

              {/* Right half: Sender message color (full 50% width) */}
              <div
                className="h-full w-1/2 transition-colors duration-200"
                style={{ backgroundColor: outgoing }}
              />

              {/* Center Checkmark / Right icon right above the middle separate line */}
              {isSelected && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-xl ring-4 ring-[var(--color-surface)] animate-in zoom-in-75 duration-200">
                  <MaterialIcon icon="check" size={22} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
