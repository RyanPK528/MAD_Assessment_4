import { useEffect, useMemo, useState } from 'react';
import { Button, StyleSheet, View } from 'react-native';

import {
  createParachuteDropController,
  ParachuteDropState,
} from '@/services/parachuteService';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const INITIAL_STATE: ParachuteDropState = {
  phase: 'idle',
  pressureHpa: 1013.25,
  relativeAltitudeM: 0,
  peakAltitudeM: 0,
  descentSpeedMs: 0,
  score: 100,
  descentSeconds: 0,
  message: 'Place device flat. Press Start to calibrate baseline pressure.',
};

/** Colour-codes the score 0-100 */
const scoreColor = (score: number): string => {
  if (score >= 75) return '#22C55E';
  if (score >= 45) return '#F59E0B';
  return '#EF4444';
};

const phaseLabel: Record<ParachuteDropState['phase'], string> = {
  idle: 'Ready',
  calibrating: 'Calibrating…',
  armed: 'Armed',
  dropping: 'Descending',
  landed: 'Landed',
  complete: 'Complete ✓',
};

export default function ParachuteDropScreen() {
  const [dropState, setDropState] = useState<ParachuteDropState>(INITIAL_STATE);

  const controller = useMemo(
    () => createParachuteDropController(setDropState),
    [],
  );

  useEffect(() => {
    return () => {
      controller.stop();
    };
  }, [controller]);

  const canStart =
    dropState.phase === 'idle' || dropState.phase === 'complete';

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Parachute Drop Challenge
      </ThemedText>

      {/* Phase badge */}
      <View style={[styles.phaseBadge, { backgroundColor: dropState.phase === 'dropping' ? '#3B82F6' : dropState.phase === 'complete' ? '#22C55E' : '#374151' }]}>
        <ThemedText type="smallBold" style={styles.phaseLabel}>
          {phaseLabel[dropState.phase]}
        </ThemedText>
      </View>

      {/* Live metrics card */}
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Live Barometer Data</ThemedText>

        <View style={styles.metricRow}>
          <ThemedText type="body" style={styles.metricKey}>Pressure</ThemedText>
          <ThemedText type="body" style={styles.metricValue}>
            {dropState.pressureHpa.toFixed(2)} hPa
          </ThemedText>
        </View>

        <View style={styles.metricRow}>
          <ThemedText type="body" style={styles.metricKey}>Altitude (relative)</ThemedText>
          <ThemedText type="body" style={styles.metricValue}>
            {dropState.relativeAltitudeM.toFixed(2)} m
          </ThemedText>
        </View>

        <View style={styles.metricRow}>
          <ThemedText type="body" style={styles.metricKey}>Peak Altitude</ThemedText>
          <ThemedText type="body" style={styles.metricValue}>
            {dropState.peakAltitudeM.toFixed(2)} m
          </ThemedText>
        </View>

        <View style={styles.metricRow}>
          <ThemedText type="body" style={styles.metricKey}>Descent Speed</ThemedText>
          <ThemedText type="body" style={styles.metricValue}>
            {dropState.descentSpeedMs.toFixed(2)} m/s
          </ThemedText>
        </View>

        <View style={styles.metricRow}>
          <ThemedText type="body" style={styles.metricKey}>Descent Time</ThemedText>
          <ThemedText type="body" style={styles.metricValue}>
            {dropState.descentSeconds}s
          </ThemedText>
        </View>
      </ThemedView>

      {/* Score display */}
      <ThemedView style={styles.scoreCard}>
        <ThemedText type="subtitle">Score</ThemedText>
        <ThemedText
          type="title"
          style={[styles.scoreValue, { color: scoreColor(dropState.score) }]}
        >
          {dropState.score} / 100
        </ThemedText>
        <ThemedText type="small" style={styles.scoreHint}>
          Slower, more stable descents score higher.
        </ThemedText>
      </ThemedView>

      {/* Status message */}
      <ThemedView style={styles.messageCard}>
        <ThemedText type="small">{dropState.message}</ThemedText>
      </ThemedView>

      {/* Action buttons */}
      <View style={styles.buttonRow}>
        <View style={styles.buttonWrapper}>
          <Button
            title={dropState.phase === 'idle' ? 'Start' : 'Restart'}
            onPress={() => controller.start()}
            disabled={!canStart}
          />
        </View>
        <View style={styles.buttonWrapper}>
          <Button title="Reset" onPress={() => controller.reset()} color="#6B7280" />
        </View>
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
    marginBottom: Spacing.two,
  },
  phaseBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.three,
  },
  phaseLabel: {
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    width: '100%',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    backgroundColor: '#20202E',
    gap: Spacing.two,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricKey: {
    color: '#9CA3AF',
  },
  metricValue: {
    fontVariant: ['tabular-nums'],
  },
  scoreCard: {
    width: '100%',
    padding: Spacing.four,
    borderRadius: Spacing.three,
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
    gap: Spacing.one,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
  },
  scoreHint: {
    color: '#6B7280',
    textAlign: 'center',
  },
  messageCard: {
    width: '100%',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    backgroundColor: '#111827',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  buttonWrapper: {
    flex: 1,
  },
});