/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import {
  THEMES,
  DEFAULT_THEME_ID,
  getThemeById,
  type ThemeId,
  type ThemeMetadata,
} from '../config/themes';

type ThemeMode = 'light' | 'dark';
export type Accent = string;
type GlassTheme = 'default' | 'adaptive';

interface ThemeContextValue {
  themeId: ThemeId;
  currentTheme: ThemeMetadata;
  theme: ThemeMode; // 'light' | 'dark' for backward compatibility
  isDark: boolean;
  setThemeId: (id: ThemeId) => void;
  toggleTheme: () => void;
  togglePairedTheme: () => void;
  accent: Accent;
  setAccent: (accent: Accent) => void;
  glassTheme: GlassTheme;
  toggleGlassTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const getInitialThemeId = (): ThemeId => {
  const saved = localStorage.getItem('selected-theme') as ThemeId | null;
  if (saved && THEMES.some((t) => t.id === saved)) {
    return saved;
  }
  // Check legacy 'theme'
  const legacyMode = localStorage.getItem('theme');
  if (legacyMode === 'dark') {
    return 'N'; // Google Messages Dark
  }
  return DEFAULT_THEME_ID; // 'M'
};

const getInitialGlassTheme = (): GlassTheme => {
  const saved = localStorage.getItem('glassTheme');
  return saved === 'adaptive' ? 'adaptive' : 'default';
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeId, setThemeIdState] = useState<ThemeId>(getInitialThemeId);
  const [glassTheme, setGlassTheme] = useState<GlassTheme>(getInitialGlassTheme);

  const currentTheme = useMemo(() => getThemeById(themeId), [themeId]);
  const isDark = currentTheme.mode === 'dark';

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeId);
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('selected-theme', themeId);
    localStorage.setItem('theme', currentTheme.mode);
  }, [themeId, isDark, currentTheme.mode]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme-style', glassTheme);
    localStorage.setItem('glassTheme', glassTheme);
  }, [glassTheme]);

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id);
  }, []);

  // Switches to the paired counterpart of the current active theme (e.g. M ↔ N, A ↔ B)
  const togglePairedTheme = useCallback(() => {
    setThemeIdState((currentId) => {
      const themeMeta = getThemeById(currentId);
      return themeMeta.pairedTheme || (themeMeta.mode === 'dark' ? 'M' : 'N');
    });
  }, []);

  const toggleTheme = togglePairedTheme;

  const toggleGlassTheme = useCallback(() => {
    setGlassTheme((current) => (current === 'adaptive' ? 'default' : 'adaptive'));
  }, []);

  const value = useMemo(
    () => ({
      themeId,
      currentTheme,
      theme: currentTheme.mode,
      isDark,
      setThemeId,
      toggleTheme,
      togglePairedTheme,
      accent: currentTheme.previewTokens.primary,
      setAccent: (accentVal: string) => {
        // If an accent string matches a theme's primary, switch to that theme
        const match = THEMES.find((t) => t.previewTokens.primary.toLowerCase() === accentVal.toLowerCase());
        if (match) {
          setThemeIdState(match.id);
        }
      },
      glassTheme,
      toggleGlassTheme,
    }),
    [
      themeId,
      currentTheme,
      isDark,
      setThemeId,
      toggleTheme,
      togglePairedTheme,
      glassTheme,
      toggleGlassTheme,
    ]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used inside ThemeProvider.');
  }
  return context;
};
