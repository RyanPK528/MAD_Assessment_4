import { useEffect, useMemo, useState } from 'react';
import { Button, StyleSheet, View } from 'react-native';

import {
  createSoundPollutionController,
  SoundPollutionState,
  SoundLevel,
} from '@/services/soundPollutionService';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const INITIAL_STATE: SoundPollutionState = {
  isRecording: false,
  hasPermission: false,
  currentDb: 0,
  averageDb: 0,
  peakDb: 0,
  level: 'quiet',
  loudEventCount: 0,
  secondsElapsed: 0,
  samples: [],
  message: 'Press Start to begin measuring noise levels.',
};

const LEVEL_COLORS: Record<SoundLevel, string> = {
  quiet: '#22C55E',
  moderate: '#F59E0B',
  loud: '#F97316',
  very_loud: '#EF4444',
};

const LEVEL_LABELS: Record<SoundLevel, string> = {
  quiet: 'Quiet',
  moderate: 'Moderate',
  loud: 'Loud',
  very_loud: 'Very Loud',
};

/** Renders a simple horizontal bar visualising dB as a filled proportion */
function DbMeter({ db, maxDb = 120, color }: { db: number; maxDb?: number; color: string }) {
  const fill = Math.min(1, db / maxDb);
  return (
    <View style={meterStyles.track}>
      <View style={[meterStyles.fill, { width: `${fill * 100}%` as any, backgroundColor: color }]} />
    </View>
  );
}

const meterStyles = StyleSheet.create({
  track: {
    height: 14,
    width: '100%',
    backgroundColor: '#1F2937',
    borderRadius: 7,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 7,
  },
});

/** Mini waveform chart from the last N samples */
function MiniBarChart({ samples }: { samples: SoundPollutionState['samples'] }) {
  if (samples.length === 0) return null;
  const maxDb = 120;
  return (
    <View style={chartStyles.container}>
      {samples.slice(-20).map((s, i) => (
        <View
          key={i}
          style={[
            chartStyles.bar,
            {
              height: `${Math.max(4, (s.decibelDb / maxDb) * 100)}%` as any,
              backgroundColor: LEVEL_COLORS[s.level],
            },
          ]}
        />
      ))}
    </View>
  );
}

const chartStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
    gap: 2,
    paddingTop: Spacing.one,
  },
  bar: {
    flex: 1,
    borderRadius: 2,
    minHeight: 4,
  },
});

export default function SoundPollutionScreen() {
  const [soundState, setSoundState] = useState<SoundPollutionState>(INITIAL_STATE);

  const controller = useMemo(
    () => createSoundPollutionController(setSoundState),
    [],
  );

  useEffect(() => {
    return () => {
      void controller.stop();
    };
  }, [controller]);

  const levelColor = LEVEL_COLORS[soundState.level];

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Sound Pollution Hunter
      </ThemedText>

      {/* Big dB readout */}
      <View style={[styles.bigReadout, { borderColor: levelColor }]}>
        <ThemedText
          type="title"
          style={[styles.bigDb, { color: levelColor }]}
        >
          {soundState.currentDb}
        </ThemedText>
        <ThemedText type="small" style={styles.dbUnit}>dB</ThemedText>
        <View style={[styles.levelBadge, { backgroundColor: levelColor }]}>
          <ThemedText type="smallBold" style={styles.levelText}>
            {LEVEL_LABELS[soundState.level]}
          </ThemedText>
        </View>
      </View>

      {/* dB meter bar */}
      <ThemedView style={styles.card}>
        <ThemedText type="subtitle">Live Level</ThemedText>
        <DbMeter db={soundState.currentDb} color={levelColor} />

        <View style={styles.metricRow}>
          <ThemedText type="small" style={styles.metricKey}>Average (5s)</ThemedText>
          <ThemedText type="small">{soundState.averageDb} dB</ThemedText>
        </View>
        <View style={styles.metricRow}>
          <ThemedText type="small" style={styles.metricKey}>Peak</ThemedText>
          <ThemedText type="small" style={{ color: '#EF4444' }}>{soundState.peakDb} dB</ThemedText>
        </View>
        <View style={styles.metricRow}>
          <ThemedText type="small" style={styles.metricKey}>Loud Events (&gt;70 dB)</ThemedText>
          <ThemedText type="small">{soundState.loudEventCount}</ThemedText>
        </View>
        <View style={styles.metricRow}>
          <ThemedText type="small" style={styles.metricKey}>Duration</ThemedText>
          <ThemedText type="small">{soundState.secondsElapsed}s</ThemedText>
        </View>
      </ThemedView>

      {/* Waveform history */}
      {soundState.samples.length > 0 && (
        <ThemedView style={styles.card}>
          <ThemedText type="subtitle">dB History (last 20s)</ThemedText>
          <MiniBarChart samples={soundState.samples} />
        </ThemedView>
      )}

      {/* Status */}
      <ThemedView style={styles.messageCard}>
        <ThemedText type="small">{soundState.message}</ThemedText>
      </ThemedView>

      {/* Controls */}
      <View style={styles.buttonRow}>
        <View style={styles.buttonWrapper}>
          <Button
            title={soundState.isRecording ? 'Stop' : 'Start'}
            onPress={() => {
              if (soundState.isRecording) {
                void controller.stop();
              } else {
                void controller.start();
              }
            }}
            color={soundState.isRecording ? '#EF4444' : '#22C55E'}
          />
        </View>
        <View style={styles.buttonWrapper}>
          <Button
            title="Reset"
            onPress={() => void controller.reset()}
            color="#6B7280"
          />
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
  bigReadout: {
    alignSelf: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 80,
    width: 160,
    height: 160,
    justifyContent: 'center',
    gap: 2,
    padding: Spacing.three,
  },
  bigDb: {
    fontSize: 56,
    fontWeight: '800',
    lineHeight: 60,
  },
  dbUnit: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  levelBadge: {
    marginTop: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.two,
  },
  levelText: {
    color: '#FFFFFF',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  },
  metricKey: {
    color: '#9CA3AF',
  },
  messageCard: {
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