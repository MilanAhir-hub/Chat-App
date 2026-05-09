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
export type Accent = 'cyan' | 'indigo' | 'emerald' | 'rose' | 'amber' | 'teal' | 'green' | 'blue' | 'violet' | 'orange' | 'fuchsia' | 'sky' | 'lime' | 'yellow' | 'pink';

interface ThemeContextValue {
  theme: Theme;
  accent: Accent;
  toggleTheme: () => void;
  setAccent: (accent: Accent) => void;
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
    'cyan', 'indigo', 'emerald', 'rose', 'amber',
    'teal', 'green', 'blue', 'violet', 'orange',
    'fuchsia', 'sky', 'lime', 'yellow', 'pink'
  ];
  return validAccents.includes(savedAccent) ? savedAccent : 'cyan';
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [accent, setAccentState] = useState<Accent>(getInitialAccent);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accent);
    localStorage.setItem('accent', accent);
  }, [accent]);

  const value = useMemo(
    () => ({
      theme,
      accent,
      toggleTheme: () =>
        setTheme((currentTheme) =>
          currentTheme === 'dark' ? 'light' : 'dark'
        ),
      setAccent: (newAccent: Accent) => setAccentState(newAccent),
    }),
    [theme, accent]
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
