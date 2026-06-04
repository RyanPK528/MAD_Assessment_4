import { useEffect, useMemo, useState } from 'react';
import { Button, StyleSheet, View } from 'react-native';

import { ActivityLayout, ActivityTab } from '@/components/activity/ActivityLayout';
import { ActivityOverviewPanel } from '@/components/activity/ActivityOverviewPanel';
import { ActivitySection } from '@/components/activity/ActivitySection';
import { ActivitySubmissionPanel } from '@/components/activity/ActivitySubmissionPanel';
import { ReflectionModal } from '@/components/activity/ReflectionModal';
import { createBreathingTrainerController, BreathingTrainerState } from '@/services/breathingTrainerService';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACTIVITY_CATALOG } from '@/constants/activityCatalog';
import { SpacingScale } from '@/constants/theme';
import { useActivitySubmission } from '@/hooks/useActivitySubmission';
import { useActivityStyles } from '@/hooks/use-activity-styles';

const PHASE_LABELS: Record<BreathingTrainerState['phase'], string> = {
  Resting: 'At rest',
  PostExercise1: 'After jogging in place',
  PostExercise2: 'After star jumps',
};

export default function BreathingTrainerScreen() {
  const activityStyles = useActivityStyles();
  const [activeTab, setActiveTab] = useState<ActivityTab>('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [state, setState] = useState<BreathingTrainerState>({
    phase: 'Resting',
    secondsElapsed: 0,
    breathsPerMinute: 0,
    breathCount: 0,
    message: 'Place the phone gently on your chest to begin.',
    isActive: false,
  });
  const [sessions, setSessions] = useState<
    Array<{ phase: string; bpm: number; breathCount: number }>
  >([]);

  const controller = useMemo(() => createBreathingTrainerController(setState), []);

  const submission = useActivitySubmission({
    activityId: 'breathing-trainer',
    onSuccess: () => {
      setSessions([]);
      controller.start();
      setRefreshKey((key) => key + 1);
      setActiveTab('submission');
    },
  });

  useEffect(() => {
    controller.start();
    return () => controller.stop();
  }, [controller]);

  const handleStop = () => {
    controller.stop();
    setSessions((current) => [
      {
        phase: PHASE_LABELS[state.phase],
        bpm: state.breathsPerMinute,
        breathCount: state.breathCount,
      },
      ...current,
    ]);
  };

  const handleSubmit = () => {
    submission.requestSubmit({ sessions });
  };

  const overviewContent = <ActivityOverviewPanel activityId="breathing-trainer" />;

  const activityContent = (
    <ThemedView style={styles.container}>
      <ActivitySection title="Setup">
        <ThemedText type="body">
          Place the phone gently on your chest. Record breathing at rest, then after light exercise (jog in place for one minute and 100 star jumps).
        </ThemedText>
        <ThemedText type="small" style={activityStyles.emptyText}>
          Rotate through each team member and compare resting vs post-exercise results.
        </ThemedText>
      </ActivitySection>

      <ActivitySection title="Live Recording">
        <ThemedText type="body">Phase: {PHASE_LABELS[state.phase]}</ThemedText>
        <ThemedText type="body">Time elapsed: {state.secondsElapsed}s</ThemedText>
        <ThemedText type="body">Breaths per minute: {state.breathsPerMinute}</ThemedText>
        <ThemedText type="body">Breath count: {state.breathCount}</ThemedText>
        <ThemedText type="small">{state.message}</ThemedText>
      </ActivitySection>

      <ActivitySection title="Session Controls">
        <View style={styles.buttonRow}>
          <Button title="Restart Session" onPress={() => controller.start()} />
          <Button title="Stop & record session" onPress={handleStop} />
        </View>
      </ActivitySection>

      {sessions.length > 0 ? (
        <ActivitySection title="Recorded sessions">
          {sessions.map((session, index) => (
            <ThemedText key={`${session.phase}-${index}`} type="body">
              {session.phase}: {session.bpm} BPM ({session.breathCount} breaths)
            </ThemedText>
          ))}
        </ActivitySection>
      ) : null}

      <ActivitySection title="Submit">
        <Button
          title="Submit attempt"
          onPress={handleSubmit}
          disabled={!submission.canSubmit || sessions.length === 0}
        />
      </ActivitySection>
    </ThemedView>
  );

  const submissionContent = (
    <ActivitySubmissionPanel activityId="breathing-trainer" refreshKey={refreshKey} />
  );

  return (
    <>
      <ActivityLayout
        activityName="Breathing Pace Trainer"
        overviewContent={overviewContent}
        activityContent={activityContent}
        submissionContent={submissionContent}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <ReflectionModal
        visible={submission.modalVisible}
        activityName={ACTIVITY_CATALOG['breathing-trainer'].label}
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
  buttonRow: {
    width: '100%',
    gap: SpacingScale.sm,
  },
});
