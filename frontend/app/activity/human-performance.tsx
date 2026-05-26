import { useEffect, useMemo, useState } from 'react';
import { Button, StyleSheet, View } from 'react-native';

import { createMotionLabController, MotionLabState } from '@/services/motionLabService';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function HumanPerformanceScreen() {
  const [motionState, setMotionState] = useState<MotionLabState>({
    acceleration: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    smoothnessScore: 100,
    breachCount: 0,
    isBreachActive: false,
    lastUpdateAt: Date.now(),
  });

  const controller = useMemo(() => createMotionLabController(setMotionState), []);

  useEffect(() => {
    controller.start();
    return () => {
      controller.stop();
    };
  }, [controller]);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Human Performance Lab
      </ThemedText>
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Movement smoothness</ThemedText>
        <ThemedText type="body">Score: {motionState.smoothnessScore.toFixed(0)} / 100</ThemedText>
        <ThemedText type="body">Breaches: {motionState.breachCount}</ThemedText>
        <ThemedText type="small">
          Accelerometer: x {motionState.acceleration.x.toFixed(2)} y {motionState.acceleration.y.toFixed(2)} z {motionState.acceleration.z.toFixed(2)}
        </ThemedText>
        <ThemedText type="small">
          Gyroscope: x {motionState.rotation.x.toFixed(2)} y {motionState.rotation.y.toFixed(2)} z {motionState.rotation.z.toFixed(2)}
        </ThemedText>
      </ThemedView>
      <View style={styles.buttonContainer}>
        <Button title="Reset" onPress={() => setMotionState({ ...motionState, breachCount: 0 })} />
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
    backgroundColor: '#20202E',
    gap: Spacing.two,
  },
  buttonContainer: {
    marginTop: Spacing.four,
    width: '100%',
  },
});
