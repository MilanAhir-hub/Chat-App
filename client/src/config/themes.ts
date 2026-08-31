export type ThemeId =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N';

export type ThemeFamily =
  | 'Material'
  | 'Keep'
  | 'Gemini'
  | 'Google Chat'
  | 'Workspace'
  | 'Google Blue'
  | 'Multi-color'
  | 'Minimal'
  | 'Messages';

export interface ThemeMetadata {
  id: ThemeId;
  name: string;
  family: ThemeFamily;
  mode: 'light' | 'dark';
  description: string;
  closestProduct: string;
  pairedTheme: ThemeId;
  badge?: string;
  previewTokens: {
    background: string;
    surface: string;
    primary: string;
    incoming: string;
    outgoing: string;
    outgoingText: string;
    text: string;
    border: string;
  };
}

export const THEMES: ThemeMetadata[] = [
  // --- Material 3 ---
  {
    id: 'A',
    name: 'Google Material Light',
    family: 'Material',
    mode: 'light',
    description: 'Soft, lavender-tinted neutrals with a purple primary — exact published Material 3 baseline.',
    closestProduct: 'Material 3 Reference / Material You default',
    pairedTheme: 'B',
    previewTokens: {
      background: '#FEF7FF',
      surface: '#FFFFFF',
      primary: '#6750A4',
      incoming: '#E6E0E9',
      outgoing: '#EADDFF',
      outgoingText: '#21005D',
      text: '#1D1B20',
      border: '#CAC4D0',
    },
  },
  {
    id: 'B',
    name: 'Google Material Dark',
    family: 'Material',
    mode: 'dark',
    description: 'True M3 dark — near-black #141218 with tonal elevation containers.',
    closestProduct: 'Material 3 Reference Dark',
    pairedTheme: 'A',
    previewTokens: {
      background: '#141218',
      surface: '#211F26',
      primary: '#D0BCFF',
      incoming: '#2B2930',
      outgoing: '#4F378B',
      outgoingText: '#EADDFF',
      text: '#E6E0E9',
      border: '#49454F',
    },
  },

  // --- Google Keep ---
  {
    id: 'C',
    name: 'Google Keep-inspired Light',
    family: 'Keep',
    mode: 'light',
    description: 'White canvas with warm yellow note-tinted outgoing bubbles and selections.',
    closestProduct: 'Google Keep (Light)',
    pairedTheme: 'D',
    previewTokens: {
      background: '#FFFFFF',
      surface: '#FFFFFF',
      primary: '#1A73E8',
      incoming: '#F1F3F4',
      outgoing: '#FEF7E0',
      outgoingText: '#202124',
      text: '#202124',
      border: '#DADCE0',
    },
  },
  {
    id: 'D',
    name: 'Google Keep-inspired Dark',
    family: 'Keep',
    mode: 'dark',
    description: 'Classic Google dark base with bold Keep yellow outgoing bubbles and accents.',
    closestProduct: 'Google Keep (Dark)',
    pairedTheme: 'C',
    previewTokens: {
      background: '#202124',
      surface: '#292A2D',
      primary: '#8AB4F8',
      incoming: '#292A2D',
      outgoing: '#F9AB00',
      outgoingText: '#202124',
      text: '#E8EAED',
      border: '#3C4043',
    },
  },

  // --- Gemini ---
  {
    id: 'E',
    name: 'Gemini-inspired Light',
    family: 'Gemini',
    mode: 'light',
    description: 'Modern 2024 Google refresh; crisp white surfaces on a soft #F0F4F9 conversation backdrop.',
    closestProduct: 'Gemini Web (Light)',
    pairedTheme: 'F',
    previewTokens: {
      background: '#F0F4F9',
      surface: '#FFFFFF',
      primary: '#0B57D0',
      incoming: '#FFFFFF',
      outgoing: '#D3E3FD',
      outgoingText: '#1F1F1F',
      text: '#1F1F1F',
      border: '#DADCE0',
    },
  },
  {
    id: 'F',
    name: 'Gemini-inspired Dark',
    family: 'Gemini',
    mode: 'dark',
    description: '2024 AI-product dark with #131314 base, 4-step tonal ramp and soft blue submit.',
    closestProduct: 'Gemini Web (Dark)',
    pairedTheme: 'E',
    previewTokens: {
      background: '#131314',
      surface: '#1E1F20',
      primary: '#A8C7FA',
      incoming: '#282A2C',
      outgoing: '#333537',
      outgoingText: '#E3E3E3',
      text: '#E3E3E3',
      border: '#3C4043',
    },
  },

  // --- Google Chat ---
  {
    id: 'G',
    name: 'Google Chat-inspired Light',
    family: 'Google Chat',
    mode: 'light',
    description: 'Clean workspace aesthetic with Google Blue and Chat Green team accents.',
    closestProduct: 'Google Chat (Light)',
    pairedTheme: 'H',
    previewTokens: {
      background: '#FFFFFF',
      surface: '#FFFFFF',
      primary: '#1A73E8',
      incoming: '#F1F3F4',
      outgoing: '#D2E3FC',
      outgoingText: '#202124',
      text: '#202124',
      border: '#DADCE0',
    },
  },
  {
    id: 'H',
    name: 'Google Chat-inspired Dark',
    family: 'Google Chat',
    mode: 'dark',
    description: 'Classic Workspace dark (#202124) with blue 300 accents and deep-blue outgoing bubbles.',
    closestProduct: 'Google Chat / Gmail (Dark)',
    pairedTheme: 'G',
    previewTokens: {
      background: '#202124',
      surface: '#292A2D',
      primary: '#8AB4F8',
      incoming: '#292A2D',
      outgoing: '#174EA6',
      outgoingText: '#D2E3FC',
      text: '#E8EAED',
      border: '#5F6368',
    },
  },

  // --- Workspace ---
  {
    id: 'I',
    name: 'Neutral Google Workspace Light',
    family: 'Workspace',
    mode: 'light',
    description: 'Gmail-like grey-50 canvas with white cards; restrained and content-focused.',
    closestProduct: 'Gmail / Drive (Light)',
    pairedTheme: 'H',
    previewTokens: {
      background: '#F8F9FA',
      surface: '#FFFFFF',
      primary: '#1A73E8',
      incoming: '#F1F3F4',
      outgoing: '#D2E3FC',
      outgoingText: '#202124',
      text: '#202124',
      border: '#DADCE0',
    },
  },

  // --- Google Blue ---
  {
    id: 'J',
    name: 'Blue-focused Google Light',
    family: 'Google Blue',
    mode: 'light',
    description: 'Organized around classic Google Blue with solid #1A73E8 outgoing message bubbles.',
    closestProduct: 'Google Messages (Classic)',
    pairedTheme: 'N',
    previewTokens: {
      background: '#FFFFFF',
      surface: '#FFFFFF',
      primary: '#1A73E8',
      incoming: '#F1F3F4',
      outgoing: '#1A73E8',
      outgoingText: '#FFFFFF',
      text: '#202124',
      border: '#DADCE0',
    },
  },

  // --- Multi-color ---
  {
    id: 'K',
    name: 'Multi-color Google Light',
    family: 'Multi-color',
    mode: 'light',
    description: 'Google four-brand-color scheme with playful accents, avatar palettes and label tints.',
    closestProduct: 'Google Brand System + Gmail Labels',
    pairedTheme: 'H',
    previewTokens: {
      background: '#FFFFFF',
      surface: '#FFFFFF',
      primary: '#1A73E8',
      incoming: '#F1F3F4',
      outgoing: '#D2E3FC',
      outgoingText: '#202124',
      text: '#202124',
      border: '#DADCE0',
    },
  },

  // --- Minimal ---
  {
    id: 'L',
    name: 'Minimal monochrome Google Light',
    family: 'Minimal',
    mode: 'light',
    description: 'Pure white and grey with a single blue accent — Google Search austerity with grey bubbles.',
    closestProduct: 'Google Search',
    pairedTheme: 'B',
    previewTokens: {
      background: '#FFFFFF',
      surface: '#FFFFFF',
      primary: '#1A73E8',
      incoming: '#FFFFFF',
      outgoing: '#E8EAED',
      outgoingText: '#202124',
      text: '#202124',
      border: '#DADCE0',
    },
  },

  // --- Messages ---
  {
    id: 'M',
    name: 'Google Messages-inspired Light',
    family: 'Messages',
    mode: 'light',
    description: 'The 2024 Google refresh look: #0B57D0 primary, #D3E3FD containers, solid blue outgoing bubbles.',
    closestProduct: 'Google Messages (2024 Refresh)',
    pairedTheme: 'N',
    badge: 'Default',
    previewTokens: {
      background: '#FFFFFF',
      surface: '#FFFFFF',
      primary: '#0B57D0',
      incoming: '#F1F3F4',
      outgoing: '#0B57D0',
      outgoingText: '#FFFFFF',
      text: '#1F1F1F',
      border: '#DADCE0',
    },
  },
  {
    id: 'N',
    name: 'Google Messages-inspired Dark',
    family: 'Messages',
    mode: 'dark',
    description: 'Classic Google dark base with vibrant blue 300 outgoing bubbles and dark text.',
    closestProduct: 'Google Messages (Dark)',
    pairedTheme: 'M',
    previewTokens: {
      background: '#202124',
      surface: '#202124',
      primary: '#8AB4F8',
      incoming: '#303134',
      outgoing: '#8AB4F8',
      outgoingText: '#202124',
      text: '#E8EAED',
      border: '#3C4043',
    },
  },
];

export const DEFAULT_THEME_ID: ThemeId = 'M';

export const getThemeById = (id: string): ThemeMetadata => {
  const found = THEMES.find((t) => t.id === id);
  return found || THEMES.find((t) => t.id === DEFAULT_THEME_ID)!;
};

export const getThemePureColor = (themeId: ThemeId): { bg: string; text: string } => {
  switch (themeId) {
    case 'A':
    case 'B':
      return { bg: '#6750A4', text: '#FFFFFF' };
    case 'C':
    case 'D':
      return { bg: '#F9AB00', text: '#202124' };
    case 'E':
    case 'F':
      return { bg: '#0B57D0', text: '#FFFFFF' };
    case 'G':
    case 'H':
      return { bg: '#1A73E8', text: '#FFFFFF' };
    case 'I':
      return { bg: '#1A73E8', text: '#FFFFFF' };
    case 'J':
      return { bg: '#1A73E8', text: '#FFFFFF' };
    case 'K':
      return { bg: '#4285F4', text: '#FFFFFF' };
    case 'L':
      return { bg: '#1A73E8', text: '#FFFFFF' };
    case 'M':
    case 'N':
    default:
      return { bg: '#0B57D0', text: '#FFFFFF' };
  }
};
