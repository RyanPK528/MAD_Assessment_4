import { ActivityIndicator, Pressable, StyleSheet, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Layout, Radii, SpacingScale } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'success';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
  accessibilityLabel,
  style,
}: AppButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;

  const backgroundColor = (() => {
    if (isDisabled) return theme.backgroundSelected;
    switch (variant) {
      case 'secondary':
        return theme.backgroundSelected;
      case 'outline':
        return 'transparent';
      case 'danger':
        return theme.danger;
      case 'success':
        return theme.success;
      default:
        return theme.accent;
    }
  })();

  const textColor = (() => {
    if (isDisabled) return theme.textSecondary;
    if (variant === 'outline' || variant === 'secondary') return theme.textPrimary;
    return theme.onAccent;
  })();

  const borderColor =
    variant === 'outline' ? (isDisabled ? theme.border : theme.accent) : backgroundColor;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        fullWidth && styles.fullWidth,
        {
          backgroundColor,
          borderColor,
          opacity: pressed && !isDisabled ? 0.88 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <ThemedText type="button" style={{ color: textColor }}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: Layout.buttonHeight,
    borderRadius: Radii.md,
    borderWidth: 1,
    paddingHorizontal: SpacingScale.xl,
    paddingVertical: SpacingScale.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
});
