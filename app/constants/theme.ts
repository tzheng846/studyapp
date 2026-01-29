// StudyWme Design System Theme Constants
// Based on imported screen designs

export const COLORS = {
  // Timer screens (HomeScreen, ActiveSessionScreen)
  timer: {
    primary: '#1b4a4b',
    background: '#f6f5f3',
    textPrimary: '#1b4a4b',
    textSecondary: 'rgba(27, 74, 75, 0.6)',
    textMuted: 'rgba(27, 74, 75, 0.4)',
    textFaded: 'rgba(27, 74, 75, 0.1)',
    ringOuter: 'rgba(27, 74, 75, 0.05)',
    ringBackground: 'rgba(27, 74, 75, 0.1)',
  },

  // Social screens (JoinSession, Lobby, SessionReport)
  social: {
    primary: '#9cc9ba',
    background: '#f6f7f7',
    textPrimary: '#121715',
    textSecondary: '#658177',
    textMuted: '#4b5a54',
    cardBorder: '#d7e0dd',
    cardBorderLight: 'rgba(156, 201, 186, 0.3)',
    highlight: 'rgba(156, 201, 186, 0.1)',
    highlightBorder: 'rgba(156, 201, 186, 0.2)',
  },

  // Profile screen (AccountHistory)
  profile: {
    primary: '#4b809b',
    background: '#f7f7f8',
    textPrimary: '#121517',
    textSecondary: '#637883',
    cardBorder: 'rgba(214, 221, 224, 0.3)',
    iconBackground: 'rgba(75, 128, 155, 0.1)',
  },

  // Shared colors
  danger: '#ff5252',
  dangerLight: 'rgba(255, 82, 82, 0.1)',
  dangerBorder: 'rgba(255, 82, 82, 0.2)',
  white: '#ffffff',
  black: '#000000',
};

export const TYPOGRAPHY = {
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 22,
    '3xl': 24,
    '4xl': 28,
    '5xl': 30,
    '6xl': 36,
    '7xl': 48,
    '8xl': 64,
    '9xl': 72,
    '10xl': 96,
  },
  weights: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
  letterSpacing: {
    tight: -2,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
    superwide: 3,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const SHADOWS = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  button: {
    shadowColor: '#1b4a4b',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 8,
  },
  greenButton: {
    shadowColor: '#9cc9ba',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
};

export const ICON_SIZES = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  '2xl': 32,
};
