import { StyleSheet } from 'react-native';

import { Layout, Radii, SpacingScale, getShadowStyle } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function useActivityStyles() {
  const theme = useTheme();

  return StyleSheet.create({
    section: {
      width: '100%',
      padding: Layout.cardPadding,
      borderRadius: Radii.xl,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      gap: SpacingScale.sm,
      marginBottom: SpacingScale.md,
      ...getShadowStyle('sm', theme.shadow),
    },
    sectionTitle: {
      marginTop: SpacingScale.sm,
    },
    instructionImage: {
      width: '100%',
      height: 200,
      marginVertical: SpacingScale.xs,
      borderRadius: Radii.md,
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
    },
    multiline: {
      minHeight: 96,
      textAlignVertical: 'top',
    },
    chip: {
      paddingVertical: SpacingScale.xs,
      paddingHorizontal: SpacingScale.md,
      borderRadius: Radii.pill,
      borderWidth: 1,
      borderColor: theme.border,
    },
    chipActive: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
    },
    emptyText: {
      color: theme.textSecondary,
    },
  });
}
