import { useEffect, useMemo, useState } from 'react';
import { Button, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { DesignTrialCard } from '@/components/activity/DesignTrialCard';
import { TrialResultsTable } from '@/components/activity/TrialResultsTable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import {
  createEarthquakeStructureController,
  EarthquakeState,
} from '@/services/earthquakeStructureService';
import { saveActivityResult } from '@/services/activityResultService';
import { Spacing } from '@/constants/theme';

export default function EarthquakeStructureScreen() {
  const theme = useTheme();
  const [state, setState] = useState<EarthquakeState>({
    isVibrating: false,
    elapsedSec: 0,
    currentDisplacementCm: 0,
    currentRotationDeg: 0,
    maxDisplacementCm: 0,
    maxRotationDeg: 0,
    designs: [],
    activeDesignIndex: 0,
    message: 'Enter your structure design and start the earthquake test.',
  });
  const [draft, setDraft] = useState({ label: '', folds: '4', pillars: '4', prediction: '' });
  const [reflection, setReflection] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const controller = useMemo(() => createEarthquakeStructureController(setState), []);

  useEffect(() => {
    controller.setDraftLabel(draft.label);
    controller.setDraftFolds(Number(draft.folds) || 0);
    controller.setDraftPillars(Number(draft.pillars) || 0);
    controller.setDraftPrediction(draft.prediction);
  }, [controller, draft]);

  useEffect(() => () => controller.stop(), [controller]);

  const best = controller.getBestDesign();

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await saveActivityResult('earthquake-structure', {
        designs: state.designs,
        bestDesign: best,
        reflection,
      });
      setState((s) => ({ ...s, message: 'Results saved and synced.' }));
    } catch {
      setState((s) => ({ ...s, message: 'Saved offline — will sync when connected.' }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
      <ThemedView style={styles.container}>
        <ThemedText type="title" style={styles.title}>
          Earthquake-Resistant Structure
        </ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary }}>
          Place the phone at the center of your structure. Run the vibration test and record movement for up to 3 designs.
        </ThemedText>

        <DesignTrialCard
          title={`Design ${state.designs.length + 1} of 3`}
          label={draft.label}
          onLabelChange={(v) => setDraft((d) => ({ ...d, label: v }))}
          prediction={draft.prediction}
          onPredictionChange={(v) => setDraft((d) => ({ ...d, prediction: v }))}
        >
          <View style={styles.row}>
            <View style={styles.halfField}>
              <ThemedText type="small">Folds</ThemedText>
              <TextInput
                value={draft.folds}
                onChangeText={(v) => setDraft((d) => ({ ...d, folds: v }))}
                keyboardType="number-pad"
                style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
              />
            </View>
            <View style={styles.halfField}>
              <ThemedText type="small">Pillars</ThemedText>
              <TextInput
                value={draft.pillars}
                onChangeText={(v) => setDraft((d) => ({ ...d, pillars: v }))}
                keyboardType="number-pad"
                style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
              />
            </View>
          </View>
        </DesignTrialCard>

        <ThemedView style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <ThemedText type="subtitle">Live sensors</ThemedText>
          <ThemedText type="body">Elapsed: {state.elapsedSec}s</ThemedText>
          <ThemedText type="body">Displacement: {state.currentDisplacementCm.toFixed(2)} cm (max {state.maxDisplacementCm.toFixed(2)})</ThemedText>
          <ThemedText type="body">Rotation: {state.currentRotationDeg.toFixed(2)}° (max {state.maxRotationDeg.toFixed(2)})</ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>{state.message}</ThemedText>
          <View style={styles.buttonRow}>
            <Button
              title={state.isVibrating ? 'Testing…' : 'Start earthquake test (10s)'}
              onPress={() => controller.startVibrationTest(10)}
              disabled={state.isVibrating}
            />
            {state.isVibrating && <Button title="Stop early" onPress={() => controller.stopVibrationTest()} />}
          </View>
          <Button title="Save design results" onPress={() => controller.saveDesign()} disabled={state.isVibrating} />
        </ThemedView>

        {state.designs.length > 0 && (
          <>
            <ThemedText type="subtitle">Results comparison</ThemedText>
            <TrialResultsTable
              rows={state.designs.map((d) => ({
                label: d.label,
                prediction: d.prediction || `${d.folds} folds, ${d.pillars} pillars`,
                outcome: `${d.maxDisplacementCm.toFixed(1)} cm / ${d.maxRotationDeg.toFixed(1)}°`,
              }))}
            />
            {best && (
              <ThemedText type="body" style={{ color: theme.success }}>
                Best design: {best.label} (lowest movement)
              </ThemedText>
            )}
          </>
        )}

        <ThemedText type="small">Team reflection</ThemedText>
        <TextInput
          value={reflection}
          onChangeText={setReflection}
          multiline
          placeholder="Which fold design moved the least? Any surprises?"
          placeholderTextColor={theme.textSecondary}
          style={[styles.reflection, { color: theme.textPrimary, borderColor: theme.border }]}
        />
        <Button title={submitting ? 'Saving…' : 'Submit results'} onPress={handleSubmit} disabled={submitting || state.designs.length === 0} />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.four,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  title: {
    marginBottom: Spacing.two,
  },
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  halfField: {
    flex: 1,
    gap: Spacing.one,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.two,
  },
  buttonRow: {
    gap: Spacing.two,
  },
  reflection: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.two,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
