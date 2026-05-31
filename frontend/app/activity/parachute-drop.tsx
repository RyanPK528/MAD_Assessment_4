import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { DesignTrialCard } from '@/components/activity/DesignTrialCard';
import { PhysicsResultPanel } from '@/components/activity/PhysicsResultPanel';
import { SessionTimer } from '@/components/activity/SessionTimer';
import { TrialResultsTable } from '@/components/activity/TrialResultsTable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { saveActivityResult } from '@/services/activityResultService';
import {
  createEmptyTrial,
  createParachuteDropController,
  ParachuteDropState,
  SESSION_MAX_SEC,
} from '@/services/parachuteDropService';
import { Spacing } from '@/constants/theme';

export default function ParachuteDropScreen() {
  const theme = useTheme();
  const [state, setState] = useState<ParachuteDropState>({
    phase: 'setup',
    dropHeightM: 1.0,
    toyMassKg: 0.2,
    trials: [createEmptyTrial(0), createEmptyTrial(1), createEmptyTrial(2)],
    activeTrialIndex: 0,
    sessionTimerSec: 0,
    sessionRunning: false,
    dropTimerSec: 0,
    dropTimerRunning: false,
    reflection: '',
    message: 'Enter drop height and toy mass, then run up to 3 prototype tests.',
  });
  const [heightInput, setHeightInput] = useState('1.0');
  const [massInput, setMassInput] = useState('0.2');
  const [contactInput, setContactInput] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const controller = useMemo(() => {
    const ctrl = createParachuteDropController(setState);
    return ctrl;
  }, []);

  useEffect(() => () => controller.stop(), [controller]);

  const activeTrial = state.trials[state.activeTrialIndex];

  const handleRecordVideo = async () => {
    if (!permission?.granted) {
      await requestPermission();
      return;
    }
    setShowCamera(true);
  };

  const handleStopVideo = async () => {
    if (cameraRef.current) {
      try {
        const video = await cameraRef.current.recordAsync({ maxDuration: 30 });
        if (video?.uri) {
          controller.setVideoUri(video.uri);
        }
      } catch {
        // recording may not have started
      }
    }
    setShowCamera(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await saveActivityResult('parachute-drop', {
        dropHeightM: state.dropHeightM,
        toyMassKg: state.toyMassKg,
        trials: state.trials,
        sessionTimerSec: state.sessionTimerSec,
      }, { reflection: state.reflection });
      setState((s) => ({ ...s, message: 'Results saved.' }));
    } catch {
      setState((s) => ({ ...s, message: 'Saved offline.' }));
    } finally {
      setSubmitting(false);
    }
  };

  if (showCamera && permission?.granted) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} mode="video" facing="back">
          <View style={styles.cameraControls}>
            <Button title="Start recording" onPress={() => cameraRef.current?.recordAsync()} />
            <Button title="Stop & close" onPress={handleStopVideo} />
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">Parachute Drop Challenge</ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          Drop your toy from a fixed height, record fall time and slow-motion contact time, then compare up to 3 parachute designs.
        </ThemedText>

        <SessionTimer
          elapsedSec={state.sessionTimerSec}
          maxSec={SESSION_MAX_SEC}
          isRunning={state.sessionRunning}
          onStart={() => controller.startSessionTimer()}
          onStop={() => controller.stopSessionTimer()}
          onReset={() => controller.resetSessionTimer()}
          label="20-minute design session"
        />

        <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ThemedText type="subtitle">Setup</ThemedText>
          <ThemedText type="small">Drop height (m)</ThemedText>
          <TextInput
            value={heightInput}
            onChangeText={(v) => {
              setHeightInput(v);
              controller.setDropHeight(Number(v) || 0);
            }}
            keyboardType="decimal-pad"
            style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
          />
          <ThemedText type="small">Toy mass (kg)</ThemedText>
          <TextInput
            value={massInput}
            onChangeText={(v) => {
              setMassInput(v);
              controller.setMass(Number(v) || 0);
            }}
            keyboardType="decimal-pad"
            style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
          />
          <Button title="Begin trials" onPress={() => controller.setPhase('recording')} />
        </ThemedView>

        {state.phase !== 'setup' && activeTrial && (
          <>
            <View style={styles.trialTabs}>
              {[0, 1, 2].map((i) => (
                <Button
                  key={i}
                  title={`Trial ${i + 1}`}
                  onPress={() => controller.setActiveTrial(i)}
                  color={state.activeTrialIndex === i ? theme.accent : undefined}
                />
              ))}
            </View>

            <DesignTrialCard
              title={activeTrial.label}
              label={activeTrial.label}
              onLabelChange={(v) => controller.updateActiveTrial({ label: v })}
              prediction={activeTrial.prediction}
              onPredictionChange={(v) => controller.updateActiveTrial({ prediction: v })}
            />

            <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <ThemedText type="subtitle">Drop timer</ThemedText>
              <ThemedText type="title">
                {state.dropTimerRunning ? state.dropTimerSec.toFixed(3) : activeTrial.fallTimeSec?.toFixed(3) ?? '0.000'} s
              </ThemedText>
              <View style={styles.buttonRow}>
                {!state.dropTimerRunning ? (
                  <Button title="Start drop" onPress={() => controller.startDropTimer()} />
                ) : (
                  <Button title="Toy hit ground — stop" onPress={() => controller.stopDropTimer()} />
                )}
              </View>
            </ThemedView>

            <ThemedText type="small">Contact time from slow-motion (s)</ThemedText>
            <TextInput
              value={contactInput}
              onChangeText={(v) => {
                setContactInput(v);
                controller.setContactTime(Number(v) || 0);
              }}
              keyboardType="decimal-pad"
              placeholder="e.g. 0.05"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
            />

            <View style={styles.buttonRow}>
              <Button title="Record slow-mo video" onPress={handleRecordVideo} />
              {activeTrial.videoUri && (
                <ThemedText type="small" style={{ color: theme.success }}>Video saved</ThemedText>
              )}
            </View>

            <PhysicsResultPanel
              values={{
                impactSpeedMs: activeTrial.impactSpeedMs,
                accelerationMs2: activeTrial.accelerationMs2,
                netForceN: activeTrial.netForceN,
                dragForceN: activeTrial.dragForceN,
                gForce: activeTrial.gForce,
              }}
            />
          </>
        )}

        {state.trials.some((t) => t.fallTimeSec !== null) && (
          <TrialResultsTable
            rows={state.trials
              .filter((t) => t.fallTimeSec !== null)
              .map((t) => ({
                label: t.label,
                prediction: t.prediction || '—',
                outcome: `${t.fallTimeSec?.toFixed(3)} s fall${t.gForce !== null ? `, ${t.gForce.toFixed(1)} g` : ''}`,
              }))}
          />
        )}

        <ThemedText type="small">Team reflection</ThemedText>
        <TextInput
          value={state.reflection}
          onChangeText={(v) => controller.setReflection(v)}
          multiline
          placeholder="Which parachute design was best? Were your timing predictions correct?"
          placeholderTextColor={theme.textSecondary}
          style={[styles.reflection, { color: theme.textPrimary, borderColor: theme.border }]}
        />
        <ThemedText type="small" style={{ color: theme.textSecondary }}>{state.message}</ThemedText>
        <Button
          title={submitting ? 'Saving…' : 'Submit results'}
          onPress={handleSubmit}
          disabled={submitting || !state.trials.some((t) => t.fallTimeSec !== null)}
        />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.six },
  card: { padding: Spacing.four, borderRadius: Spacing.three, borderWidth: 1, gap: Spacing.two },
  input: { borderWidth: 1, borderRadius: Spacing.two, padding: Spacing.two },
  buttonRow: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center', flexWrap: 'wrap' },
  trialTabs: { flexDirection: 'row', gap: Spacing.two },
  reflection: { borderWidth: 1, borderRadius: Spacing.two, padding: Spacing.two, minHeight: 80, textAlignVertical: 'top' },
  cameraContainer: { flex: 1 },
  camera: { flex: 1 },
  cameraControls: { position: 'absolute', bottom: 40, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: Spacing.three },
});
