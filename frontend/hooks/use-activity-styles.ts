import { StyleSheet } from 'react-native';

import { ThemeTokens, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function useActivityStyles() {
  const theme = useTheme();

  return StyleSheet.create({
    section: {
      width: '100%',
      padding: Spacing.four,
      borderRadius: ThemeTokens.cardRadius,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      gap: Spacing.two,
      marginBottom: Spacing.three,
    },
    sectionTitle: {
      marginTop: Spacing.two,
    },
    input: {
      borderWidth: 1,
      borderRadius: ThemeTokens.borderRadius,
      borderColor: theme.border,
      backgroundColor: theme.backgroundSelected,
      color: theme.textPrimary,
      padding: Spacing.three,
    },
    multiline: {
      minHeight: 96,
      textAlignVertical: 'top',
    },
    chip: {
      paddingVertical: Spacing.two,
      paddingHorizontal: Spacing.three,
      borderRadius: 999,
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
