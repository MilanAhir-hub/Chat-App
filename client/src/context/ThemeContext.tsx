/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';

type Theme = 'light' | 'dark';
export type Accent = '#1A1D27' | '#1C1C1E' | '#0D2137' | '#005C4B' | '#1F2C34' | '#182229' | '#1E1F22' | '#0F1117' | '#1B1F3B' | '#1A0533' | '#0A1628' | '#1F1B2E' | '#0D1F12' | '#162032' | '#1C1A2E';
type GlassTheme = 'default' | 'adaptive';

interface ThemeContextValue {
  theme: Theme;
  accent: Accent;
  glassTheme: GlassTheme;
  toggleTheme: () => void;
  setAccent: (accent: Accent) => void;
  toggleGlassTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const getInitialTheme = (): Theme => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

const getInitialAccent = (): Accent => {
  const savedAccent = localStorage.getItem('accent') as Accent;
  const validAccents: Accent[] = [
    '#1A1D27', '#1C1C1E', '#0D2137', '#005C4B', '#1F2C34',
    '#182229', '#1E1F22', '#0F1117', '#1B1F3B', '#1A0533',
    '#0A1628', '#1F1B2E', '#0D1F12', '#162032', '#1C1A2E'
  ];
  return validAccents.includes(savedAccent) ? savedAccent : '#1A1D27';
};

const getInitialGlassTheme = (): GlassTheme => {
  const saved = localStorage.getItem('glassTheme');
  return saved === 'adaptive' ? 'adaptive' : 'default';
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [accent, setAccentState] = useState<Accent>(getInitialAccent);
  const [glassTheme, setGlassTheme] = useState<GlassTheme>(getInitialGlassTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent.replace('#', '').toLowerCase());
    localStorage.setItem('accent', accent);
  }, [accent]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme-style', glassTheme);
    localStorage.setItem('glassTheme', glassTheme);
  }, [glassTheme]);

  const value = useMemo(
    () => ({
      theme,
      accent,
      glassTheme,
      toggleTheme: () =>
        setTheme((currentTheme) =>
          currentTheme === 'dark' ? 'light' : 'dark'
        ),
      setAccent: (newAccent: Accent) => setAccentState(newAccent),
      toggleGlassTheme: () =>
        setGlassTheme((current) =>
          current === 'adaptive' ? 'default' : 'adaptive'
        ),
    }),
    [theme, accent, glassTheme]
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
