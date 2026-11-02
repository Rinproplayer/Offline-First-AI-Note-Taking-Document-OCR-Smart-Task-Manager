export const colors = {
  // Canvas & Backgrounds (Dark Mode Slate)
  background: '#0F172A',
  surface: '#131B2E',
  surfaceLow: '#0B1326',
  surfaceContainer: '#171F33',
  surfaceContainerHigh: '#222A3D',
  surfaceContainerHighest: '#2D3449',
  surfaceBright: '#31394D',

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
  tertiary: '#10B981', // Emerald Green
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
  outline: '#334155',
  outlineVariant: '#1E293B',
  inverseSurface: '#F1F5F9',
  inverseOnSurface: '#0F172A'
};

export const typography = {
  headlineLg: { fontSize: 24, fontWeight: '700' as const, lineHeight: 32 },
  headlineMd: { fontSize: 20, fontWeight: '600' as const, lineHeight: 28 },
  headlineSm: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  bodyLg: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMd: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  bodySm: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  labelLg: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
  labelMd: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
  labelSm: { fontSize: 10, fontWeight: '700' as const, lineHeight: 14 }
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999
};
