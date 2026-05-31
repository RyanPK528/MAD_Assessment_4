import { useEffect, useMemo, useState } from 'react';
import { Button, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

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
      await saveActivityResult('hand-fan', { designs: state.designs, reflection: draft.notes });
      setState((s) => ({ ...s, message: 'Results saved.' }));
    } catch {
      setState((s) => ({ ...s, message: 'Saved offline.' }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
      <ThemedView style={styles.container}>
        <ThemedText type="title">Hand Fan Challenge</ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          Stand paper upright, fan from the selected distance, and record bend angle and fan intensity.
        </ThemedText>

        <ThemedText type="subtitle">Material</ThemedText>
        <View style={styles.segmentRow}>
          {(['paper', 'cardboard'] as FanMaterial[]).map((m) => (
            <Pressable
              key={m}
              onPress={() => controller.setMaterial(m)}
              style={[
                styles.segment,
                {
                  backgroundColor: state.material === m ? theme.accent : theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              <ThemedText type="smallBold" style={{ color: state.material === m ? '#fff' : theme.textPrimary }}>
                {m}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <ThemedText type="subtitle">Fan distance (cm)</ThemedText>
        <View style={styles.segmentRow}>
          {DISTANCES.map((d) => (
            <Pressable
              key={d}
              onPress={() => controller.setDistance(d)}
              style={[
                styles.segment,
                {
                  backgroundColor: state.distanceCm === d ? theme.accent : theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}
            >
              <ThemedText type="smallBold" style={{ color: state.distanceCm === d ? '#fff' : theme.textPrimary }}>
                {d} cm
              </ThemedText>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.six },
  segmentRow: { flexDirection: 'row', gap: Spacing.two, flexWrap: 'wrap' },
  segment: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
  card: { padding: Spacing.four, borderRadius: Spacing.three, borderWidth: 1, gap: Spacing.two },
  buttonRow: { marginTop: Spacing.two },
  input: { borderWidth: 1, borderRadius: Spacing.two, padding: Spacing.two },
});