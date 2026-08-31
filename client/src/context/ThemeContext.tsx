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

export type MessageFontColor = 'theme' | 'black' | 'white';

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
  messageFontSize: number;
  setMessageFontSize: (size: number) => void;
  messageFontColor: MessageFontColor;
  setMessageFontColor: (color: MessageFontColor) => void;
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

const getInitialMessageFontSize = (): number => {
  const saved = localStorage.getItem('message-font-size');
  if (saved) {
    const parsed = Number(saved);
    if (!isNaN(parsed) && parsed >= 12 && parsed <= 24) {
      return parsed;
    }
  }
  return 16; // default 16px
};

const getInitialMessageFontColor = (): MessageFontColor => {
  const saved = localStorage.getItem('message-font-color') as MessageFontColor | null;
  if (saved === 'black' || saved === 'white' || saved === 'theme') {
    return saved;
  }
  return 'theme';
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [themeId, setThemeIdState] = useState<ThemeId>(getInitialThemeId);
  const [glassTheme, setGlassTheme] = useState<GlassTheme>(getInitialGlassTheme);
  const [messageFontSize, setMessageFontSizeState] = useState<number>(getInitialMessageFontSize);
  const [messageFontColor, setMessageFontColorState] = useState<MessageFontColor>(getInitialMessageFontColor);

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

  // Apply message font size to document root CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--message-font-size', `${messageFontSize}px`);
    localStorage.setItem('message-font-size', String(messageFontSize));
  }, [messageFontSize]);

  // Apply message font color to document root attribute & CSS variable
  useEffect(() => {
    document.documentElement.setAttribute('data-font-color', messageFontColor);
    if (messageFontColor === 'black') {
      document.documentElement.style.setProperty('--message-custom-color', '#000000');
    } else if (messageFontColor === 'white') {
      document.documentElement.style.setProperty('--message-custom-color', '#FFFFFF');
    } else {
      document.documentElement.style.removeProperty('--message-custom-color');
    }
    localStorage.setItem('message-font-color', messageFontColor);
  }, [messageFontColor]);

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id);
  }, []);

  const setMessageFontSize = useCallback((size: number) => {
    const clamped = Math.min(24, Math.max(12, size));
    setMessageFontSizeState(clamped);
  }, []);

  const setMessageFontColor = useCallback((color: MessageFontColor) => {
    setMessageFontColorState(color);
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
      accent: themeId,
      setAccent: (accentVal: string) => {
        // 1. Match by theme ID (e.g. 'A', 'B', 'C', 'D', etc.)
        const matchById = THEMES.find((t) => t.id.toLowerCase() === accentVal.toLowerCase());
        if (matchById) {
          setThemeIdState(matchById.id);
          return;
        }
        // 2. Match by primary or outgoing hex color
        const match = THEMES.find(
          (t) =>
            t.previewTokens.primary.toLowerCase() === accentVal.toLowerCase() ||
            t.previewTokens.outgoing.toLowerCase() === accentVal.toLowerCase()
        );
        if (match) {
          setThemeIdState(match.id);
        }
      },
      glassTheme,
      toggleGlassTheme,
      messageFontSize,
      setMessageFontSize,
      messageFontColor,
      setMessageFontColor,
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
      messageFontSize,
      setMessageFontSize,
      messageFontColor,
      setMessageFontColor,
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
