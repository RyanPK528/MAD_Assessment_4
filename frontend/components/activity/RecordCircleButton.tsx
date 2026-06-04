import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { getShadowStyle, SpacingScale } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const BUTTON_SIZE = 200;

interface RecordCircleButtonProps {
  onPress?: () => void;
  disabled?: boolean;
  recording?: boolean;
  label?: string;
}

export function RecordCircleButton({
  onPress,
  disabled = false,
  recording = false,
  label,
}: RecordCircleButtonProps) {
  const theme = useTheme();
  const displayLabel = label ?? (recording ? 'Recording…' : 'Start');
  const useMutedStyle = recording && !label;

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.button,
          getShadowStyle('card', theme.shadow),
          {
            backgroundColor: useMutedStyle ? theme.accentMuted : theme.accent,
            opacity: disabled ? 0.65 : pressed ? 0.9 : 1,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={label ?? (recording ? 'Recording in progress' : 'Start recording')}
      >
        <ThemedText
          style={[
            styles.label,
            { color: useMutedStyle ? theme.accent : theme.onAccent },
          ]}
        >
          {displayLabel}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    marginTop: SpacingScale.sm,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SpacingScale.sm,
  },
  label: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '700',
    textAlign: 'center',
  },
});
