import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Layout, Radii, SpacingScale, getShadowStyle } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface SessionTimerProps {
  elapsedSec: number;
  maxSec?: number;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  label?: string;
}

export function SessionTimer({
  elapsedSec,
  maxSec,
  isRunning,
  onStart,
  onStop,
  onReset,
  label = 'Session time',
}: SessionTimerProps) {
  const theme = useTheme();

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const overLimit = maxSec !== undefined && elapsedSec >= maxSec;

  return (
    <ThemedView
      style={[
        styles.container,
        {
          borderColor: theme.border,
          backgroundColor: theme.surface,
          ...getShadowStyle('sm', theme.shadow),
        },
      ]}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="title" style={{ color: overLimit ? theme.danger : theme.textPrimary }}>
        {formatTime(elapsedSec)}
        {maxSec !== undefined && (
          <ThemedText type="small" themeColor="textSecondary">
            {' '}
            / {formatTime(maxSec)}
          </ThemedText>
        )}
      </ThemedText>
      <View style={styles.buttonRow}>
        {!isRunning ? (
          <AppButton label="Start" onPress={onStart} fullWidth={false} />
        ) : (
          <AppButton label="Stop" onPress={onStop} fullWidth={false} />
        )}
        <AppButton label="Reset" onPress={onReset} variant="outline" fullWidth={false} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Layout.cardPadding,
    borderRadius: Radii.xl,
    borderWidth: 1,
    gap: SpacingScale.sm,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SpacingScale.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});
