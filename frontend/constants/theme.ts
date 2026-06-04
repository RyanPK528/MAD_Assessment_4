/**
 * STEMM Lab design system — single source of truth for all visual styling.
 */

import '@/global.css';

import { Platform, TextStyle, ViewStyle } from 'react-native';

export const ColorTokens = {
  light: {
    text: '#161B23',
    textPrimary: '#161B23',
    textSecondary: '#60646C',
    background: '#F6F7FB',
    backgroundElement: '#FFFFFF',
    surface: '#FFFFFF',
    backgroundSelected: '#E9EAF2',
    border: '#E6E8EE',
    accent: '#3E78FF',
    accentMuted: '#E8F0FF',
    success: '#15B397',
    successMuted: '#E6F7F0',
    danger: '#D9465F',
    dangerMuted: '#FDE8EC',
    warning: '#D97706',
    muted: '#8E8E99',
    onAccent: '#FFFFFF',
    onPrimary: '#FFFFFF',
    shadow: 'rgba(20, 21, 33, 0.08)',
    overlay: 'rgba(20, 21, 33, 0.45)',
  },
  dark: {
    text: '#F8F9FB',
    textPrimary: '#F8F9FB',
    textSecondary: '#B0B4BA',
    background: '#0B0D12',
    backgroundElement: '#12151F',
    surface: '#181C27',
    backgroundSelected: '#1F2332',
    border: '#1D222F',
    accent: '#6CA0FF',
    accentMuted: '#1A2744',
    success: '#4ADE80',
    successMuted: '#1A2F28',
    danger: '#F97316',
    dangerMuted: '#3D2010',
    warning: '#FBBF24',
    muted: '#8E8E99',
    onAccent: '#FFFFFF',
    onPrimary: '#FFFFFF',
    shadow: 'rgba(0, 0, 0, 0.45)',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
} as const;

export const Colors = ColorTokens;

export type ThemeColor = keyof typeof ColorTokens.light & keyof typeof ColorTokens.dark;
export type ThemeMode = keyof typeof ColorTokens;

/** Recommended spacing scale: 4 → 48 */
export const SpacingScale = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
} as const;

/** Legacy aliases — prefer SpacingScale for new code */
export const Spacing = {
  half: 2,
  one: SpacingScale.xxs,
  two: SpacingScale.xs,
  three: SpacingScale.md,
  four: SpacingScale.xl,
  five: SpacingScale.xxl,
  six: 64,
  sm: SpacingScale.sm,
  lg: SpacingScale.lg,
  xxl: SpacingScale.xxxl,
  huge: SpacingScale.huge,
} as const;

export const Typography = {
  display: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
  pageTitle: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  sectionTitle: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
  cardTitle: { fontSize: 17, lineHeight: 24, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyMedium: { fontSize: 16, lineHeight: 24, fontWeight: '500' as const },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  captionBold: { fontSize: 14, lineHeight: 20, fontWeight: '700' as const },
  metadata: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  stat: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const },
  button: { fontSize: 16, lineHeight: 24, fontWeight: '700' as const },
  link: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
  code: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
} as const;

export type TypographyVariant = keyof typeof Typography;

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const ThemeTokens = {
  borderRadius: Radii.lg,
  cardRadius: Radii.xl,
  screenPadding: SpacingScale.xl,
  spacer: SpacingScale.md,
  shadowOffset: { width: 0, height: 4 },
} as const;

export const Layout = {
  touchTargetMin: 44,
  buttonHeight: 48,
  buttonHeightSm: 40,
  inputHeight: 48,
  screenPadding: SpacingScale.xl,
  cardPadding: SpacingScale.md,
  sectionGap: SpacingScale.xl,
  maxContentWidth: 800,
} as const;

export const Shadows = {
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  card: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  elevated: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  banner: {
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

export type ShadowVariant = keyof typeof Shadows;

export const Animation = {
  fast: 150,
  normal: 250,
  slow: 350,
} as const;

export type ActivityCategoryName = 'Engineering' | 'Health & Medical';

export const CategoryBadgeColors: Record<
  ActivityCategoryName,
  Record<ThemeMode, { background: string; border: string; text: string }>
> = {
  Engineering: {
    light: { background: '#E8F0FF', border: '#C5D9FF', text: '#1E4DB7' },
    dark: { background: '#1A2744', border: '#2F4775', text: '#9EC5FF' },
  },
  'Health & Medical': {
    light: { background: '#E8F7F0', border: '#B8E6D4', text: '#0F6B52' },
    dark: { background: '#1A2F28', border: '#2F5A4A', text: '#7EE3B8' },
  },
};

export function getCategoryBadgeColors(category: ActivityCategoryName, mode: ThemeMode) {
  return CategoryBadgeColors[category][mode];
}

export function getShadowStyle(variant: ShadowVariant, shadowColor: string): ViewStyle {
  const shadow = Shadows[variant];
  return {
    shadowColor,
    shadowOffset: shadow.shadowOffset,
    shadowOpacity: shadow.shadowOpacity,
    shadowRadius: shadow.shadowRadius,
    elevation: shadow.elevation,
  };
}

export function getTypographyStyle(variant: TypographyVariant): TextStyle {
  return Typography[variant];
}

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = Layout.maxContentWidth;
