import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import {
  Layout,
  Radii,
  Shadows,
  SpacingScale,
  ThemeMode,
  getShadowStyle,
} from '@/constants/theme';
import { useThemeContext } from '@/components/ThemeContext';
import { useTheme } from '@/hooks/use-theme';

export function useUiStyles() {
  const theme = useTheme();
  const { mode } = useThemeContext();

  return useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: theme.background,
        },
        screenContent: {
          paddingHorizontal: Layout.screenPadding,
          paddingTop: SpacingScale.xl,
          paddingBottom: SpacingScale.huge,
          gap: Layout.sectionGap,
        },
        card: {
          backgroundColor: theme.surface,
          borderRadius: Radii.xl,
          borderWidth: 1,
          borderColor: theme.border,
          padding: Layout.cardPadding,
          gap: SpacingScale.sm,
          ...getShadowStyle('card', theme.shadow),
        },
        cardFlat: {
          backgroundColor: theme.surface,
          borderRadius: Radii.lg,
          borderWidth: 1,
          borderColor: theme.border,
          padding: Layout.cardPadding,
          gap: SpacingScale.sm,
        },
        input: {
          minHeight: Layout.inputHeight,
          borderWidth: 1,
          borderRadius: Radii.md,
          borderColor: theme.border,
          backgroundColor: theme.backgroundSelected,
          color: theme.textPrimary,
          paddingHorizontal: SpacingScale.md,
          paddingVertical: SpacingScale.sm,
          fontSize: 16,
          lineHeight: 24,
        },
        inputMultiline: {
          minHeight: 96,
          textAlignVertical: 'top',
          paddingTop: SpacingScale.sm,
        },
        chip: {
          paddingVertical: SpacingScale.xs,
          paddingHorizontal: SpacingScale.md,
          borderRadius: Radii.pill,
          borderWidth: 1,
          borderColor: theme.border,
          minHeight: Layout.buttonHeightSm,
          justifyContent: 'center',
        },
        chipActive: {
          backgroundColor: theme.accent,
          borderColor: theme.accent,
        },
        divider: {
          height: 1,
          backgroundColor: theme.border,
        },
        progressTrack: {
          height: 8,
          borderRadius: Radii.pill,
          backgroundColor: theme.backgroundSelected,
          overflow: 'hidden',
        },
        progressFill: {
          height: '100%',
          borderRadius: Radii.pill,
          backgroundColor: theme.accent,
        },
        onAccentText: {
          color: theme.onAccent,
        },
      }),
    [theme, mode],
  );
}

export { Shadows, SpacingScale, Radii, Layout };
