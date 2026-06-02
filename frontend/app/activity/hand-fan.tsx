import { useEffect, useMemo, useState } from 'react';
import { Button, Image, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ActivityLayout } from '@/components/activity/ActivityLayout';
import { DesignTrialCard } from '@/components/activity/DesignTrialCard';
import { TrialResultsTable } from '@/components/activity/TrialResultsTable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import {
  createHandFanController,
  FanDistanceCm,
  FanMaterial,
  HandFanState,
} from '@/services/handFanService';
import { saveActivityResult } from '@/services/activityResultService';
import { Spacing } from '@/constants/theme';

const DISTANCES: FanDistanceCm[] = [15, 30, 45];

export default function HandFanScreen() {
  const theme = useTheme();
  const [state, setState] = useState<HandFanState>({
    phase: 'idle',
    fanIntensity: 0,
    liveIntensity: 0,
    distanceCm: 30,
    material: 'paper',
    stiffnessK: 0.05,
    designs: [],
    bendAngleDeg: 30,
    message: 'Select material and distance, then fan while holding the phone.',
  });
  const [draft, setDraft] = useState({ label: '', prediction: '', notes: '' });
  const [bendInput, setBendInput] = useState('30');
  const [submitting, setSubmitting] = useState(false);
  const [selfRating, setSelfRating] = useState('3');
  const [comments, setComments] = useState('');
  const [submittedAttempts, setSubmittedAttempts] = useState<number[]>([]);

  const controller = useMemo(() => createHandFanController(setState), []);

  useEffect(() => {
    controller.setDraftLabel(draft.label);
    controller.setDraftPrediction(draft.prediction);
    controller.setDraftNotes(draft.notes);
  }, [controller, draft]);

  useEffect(() => () => controller.stop(), [controller]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await saveActivityResult('hand-fan', { designs: state.designs, reflection: draft.notes }, {
        reflection: `Self-rating: ${selfRating}/5 | ${comments}`,
      });
      setSubmittedAttempts((current) => [state.designs.length, ...current].slice(0, 5));
      setState((s) => ({ ...s, message: 'Results saved.' }));
    } catch {
      setState((s) => ({ ...s, message: 'Saved offline.' }));
    } finally {
      setSubmitting(false);
    }
  };

  const overviewContent = (
    <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <ThemedText type="subtitle">Description</ThemedText>
      <ThemedText type="body">Fan paper or cardboard from different distances and measure bend angle and fan intensity.</ThemedText>
      <ThemedText type="subtitle">Materials / Equipment</ThemedText>
      <ThemedText type="body">Paper/cardboard sheet, phone with accelerometer.</ThemedText>
      <ThemedText type="subtitle">Instructions</ThemedText>
      <ThemedText type="body">1. Choose material and fan distance.</ThemedText>
      <ThemedText type="body">2. Start fanning and record intensity.</ThemedText>
      <ThemedText type="body">3. Save up to three designs and submit.</ThemedText>
      <ThemedText type="subtitle">Diagram</ThemedText>
      <Image
        source={require('../../assets/instructions/activity3.png')}
        style={styles.instructionImage}
        resizeMode="contain"
      />
    </ThemedView>
  );

  const activityContent = (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Material</ThemedText>
      <View style={styles.segmentRow}>
        {(['paper', 'cardboard'] as FanMaterial[]).map((m) => (
          <Pressable
            key={m}
            onPress={() => controller.setMaterial(m)}
            style={[styles.segment, { backgroundColor: state.material === m ? theme.accent : theme.backgroundElement, borderColor: theme.border }]}
          >
            <ThemedText type="smallBold" style={{ color: state.material === m ? '#fff' : theme.textPrimary }}>{m}</ThemedText>
          </Pressable>
        ))}
      </View>

      <ThemedText type="subtitle">Fan distance (cm)</ThemedText>
      <View style={styles.segmentRow}>
        {DISTANCES.map((d) => (
          <Pressable
            key={d}
            onPress={() => controller.setDistance(d)}
            style={[styles.segment, { backgroundColor: state.distanceCm === d ? theme.accent : theme.backgroundElement, borderColor: theme.border }]}
          >
            <ThemedText type="smallBold" style={{ color: state.distanceCm === d ? '#fff' : theme.textPrimary }}>{d} cm</ThemedText>
          </Pressable>
        ))}
      </View>

      <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <ThemedText type="subtitle">Fan intensity</ThemedText>
        <ThemedText type="title">{state.phase === 'fanning' ? state.liveIntensity.toFixed(1) : state.fanIntensity.toFixed(1)}</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>{state.message}</ThemedText>
        <View style={styles.buttonRow}>
          {state.phase !== 'fanning' ? (
            <Button title="Start fanning" onPress={() => controller.startFanTracking()} />
          ) : (
            <Button title="Stop & record" onPress={() => controller.stopFanTracking()} />
          )}
        </View>
      </ThemedView>

      <DesignTrialCard
        title={`Design ${state.designs.length + 1} of 3`}
        label={draft.label}
        onLabelChange={(v) => setDraft((d) => ({ ...d, label: v }))}
        prediction={draft.prediction}
        onPredictionChange={(v) => setDraft((d) => ({ ...d, prediction: v }))}
        notes={draft.notes}
        onNotesChange={(v) => setDraft((d) => ({ ...d, notes: v }))}
      >
        <ThemedText type="small">Bend angle (degrees)</ThemedText>
        <TextInput
          value={bendInput}
          onChangeText={(v) => {
            setBendInput(v);
            controller.setBendAngle(Number(v) || 0);
          }}
          keyboardType="number-pad"
          style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
        />
        <ThemedText type="small" style={{ color: theme.textSecondary }}>
          Stiffness k = {state.stiffnessK} N/rad • Est. force ≈{' '}
          {(state.stiffnessK * ((Number(bendInput) || 0) * Math.PI) / 180).toFixed(3)} N
        </ThemedText>
      </DesignTrialCard>
      <Button title="Save design" onPress={() => controller.saveDesign()} disabled={state.phase === 'fanning'} />

      {state.designs.length > 0 && (
        <TrialResultsTable
          rows={state.designs.map((d) => ({
            label: d.label,
            prediction: d.prediction,
            outcome: `${d.bendAngleDeg}° bend, ${d.estimatedForceN} N @ ${d.distanceCm}cm`,
          }))}
        />
      )}

      <Button title={submitting ? 'Saving…' : 'Submit results'} onPress={handleSubmit} disabled={submitting || state.designs.length === 0} />
    </ThemedView>
  );

  const submissionContent = (
    <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <ThemedText type="subtitle">Submitted attempts</ThemedText>
      {submittedAttempts.length === 0 ? (
        <ThemedText type="small">No submissions yet.</ThemedText>
      ) : (
        submittedAttempts.map((count, idx) => (
          <ThemedText key={idx} type="small">Attempt {idx + 1}: {count} designs saved</ThemedText>
        ))
      )}
      <ThemedText type="subtitle">Theory behind activity</ThemedText>
      <ThemedText type="body">Airflow applies force proportional to fan intensity; material stiffness resists bending (F ≈ kθ).</ThemedText>
      <ThemedText type="subtitle">Self-rating (1-5)</ThemedText>
      <TextInput value={selfRating} onChangeText={setSelfRating} keyboardType="number-pad" style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]} />
      <ThemedText type="subtitle">Comments</ThemedText>
      <TextInput value={comments} onChangeText={setComments} multiline style={[styles.input, styles.multiline, { color: theme.textPrimary, borderColor: theme.border }]} />
    </ThemedView>
  );

  return (
    <ActivityLayout
      activityName="Hand Fan Challenge"
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
  segmentRow: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  segment: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.three, borderRadius: Spacing.two, borderWidth: 1 },
  card: { padding: Spacing.four, borderRadius: Spacing.three, borderWidth: 1, gap: Spacing.two },
  buttonRow: { marginTop: Spacing.two },
  input: { borderWidth: 1, borderRadius: Spacing.two, padding: Spacing.two },
  multiline: { minHeight: 80, textAlignVertical: 'top' },
});
