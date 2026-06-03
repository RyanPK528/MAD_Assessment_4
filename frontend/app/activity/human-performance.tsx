import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { ActivityLayout, ActivityTab } from '@/components/activity/ActivityLayout';
import { ActivityOverviewPanel } from '@/components/activity/ActivityOverviewPanel';
import { ActivitySection } from '@/components/activity/ActivitySection';
import { ActivitySubmissionPanel } from '@/components/activity/ActivitySubmissionPanel';
import { HumanPerformanceResultsTable } from '@/components/activity/HumanPerformanceResultsTable';
import { MovementSparkline } from '@/components/activity/MovementSparkline';
import { RecordCircleButton } from '@/components/activity/RecordCircleButton';
import { RecordingCountdownOverlay } from '@/components/activity/RecordingCountdownOverlay';
import { ReflectionModal } from '@/components/activity/ReflectionModal';
import { AppButton } from '@/components/ui/app-button';
import { StatCard } from '@/components/ui/stat-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACTIVITY_CATALOG } from '@/constants/activityCatalog';
import { SpacingScale } from '@/constants/theme';
import { useActivitySubmission } from '@/hooks/useActivitySubmission';
import {
  MOVEMENT_PHASES,
  MAX_STRETCH_ATTEMPTS,
  StretchAttemptResult,
  StretchLabState,
  buildAttemptResult,
  buildSubmissionPayload,
  createInitialStretchLabState,
  createStretchLabController,
  deltaToMillimeters,
  formatRecordingTime,
  validateFinalSubmission,
} from '@/services/humanPerformanceService';
import { useActivityStyles } from '@/hooks/use-activity-styles';
import { useTheme } from '@/hooks/use-theme';

export default function HumanPerformanceScreen() {
  const theme = useTheme();
  const activityStyles = useActivityStyles();

  const [activeTab, setActiveTab] = useState<ActivityTab>('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [labState, setLabState] = useState<StretchLabState>(createInitialStretchLabState());
  const [predictionInput, setPredictionInput] = useState('');
  const [attempts, setAttempts] = useState<StretchAttemptResult[]>([]);

  const controller = useMemo(() => createStretchLabController(setLabState), []);

  const submission = useActivitySubmission({
    activityId: 'human-performance',
    onSuccess: () => {
      setAttempts([]);
      setPredictionInput('');
      controller.preparePhase(0);
      setRefreshKey((key) => key + 1);
      setActiveTab('submission');
    },
  });

  useEffect(() => () => controller.dispose(), [controller]);

  const currentPhase = MOVEMENT_PHASES[labState.phaseIndex];
  const isLastPhase = labState.phaseIndex >= MOVEMENT_PHASES.length - 1;
  const allPhasesComplete = attempts.length >= MAX_STRETCH_ATTEMPTS;

  const handleStartAttempt = () => {
    if (!predictionInput.trim()) {
      Alert.alert('Prediction required', 'Enter your predicted phone vibration (absolute) before recording.');
      return;
    }
    controller.startCountdown();
  };

  const handleFinishRecording = () => {
    controller.finishRecording();
  };

  const handleResetPhase = () => {
    controller.resetPhaseToIdle();
  };

  const handleContinue = () => {
    const result = buildAttemptResult(
      labState.phaseIndex,
      predictionInput.trim(),
      labState.elapsedSec,
      labState.largestDelta,
      labState.vibrationEvents,
      labState.smoothnessScore,
    );

    setAttempts((current) => {
      const updated = [...current];
      updated[labState.phaseIndex] = result;
      return updated;
    });

    setPredictionInput('');

    if (isLastPhase) {
      controller.resetPhaseToIdle();
      return;
    }

    controller.advancePhase();
  };

  const handleSubmitAttempt = () => {
    const validation = validateFinalSubmission(attempts);
    if (!validation.ok) {
      Alert.alert('Incomplete attempt', validation.message ?? 'Complete all phases first.');
      return;
    }
    submission.requestSubmit(buildSubmissionPayload(attempts));
  };

  const overviewContent = <ActivityOverviewPanel activityId="human-performance" />;

  const activityContent = (
    <ThemedView style={styles.container}>
      <ActivitySection title={`Phase ${currentPhase.attemptNumber} — ${currentPhase.label}`}>
        <ThemedText type="body">{currentPhase.instruction}</ThemedText>
        <View style={styles.timerRow}>
          <ThemedText type="small" themeColor="textSecondary">
            {labState.recordingState === 'recording' || labState.recordingState === 'completed'
              ? 'Time elapsed'
              : 'Timer'}
          </ThemedText>
          <ThemedText type="title">{formatRecordingTime(labState.elapsedSec)}</ThemedText>
        </View>
      </ActivitySection>

      {labState.recordingState === 'idle' && !allPhasesComplete ? (
        <ActivitySection title="Prediction">
          <ThemedText type="small" themeColor="textSecondary">
            Predict phone vibration sensor reading (absolute), e.g. +/- 5 mm.
          </ThemedText>
          <TextInput
            value={predictionInput}
            onChangeText={setPredictionInput}
            placeholder="e.g. 5 mm"
            placeholderTextColor={theme.textSecondary}
            style={activityStyles.input}
          />
          <RecordCircleButton onPress={handleStartAttempt} />
        </ActivitySection>
      ) : null}

      {labState.recordingState === 'recording' ? (
        <RecordCircleButton label="Finish" onPress={handleFinishRecording} />
      ) : null}

      {labState.recordingState === 'recording' || labState.recordingState === 'completed' ? (
        <>
          <ActivitySection title="Live Metrics">
            <View style={styles.statsRow}>
              <StatCard label="Vibrations detected" value={String(labState.vibrationEvents)} />
              <StatCard label="Smoothness score" value={`${Math.round(labState.smoothnessScore)}%`} />
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              Largest movement: {deltaToMillimeters(labState.largestDelta)} mm
            </ThemedText>
          </ActivitySection>

          <ActivitySection title="Movement Monitor">
            <MovementSparkline values={labState.graphSamples} />
          </ActivitySection>
        </>
      ) : null}

      {labState.recordingState === 'completed' ? (
        <ActivitySection title="Phase complete">
          <ThemedText type="body">
            Outcome: {deltaToMillimeters(labState.largestDelta)} mm in {labState.elapsedSec} s
          </ThemedText>
          <AppButton
            label="Reset phase"
            onPress={handleResetPhase}
            variant="outline"
            style={{ marginTop: SpacingScale.sm }}
          />
          <AppButton
            label={isLastPhase ? 'Save phases' : 'Continue to next phase'}
            onPress={handleContinue}
            style={{ marginTop: SpacingScale.sm }}
          />
        </ActivitySection>
      ) : null}

      {attempts.length > 0 ? (
        <ActivitySection title="Current attempt">
          <HumanPerformanceResultsTable attempts={attempts} />
        </ActivitySection>
      ) : null}

      {allPhasesComplete ? (
        <ActivitySection title="Submit">
          <AppButton
            label="Submit attempt"
            onPress={handleSubmitAttempt}
            disabled={!submission.canSubmit}
          />
        </ActivitySection>
      ) : null}
    </ThemedView>
  );

  const submissionContent = (
    <ActivitySubmissionPanel activityId="human-performance" refreshKey={refreshKey} />
  );

  return (
    <>
      <ActivityLayout
        activityName="Human Performance Lab"
        overviewContent={overviewContent}
        activityContent={activityContent}
        submissionContent={submissionContent}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <RecordingCountdownOverlay
        visible={labState.recordingState === 'countdown'}
        countdown={labState.countdown}
      />

      <ReflectionModal
        visible={submission.modalVisible}
        activityName={ACTIVITY_CATALOG['human-performance'].label}
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
  timerRow: {
    marginTop: SpacingScale.sm,
    gap: SpacingScale.xxs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: SpacingScale.sm,
    flexWrap: 'wrap',
  },
});
