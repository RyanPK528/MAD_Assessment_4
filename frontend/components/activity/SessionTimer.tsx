import { useEffect, useRef } from 'react';
import { Button, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const overLimit = maxSec !== undefined && elapsedSec >= maxSec;

  return (
    <ThemedView style={[styles.container, { borderColor: theme.border, backgroundColor: theme.surface }]}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <ThemedText type="title" style={{ color: overLimit ? theme.danger : theme.textPrimary }}>
        {formatTime(elapsedSec)}
        {maxSec !== undefined && (
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            {' '}
            / {formatTime(maxSec)}
          </ThemedText>
        )}
      </ThemedText>
      <View style={styles.buttonRow}>
        {!isRunning ? (
          <Button title="Start" onPress={onStart} />
        ) : (
          <Button title="Stop" onPress={onStop} />
        )}
        <Button title="Reset" onPress={onReset} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.two,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
});
