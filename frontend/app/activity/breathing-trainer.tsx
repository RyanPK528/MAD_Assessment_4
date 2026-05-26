import { useEffect, useMemo, useState } from 'react';
import { Button, StyleSheet, View } from 'react-native';

import { createBreathingTrainerController, BreathingTrainerState } from '@/services/breathingTrainerService';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function BreathingTrainerScreen() {
  const [state, setState] = useState<BreathingTrainerState>({
    phase: 'Resting',
    secondsElapsed: 0,
    breathsPerMinute: 0,
    breathCount: 0,
    message: 'Preparing the breathing trainer.',
    isActive: false,
  });

  const controller = useMemo(() => createBreathingTrainerController(setState), []);

  useEffect(() => {
    controller.start();
    return () => controller.stop();
  }, [controller]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Breathing Pace Trainer
      </ThemedText>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Phase</ThemedText>
        <ThemedText type="body">{state.phase}</ThemedText>
        <ThemedText type="body">Time elapsed: {state.secondsElapsed}s</ThemedText>
        <ThemedText type="body">Breaths per minute: {state.breathsPerMinute}</ThemedText>
        <ThemedText type="small">{state.message}</ThemedText>
      </ThemedView>
      <View style={styles.buttonRow}>
        <Button title="Restart Session" onPress={() => controller.start()} />
        <Button title="Stop" onPress={() => controller.stop()} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    marginBottom: Spacing.three,
  },
  card: {
    width: '100%',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    backgroundColor: '#1E2238',
    gap: Spacing.two,
  },
  buttonRow: {
    width: '100%',
    gap: Spacing.three,
  },
});
