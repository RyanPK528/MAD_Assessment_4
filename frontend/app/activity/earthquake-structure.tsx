import { useEffect, useMemo, useState } from 'react';
import { Button, StyleSheet, TextInput, View } from 'react-native';

import { ActivityLayout, ActivityTab } from '@/components/activity/ActivityLayout';
import { ActivityOverviewPanel } from '@/components/activity/ActivityOverviewPanel';
import { ActivitySection } from '@/components/activity/ActivitySection';
import { ActivitySubmissionPanel } from '@/components/activity/ActivitySubmissionPanel';
import { DesignTrialCard } from '@/components/activity/DesignTrialCard';
import { ReflectionModal } from '@/components/activity/ReflectionModal';
import { TrialResultsTable } from '@/components/activity/TrialResultsTable';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACTIVITY_CATALOG } from '@/constants/activityCatalog';
import { useActivitySubmission } from '@/hooks/useActivitySubmission';
import { useTheme } from '@/hooks/use-theme';
import {
  createEarthquakeStructureController,
  EarthquakeState,
} from '@/services/earthquakeStructureService';
import { SpacingScale } from '@/constants/theme';

export default function EarthquakeStructureScreen() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<ActivityTab>('overview');
  const [refreshKey, setRefreshKey] = useState(0);
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

  const controller = useMemo(() => createEarthquakeStructureController(setState), []);

  const submission = useActivitySubmission({
    activityId: 'earthquake-structure',
    onSuccess: () => {
      setState((current) => ({
        ...current,
        designs: [],
        message: 'Attempt submitted. Start a new attempt from the Activity tab.',
      }));
      setDraft({ label: '', folds: '4', pillars: '4', prediction: '' });
      setRefreshKey((key) => key + 1);
      setActiveTab('submission');
    },
  });

  useEffect(() => {
    controller.setDraftLabel(draft.label);
    controller.setDraftFolds(Number(draft.folds) || 0);
    controller.setDraftPillars(Number(draft.pillars) || 0);
    controller.setDraftPrediction(draft.prediction);
  }, [controller, draft]);

  useEffect(() => () => controller.stop(), [controller]);

  const best = controller.getBestDesign();

  const handleSubmit = () => {
    submission.requestSubmit({
      designs: state.designs,
      bestDesign: best,
    });
  };

  const overviewContent = <ActivityOverviewPanel activityId="earthquake-structure" />;

  const activityContent = (
    <ThemedView style={styles.container}>
      <ActivitySection title="Structure Design">
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
      </ActivitySection>

      <ActivitySection title="Vibration Test">
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
      </ActivitySection>

      {state.designs.length > 0 && (
        <ActivitySection title="Results Comparison">
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
        </ActivitySection>
      )}

      <ActivitySection title="Submit">
      <Button
        title="Submit attempt"
        onPress={handleSubmit}
        disabled={!submission.canSubmit || state.designs.length === 0}
      />
      </ActivitySection>
    </ThemedView>
  );

  const submissionContent = (
    <ActivitySubmissionPanel activityId="earthquake-structure" refreshKey={refreshKey} />
  );

  return (
    <>
      <ActivityLayout
        activityName="Earthquake-Resistant Structure"
        overviewContent={overviewContent}
        activityContent={activityContent}
        submissionContent={submissionContent}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <ReflectionModal
        visible={submission.modalVisible}
        activityName={ACTIVITY_CATALOG['earthquake-structure'].label}
        submitting={submission.submitting}
        errorMessage={submission.submitError}
        onConfirm={submission.confirmSubmit}
        onCancel={submission.cancelSubmit}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { gap: SpacingScale.xs },
  row: { flexDirection: 'row', gap: SpacingScale.sm },
  halfField: { flex: 1, gap: SpacingScale.xxs },
  input: { borderWidth: 1, borderRadius: SpacingScale.sm, padding: SpacingScale.sm },
  buttonRow: { gap: SpacingScale.sm },
});
