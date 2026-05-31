import { useEffect, useMemo, useState } from 'react';
import { Button, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { TrialResultsTable } from '@/components/activity/TrialResultsTable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import {
  createSoundPollutionController,
  getRiskLabel,
  SoundPollutionState,
  SoundPrediction,
} from '@/services/soundPollutionService';
import { saveActivityResult } from '@/services/activityResultService';
import { Spacing } from '@/constants/theme';

const DEFAULT_ACTIONS = ['Drop book on table', 'Talk loudly', 'Stamp feet'];

export default function SoundPollutionScreen() {
  const theme = useTheme();
  const [state, setState] = useState<SoundPollutionState>({
    permissionsGranted: false,
    isMetering: false,
    currentDb: 0,
    peakDb: 0,
    actions: [],
    location: null,
    message: 'Grant microphone and location permissions to begin.',
  });
  const [actionLabel, setActionLabel] = useState(DEFAULT_ACTIONS[0]);
  const [prediction, setPrediction] = useState<SoundPrediction>('louder');
  const [submitting, setSubmitting] = useState(false);

  const controller = useMemo(() => createSoundPollutionController(setState), []);

  useEffect(() => {
    void controller.requestPermissions();
    return () => {
      void controller.stop();
    };
  }, [controller]);

  const riskLevel = state.currentDb > 0 ? (state.peakDb >= state.currentDb ? state.peakDb : state.currentDb) : 0;
  const gaugeColor =
    riskLevel >= 100 ? theme.danger : riskLevel >= 85 ? '#F59E0B' : riskLevel >= 60 ? theme.accent : theme.success;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await saveActivityResult(
        'sound-pollution',
        { actions: state.actions, zones: state.actions.map((a) => ({ label: a.label, lat: a.latitude, lng: a.longitude, db: a.measuredDb })) },
        { location: state.location, reflection: undefined },
      );
      setState((s) => ({ ...s, message: 'Results saved with GPS tags.' }));
    } catch {
      setState((s) => ({ ...s, message: 'Saved offline.' }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">Sound Pollution Hunter</ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          Measure noise from classroom actions and map loud vs quiet zones with GPS.
        </ThemedText>

        {!state.permissionsGranted && (
          <Button title="Grant permissions" onPress={() => controller.requestPermissions()} />
        )}

        <ThemedView style={[styles.meterCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ThemedText type="subtitle">Live sound level</ThemedText>
          <ThemedText type="title" style={{ color: gaugeColor, fontSize: 48 }}>
            {state.isMetering ? state.currentDb : '—'} dB
          </ThemedText>
          <ThemedText type="body">Peak: {state.peakDb} dB</ThemedText>
          {state.location && (
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              GPS: {state.location.latitude.toFixed(4)}, {state.location.longitude.toFixed(4)}
            </ThemedText>
          )}
          <ThemedText type="small" style={{ color: theme.textSecondary }}>{state.message}</ThemedText>
          <View style={styles.buttonRow}>
            {!state.isMetering ? (
              <Button title="Start metering" onPress={() => controller.startMetering()} disabled={!state.permissionsGranted} />
            ) : (
              <Button title="Stop metering" onPress={() => controller.stopMetering()} />
            )}
          </View>
        </ThemedView>

        <ThemedText type="subtitle">Log action</ThemedText>
        <View style={styles.chipRow}>
          {DEFAULT_ACTIONS.map((a) => (
            <Pressable key={a} onPress={() => setActionLabel(a)} style={[styles.chip, { borderColor: theme.border, backgroundColor: actionLabel === a ? theme.accent : theme.backgroundElement }]}>
              <ThemedText type="small" style={{ color: actionLabel === a ? '#fff' : theme.textPrimary }}>{a}</ThemedText>
            </Pressable>
          ))}
        </View>
        <TextInput
          value={actionLabel}
          onChangeText={setActionLabel}
          placeholder="Action label"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
        />
        <ThemedText type="small">Prediction vs previous</ThemedText>
        <View style={styles.segmentRow}>
          {(['louder', 'softer', 'same'] as SoundPrediction[]).map((p) => (
            <Pressable key={p} onPress={() => setPrediction(p)} style={[styles.segment, { backgroundColor: prediction === p ? theme.accent : theme.backgroundElement, borderColor: theme.border }]}>
              <ThemedText type="small" style={{ color: prediction === p ? '#fff' : theme.textPrimary }}>{p}</ThemedText>
            </Pressable>
          ))}
        </View>
        <Button
          title="Log this action"
          onPress={() => controller.logAction(actionLabel, prediction)}
          disabled={state.actions.length >= 10}
        />

        {state.actions.length > 0 && (
          <>
            <TrialResultsTable
              predictionHeader="Predicted"
              outcomeHeader="Measured (dB)"
              rows={state.actions.map((a) => ({
                label: a.label,
                prediction: a.prediction,
                outcome: `${a.measuredDb} dB — ${getRiskLabel(a.riskLevel)}`,
              }))}
            />
            <ThemedText type="subtitle">Zone map</ThemedText>
            {state.actions.map((a, i) => (
              <ThemedText key={i} type="small" style={{ color: theme.textSecondary }}>
                {a.label}: {a.measuredDb} dB @ {a.latitude?.toFixed(3) ?? '?'}, {a.longitude?.toFixed(3) ?? '?'}
              </ThemedText>
            ))}
          </>
        )}

        <Button title={submitting ? 'Saving…' : 'Submit results'} onPress={handleSubmit} disabled={submitting || state.actions.length === 0} />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.six },
  meterCard: { padding: Spacing.four, borderRadius: Spacing.three, borderWidth: 1, gap: Spacing.two, alignItems: 'center' },
  buttonRow: { marginTop: Spacing.two },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { padding: Spacing.two, borderRadius: Spacing.two, borderWidth: 1 },
  input: { borderWidth: 1, borderRadius: Spacing.two, padding: Spacing.two },
  segmentRow: { flexDirection: 'row', gap: Spacing.two },
  segment: { padding: Spacing.two, borderRadius: Spacing.two, borderWidth: 1, flex: 1, alignItems: 'center' },
});