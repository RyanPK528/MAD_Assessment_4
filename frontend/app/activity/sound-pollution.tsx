import { useEffect, useMemo, useState } from 'react';
import { Button, Image, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ActivityLayout } from '@/components/activity/ActivityLayout';
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
import { useActivityStyles } from '@/hooks/use-activity-styles';

const DEFAULT_ACTIONS = ['Drop book on table', 'Talk loudly', 'Stamp feet'];

export default function SoundPollutionScreen() {
  const theme = useTheme();
  const activityStyles = useActivityStyles();
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
  const [selfRating, setSelfRating] = useState('3');
  const [comments, setComments] = useState('');
  const [submittedAttempts, setSubmittedAttempts] = useState<number[]>([]);

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
        { location: state.location, reflection: `Self-rating: ${selfRating}/5 | ${comments}` },
      );
      setSubmittedAttempts((current) => [state.actions.length, ...current].slice(0, 5));
      setState((s) => ({ ...s, message: 'Results saved with GPS tags.' }));
    } catch {
      setState((s) => ({ ...s, message: 'Saved offline.' }));
    } finally {
      setSubmitting(false);
    }
  };

  const overviewContent = (
    <ThemedView style={activityStyles.section}>
      <ThemedText type="subtitle">Description</ThemedText>
      <ThemedText type="body">Measure classroom noise levels and map loud versus quiet zones using GPS.</ThemedText>
      <ThemedText type="subtitle">Materials / Equipment</ThemedText>
      <ThemedText type="body">Phone with microphone and location access.</ThemedText>
      <ThemedText type="subtitle">Instructions</ThemedText>
      <ThemedText type="body">1. Grant microphone and location permissions.</ThemedText>
      <ThemedText type="body">2. Start metering and log classroom actions.</ThemedText>
      <ThemedText type="body">3. Submit mapped sound readings.</ThemedText>
      <ThemedText type="subtitle">Diagram</ThemedText>
      <Image
        source={require('../../assets/instructions/activity2.png')}
        style={styles.instructionImage}
        resizeMode="contain"
      />
    </ThemedView>
  );

  const activityContent = (
    <ThemedView style={styles.container}>
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
  );

  const submissionContent = (
    <ThemedView style={activityStyles.section}>
      <ThemedText type="subtitle">Submitted attempts</ThemedText>
      {submittedAttempts.length === 0 ? (
        <ThemedText type="small">No submissions yet.</ThemedText>
      ) : (
        submittedAttempts.map((count, idx) => (
          <ThemedText key={idx} type="small">Attempt {idx + 1}: {count} actions logged</ThemedText>
        ))
      )}
      <ThemedText type="subtitle">Theory behind activity</ThemedText>
      <ThemedText type="body">Sound intensity (dB) increases with energy; prolonged high levels can cause hearing fatigue and damage.</ThemedText>
      <ThemedText type="subtitle">Self-rating (1-5)</ThemedText>
      <TextInput value={selfRating} onChangeText={setSelfRating} keyboardType="number-pad" style={activityStyles.input} />
      <ThemedText type="subtitle">Comments</ThemedText>
      <TextInput value={comments} onChangeText={setComments} multiline style={[activityStyles.input, activityStyles.multiline]} />
    </ThemedView>
  );

  return (
    <ActivityLayout
      activityName="Sound Pollution Hunter"
      overviewContent={overviewContent}
      activityContent={activityContent}
      submissionContent={submissionContent}
    />
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three, paddingBottom: Spacing.six },
  instructionImage: {
    width: '100%',
    height: 200,
    marginVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  meterCard: { padding: Spacing.four, borderRadius: Spacing.three, borderWidth: 1, gap: Spacing.two, alignItems: 'center' },
  buttonRow: { marginTop: Spacing.two },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { padding: Spacing.two, borderRadius: Spacing.two, borderWidth: 1 },
  input: { borderWidth: 1, borderRadius: Spacing.two, padding: Spacing.two },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
  segmentRow: { flexDirection: 'row', gap: Spacing.two },
  segment: { padding: Spacing.two, borderRadius: Spacing.two, borderWidth: 1, flex: 1, alignItems: 'center' },
});
