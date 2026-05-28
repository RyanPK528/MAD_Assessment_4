/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

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
    success: '#15B397',
    danger: '#D9465F',
    muted: '#8E8E99',
    shadow: 'rgba(20, 21, 33, 0.08)',
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
    success: '#4ADE80',
    danger: '#F97316',
    muted: '#8E8E99',
    shadow: 'rgba(0, 0, 0, 0.45)',
  },
} as const;

export const Colors = ColorTokens;

export type ThemeColor = keyof typeof ColorTokens.light & keyof typeof ColorTokens.dark;
export type ThemeMode = keyof typeof ColorTokens;

export const ThemeTokens = {
  borderRadius: 18,
  cardRadius: 20,
  screenPadding: 24,
  spacer: 16,
  shadowOffset: { width: 0, height: 12 },
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
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

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
