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
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z';

export type ThemeFamily =
  | 'Material'
  | 'Keep'
  | 'Gemini'
  | 'Google Chat'
  | 'Workspace'
  | 'Google Blue'
  | 'Multi-color'
  | 'Minimal'
  | 'Messages'
  | 'Chrome Coral'
  | 'Android Mint'
  | 'Google Play'
  | 'Pixel Sunset'
  | 'YouTube Red'
  | 'Pixel Obsidian';

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

  // --- Chrome Coral ---
  {
    id: 'O',
    name: 'Google Chrome Coral Light',
    family: 'Chrome Coral',
    mode: 'light',
    description: 'Official Google Red 500 (#EA4335) accent with clean porcelain surfaces and vibrant coral bubbles.',
    closestProduct: 'Google Chrome / Coral Theme (Light)',
    pairedTheme: 'P',
    previewTokens: {
      background: '#FFFFFF',
      surface: '#FFFFFF',
      primary: '#EA4335',
      incoming: '#F1F3F4',
      outgoing: '#EA4335',
      outgoingText: '#FFFFFF',
      text: '#202124',
      border: '#FCE8E6',
    },
  },
  {
    id: 'P',
    name: 'Google Chrome Coral Dark',
    family: 'Chrome Coral',
    mode: 'dark',
    description: 'Deep #202124 canvas paired with official Google Red 300 (#F28B82) outgoing bubbles.',
    closestProduct: 'Google Chrome / Coral Theme (Dark)',
    pairedTheme: 'O',
    previewTokens: {
      background: '#202124',
      surface: '#292A2D',
      primary: '#F28B82',
      incoming: '#303134',
      outgoing: '#F28B82',
      outgoingText: '#202124',
      text: '#E8EAED',
      border: '#493838',
    },
  },

  // --- Android Mint & Drive ---
  {
    id: 'Q',
    name: 'Android Mint & Drive Light',
    family: 'Android Mint',
    mode: 'light',
    description: 'Official Google Green 700 (#188038) and Drive container tints with crisp modern contrast.',
    closestProduct: 'Android 14/15 Mint & Google Drive (Light)',
    pairedTheme: 'R',
    previewTokens: {
      background: '#F8FBF9',
      surface: '#FFFFFF',
      primary: '#188038',
      incoming: '#F1F3F4',
      outgoing: '#188038',
      outgoingText: '#FFFFFF',
      text: '#202124',
      border: '#CEEAD6',
    },
  },
  {
    id: 'R',
    name: 'Android Mint & Drive Dark',
    family: 'Android Mint',
    mode: 'dark',
    description: 'Subtle forest dark canvas (#191E1A) with Google Green 300 (#81C995) outgoing bubbles.',
    closestProduct: 'Android Mint / Drive (Dark)',
    pairedTheme: 'Q',
    previewTokens: {
      background: '#191E1A',
      surface: '#202622',
      primary: '#81C995',
      incoming: '#2B322D',
      outgoing: '#81C995',
      outgoingText: '#191E1A',
      text: '#E8EAED',
      border: '#36453B',
    },
  },

  // --- Google Play Teal ---
  {
    id: 'S',
    name: 'Google Play Teal Light',
    family: 'Google Play',
    mode: 'light',
    description: 'Google Cyan 700 (#00838F) and Play Store cyan accents with refreshing ocean tone.',
    closestProduct: 'Google Play Store / Teal (Light)',
    pairedTheme: 'T',
    previewTokens: {
      background: '#F4FAFB',
      surface: '#FFFFFF',
      primary: '#00838F',
      incoming: '#F1F3F4',
      outgoing: '#00838F',
      outgoingText: '#FFFFFF',
      text: '#202124',
      border: '#B2EBF2',
    },
  },
  {
    id: 'T',
    name: 'Google Play Teal Dark',
    family: 'Google Play',
    mode: 'dark',
    description: 'Deep oceanic dark (#131E20) paired with Google Cyan 300 (#4DD0E1) outgoing bubbles.',
    closestProduct: 'Google Play Store / Teal (Dark)',
    pairedTheme: 'S',
    previewTokens: {
      background: '#131E20',
      surface: '#1A282B',
      primary: '#4DD0E1',
      incoming: '#223336',
      outgoing: '#4DD0E1',
      outgoingText: '#131E20',
      text: '#E8EAED',
      border: '#2C464C',
    },
  },

  // --- Pixel Sunset Terracotta ---
  {
    id: 'U',
    name: 'Google Pixel Sunset Light',
    family: 'Pixel Sunset',
    mode: 'light',
    description: 'Official Pixel Orange 700 (#E8710A) and warm terracotta sunset tones from Material You.',
    closestProduct: 'Google Pixel 8/9 Sunset Coral (Light)',
    pairedTheme: 'V',
    previewTokens: {
      background: '#FDF9F7',
      surface: '#FFFFFF',
      primary: '#E8710A',
      incoming: '#F3EBE6',
      outgoing: '#E8710A',
      outgoingText: '#FFFFFF',
      text: '#202124',
      border: '#F6D6C8',
    },
  },
  {
    id: 'V',
    name: 'Google Pixel Sunset Dark',
    family: 'Pixel Sunset',
    mode: 'dark',
    description: 'Warm obsidian terracotta canvas (#211B18) with Pixel Sunset Coral 300 (#FFB59D) bubbles.',
    closestProduct: 'Google Pixel 8/9 Sunset Coral (Dark)',
    pairedTheme: 'U',
    previewTokens: {
      background: '#211B18',
      surface: '#2B231E',
      primary: '#FFB59D',
      incoming: '#332A24',
      outgoing: '#FFB59D',
      outgoingText: '#211B18',
      text: '#E8EAED',
      border: '#4C372D',
    },
  },

  // --- YouTube Red ---
  {
    id: 'W',
    name: 'YouTube Studio Red Light',
    family: 'YouTube Red',
    mode: 'light',
    description: 'Official YouTube Red (#CC0000) primary with clean white cards and high-contrast styling.',
    closestProduct: 'YouTube / YouTube Music (Light)',
    pairedTheme: 'X',
    previewTokens: {
      background: '#FFFFFF',
      surface: '#FFFFFF',
      primary: '#CC0000',
      incoming: '#F2F2F2',
      outgoing: '#CC0000',
      outgoingText: '#FFFFFF',
      text: '#0F0F0F',
      border: '#E5E5E5',
    },
  },
  {
    id: 'X',
    name: 'YouTube Studio Red Dark',
    family: 'YouTube Red',
    mode: 'dark',
    description: 'Official YouTube OLED dark canvas (#0F0F0F) with YouTube Red accent (#FF4E45) bubbles.',
    closestProduct: 'YouTube / YouTube Music (Dark)',
    pairedTheme: 'W',
    previewTokens: {
      background: '#0F0F0F',
      surface: '#1F1F1F',
      primary: '#FF4E45',
      incoming: '#272727',
      outgoing: '#FF4E45',
      outgoingText: '#0F0F0F',
      text: '#F1F1F1',
      border: '#383838',
    },
  },

  // --- Pixel Obsidian (True OLED Black) ---
  {
    id: 'Y',
    name: 'Pixel Porcelain Monochrome Light',
    family: 'Pixel Obsidian',
    mode: 'light',
    description: 'Ultra-minimal Pixel 9 Porcelain look with deep graphite (#1F1F1F) bubbles.',
    closestProduct: 'Google Pixel 9 Porcelain Edition (Light)',
    pairedTheme: 'Z',
    previewTokens: {
      background: '#F9F9FB',
      surface: '#FFFFFF',
      primary: '#1F1F1F',
      incoming: '#F1F3F4',
      outgoing: '#1F1F1F',
      outgoingText: '#FFFFFF',
      text: '#1F1F1F',
      border: '#E0E0E0',
    },
  },
  {
    id: 'Z',
    name: 'Pixel Obsidian True OLED Black',
    family: 'Pixel Obsidian',
    mode: 'dark',
    description: 'Pure 0% OLED Black (#000000) battery-saver canvas with Google Blue 300 (#8AB4F8) bubbles.',
    closestProduct: 'Google Pixel Obsidian AMOLED Edition (Dark)',
    pairedTheme: 'Y',
    previewTokens: {
      background: '#000000',
      surface: '#121214',
      primary: '#8AB4F8',
      incoming: '#1E1F24',
      outgoing: '#8AB4F8',
      outgoingText: '#000000',
      text: '#F0F4F9',
      border: '#2E3036',
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
      return { bg: '#00AC47', text: '#FFFFFF' };
    case 'I':
      return { bg: '#1A73E8', text: '#FFFFFF' };
    case 'J':
      return { bg: '#1A73E8', text: '#FFFFFF' };
    case 'K':
      return { bg: '#EA4335', text: '#FFFFFF' };
    case 'L':
      return { bg: '#5F6368', text: '#FFFFFF' };
    case 'O':
    case 'P':
      return { bg: '#EA4335', text: '#FFFFFF' };
    case 'Q':
    case 'R':
      return { bg: '#188038', text: '#FFFFFF' };
    case 'S':
    case 'T':
      return { bg: '#00838F', text: '#FFFFFF' };
    case 'U':
    case 'V':
      return { bg: '#E8710A', text: '#FFFFFF' };
    case 'W':
    case 'X':
      return { bg: '#CC0000', text: '#FFFFFF' };
    case 'Y':
      return { bg: '#1F1F1F', text: '#FFFFFF' };
    case 'Z':
      return { bg: '#8AB4F8', text: '#000000' };
    case 'M':
    case 'N':
    default:
      return { bg: '#0B57D0', text: '#FFFFFF' };
  }
};
