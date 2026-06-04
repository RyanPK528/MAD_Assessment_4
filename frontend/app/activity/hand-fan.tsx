import { useEffect, useMemo, useState } from 'react';
import { Button, Pressable, StyleSheet, TextInput, View } from 'react-native';

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
  createHandFanController,
  FanDistanceCm,
  FanMaterial,
  HandFanState,
} from '@/services/handFanService';
import { SpacingScale } from '@/constants/theme';

const DISTANCES: FanDistanceCm[] = [15, 30, 45];

export default function HandFanScreen() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<ActivityTab>('overview');
  const [refreshKey, setRefreshKey] = useState(0);
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

  const controller = useMemo(() => createHandFanController(setState), []);

  const submission = useActivitySubmission({
    activityId: 'hand-fan',
    onSuccess: () => {
      setState((current) => ({
        ...current,
        designs: [],
        message: 'Attempt submitted. Start a new attempt from the Activity tab.',
      }));
      setDraft({ label: '', prediction: '', notes: '' });
      setBendInput('30');
      setRefreshKey((key) => key + 1);
      setActiveTab('submission');
    },
  });

  useEffect(() => {
    controller.setDraftLabel(draft.label);
    controller.setDraftPrediction(draft.prediction);
    controller.setDraftNotes(draft.notes);
  }, [controller, draft]);

  useEffect(() => () => controller.stop(), [controller]);

  const handleSubmit = () => {
    submission.requestSubmit({ designs: state.designs });
  };

  const overviewContent = <ActivityOverviewPanel activityId="hand-fan" />;

  const activityContent = (
    <ThemedView style={styles.container}>
      <ActivitySection title="Material">
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
      </ActivitySection>

      <ActivitySection title="Fan Distance">
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
      </ActivitySection>

      <ActivitySection title="Fan Intensity">
        <ThemedText type="title">{state.phase === 'fanning' ? state.liveIntensity.toFixed(1) : state.fanIntensity.toFixed(1)}</ThemedText>
        <ThemedText type="small" style={{ color: theme.textSecondary }}>{state.message}</ThemedText>
        <View style={styles.buttonRow}>
          {state.phase !== 'fanning' ? (
            <Button title="Start fanning" onPress={() => controller.startFanTracking()} />
          ) : (
            <Button title="Stop & record" onPress={() => controller.stopFanTracking()} />
          )}
        </View>
      </ActivitySection>

      <ActivitySection title="Design Trial">
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
      </ActivitySection>

      {state.designs.length > 0 && (
        <ActivitySection title="Results">
        <TrialResultsTable
          rows={state.designs.map((d) => ({
            label: d.label,
            prediction: d.prediction,
            outcome: `${d.bendAngleDeg}° bend, ${d.estimatedForceN} N @ ${d.distanceCm}cm`,
          }))}
        />
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

  const submissionContent = <ActivitySubmissionPanel activityId="hand-fan" refreshKey={refreshKey} />;

  return (
    <>
      <ActivityLayout
        activityName="Hand Fan Challenge"
        overviewContent={overviewContent}
        activityContent={activityContent}
        submissionContent={submissionContent}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <ReflectionModal
        visible={submission.modalVisible}
        activityName={ACTIVITY_CATALOG['hand-fan'].label}
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
  segmentRow: { flexDirection: 'row', gap: SpacingScale.sm, flexWrap: 'wrap' },
  segment: { paddingVertical: SpacingScale.sm, paddingHorizontal: SpacingScale.md, borderRadius: SpacingScale.sm, borderWidth: 1 },
  buttonRow: { marginTop: SpacingScale.sm },
  input: { borderWidth: 1, borderRadius: SpacingScale.sm, padding: SpacingScale.sm },
});
