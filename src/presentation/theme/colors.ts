export interface ThemeColors {
  // Canvas & Backgrounds
  background: string;
  surface: string;
  surfaceLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceBright: string;

  // Brand Accents
  primary: string;
  primaryContainer: string;
  primaryFixed: string;
  onPrimary: string;
  onPrimaryContainer: string;

  // Secondary Accents
  secondary: string;
  secondaryContainer: string;
  secondaryFixed: string;
  onSecondary: string;

  // Tertiary Accents
  tertiary: string;
  tertiaryContainer: string;
  tertiaryFixed: string;
  onTertiary: string;

  // Alert & Warning
  error: string;
  errorContainer: string;
  onError: string;
  warning: string;

  // Typography & Outlines
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  inverseSurface: string;
  inverseOnSurface: string;
}

export const darkColors: ThemeColors = {
  // Canvas & Backgrounds (Minimalist Deep Dark & Flat Slate Cards)
  background: '#0B0F17',
  surface: '#161C28',
  surfaceLow: '#070A10',
  surfaceContainer: '#161C28',
  surfaceContainerHigh: '#1E2638',
  surfaceContainerHighest: '#273147',
  surfaceBright: '#303C54',

  // Brand Accents
  primary: '#6366F1', // Electric Indigo
  primaryContainer: '#4338CA',
  primaryFixed: '#E0E7FF',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#EEF2FF',

  // Secondary Accents (OCR & Digital conversion)
  secondary: '#38BDF8', // Sky Blue
  secondaryContainer: '#0284C7',
  secondaryFixed: '#E0F2FE',
  onSecondary: '#00283A',

  // Tertiary Accents (Offline-Ready & Success)
  tertiary: '#10B981', // Emerald Green (#10B981)
  tertiaryContainer: '#047857',
  tertiaryFixed: '#D1FAE5',
  onTertiary: '#003824',

  // Alert & Warning
  error: '#EF4444',
  errorContainer: '#991B1B',
  onError: '#FFFFFF',
  warning: '#F59E0B',

  // Typography & Outlines
  onSurface: '#F8FAFC',
  onSurfaceVariant: '#94A3B8',
  outline: '#2A364F',
  outlineVariant: '#222B3D',
  inverseSurface: '#F1F5F9',
  inverseOnSurface: '#0B0F17'
};

export const lightColors: ThemeColors = {
  // Canvas & Backgrounds (Minimalist Apple Light & Pure Crisp Cards)
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceLow: '#F1F5F9',
  surfaceContainer: '#FFFFFF',
  surfaceContainerHigh: '#F8FAFC',
  surfaceContainerHighest: '#E2E8F0',
  surfaceBright: '#FFFFFF',

  // Brand Accents
  primary: '#4F46E5', // Indigo
  primaryContainer: '#EEF2FF',
  primaryFixed: '#312E81',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#312E81',

  // Secondary Accents
  secondary: '#0284C7', // Sky Blue
  secondaryContainer: '#E0F2FE',
  secondaryFixed: '#0369A1',
  onSecondary: '#FFFFFF',

  // Tertiary Accents
  tertiary: '#10B981', // Emerald Green
  tertiaryContainer: '#D1FAE5',
  tertiaryFixed: '#065F46',
  onTertiary: '#FFFFFF',

  // Alert & Warning
  error: '#EF4444',
  errorContainer: '#FEE2E2',
  onError: '#FFFFFF',
  warning: '#F59E0B',

  // Typography & Outlines
  onSurface: '#0F172A', // Deep Slate
  onSurfaceVariant: '#64748B', // Medium Slate
  outline: '#CBD5E1',
  outlineVariant: '#E2E8F0',
  inverseSurface: '#0B0F17',
  inverseOnSurface: '#F8FAFC'
};

// Default export for backwards compatibility
export const colors = darkColors;

export const typography = {
  headlineLg: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  headlineMd: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  headlineSm: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  titleLarge: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  titleMedium: { fontSize: 16, fontWeight: '600' as const, lineHeight: 24 },
  titleSmall: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  bodyLg: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMd: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySm: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  bodyLarge: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMedium: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySmall: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  labelLg: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  labelMd: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
  labelSm: { fontSize: 10, fontWeight: '700' as const, lineHeight: 14 },
  labelLarge: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  labelMedium: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
  labelSmall: { fontSize: 10, fontWeight: '700' as const, lineHeight: 14 }
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999
};
