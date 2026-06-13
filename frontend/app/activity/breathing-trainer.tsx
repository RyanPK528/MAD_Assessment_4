import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { ActivityLayout, ActivityTab } from '@/components/activity/ActivityLayout';
import { ActivityOverviewPanel } from '@/components/activity/ActivityOverviewPanel';
import { ActivitySection } from '@/components/activity/ActivitySection';
import { ActivitySubmissionPanel } from '@/components/activity/ActivitySubmissionPanel';
import { BreathingTrainerResultsTable } from '@/components/activity/BreathingTrainerResultsTable';
import { MovementSparkline } from '@/components/activity/MovementSparkline';
import { RecordCircleButton } from '@/components/activity/RecordCircleButton';
import { RecordingCountdownOverlay } from '@/components/activity/RecordingCountdownOverlay';
import { ReflectionModal } from '@/components/activity/ReflectionModal';
import { AppButton } from '@/components/ui/app-button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { StatCard } from '@/components/ui/stat-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACTIVITY_CATALOG } from '@/constants/activityCatalog';
import { SpacingScale } from '@/constants/theme';
import { getFirebaseAuth } from '@/config/firebaseNative';
import { useActivitySubmission } from '@/hooks/useActivitySubmission';
import { useActivityStyles } from '@/hooks/use-activity-styles';
import { useTheme } from '@/hooks/use-theme';
import { getUserProfile } from '@/services/authService';
import {
  BREATHING_PHASES,
  BreathingLabState,
  BreathingMemberAttempt,
  BreathingPhaseResult,
  buildMemberAttempt,
  buildPhaseResult,
  buildSubmissionPayload,
  createBreathingTrainerController,
  createInitialBreathingLabState,
  formatBreathingOutcome,
  formatRecordingTime,
  getOverallProgress,
  MAX_BREATHING_PHASES,
  RECORDING_DURATION_SEC,
  validateFinalSubmission,
} from '@/services/breathingTrainerService';
import { isMonitoringPanelVisible } from '@/utils/recordingUi';

const DEFAULT_TEAM_MEMBERS = ['Team member 1'];

export default function BreathingTrainerScreen() {
  const theme = useTheme();
  const activityStyles = useActivityStyles();

  const [activeTab, setActiveTab] = useState<ActivityTab>('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [teamMembers, setTeamMembers] = useState<string[]>(DEFAULT_TEAM_MEMBERS);
  const [memberIndex, setMemberIndex] = useState(0);
  const [memberAttempts, setMemberAttempts] = useState<BreathingMemberAttempt[]>([]);
  const [currentMemberPhases, setCurrentMemberPhases] = useState<BreathingPhaseResult[]>([]);
  const [pendingPhaseResult, setPendingPhaseResult] = useState<BreathingPhaseResult | null>(null);
  const [predictionInput, setPredictionInput] = useState('');
  const [labState, setLabState] = useState<BreathingLabState>(createInitialBreathingLabState());
  const [activityComplete, setActivityComplete] = useState(false);

  const controller = useMemo(() => createBreathingTrainerController(setLabState), []);
  const pendingCaptureRef = useRef(false);

  const submission = useActivitySubmission({
    activityId: 'breathing-trainer',
    onSuccess: () => {
      setMemberAttempts([]);
      setCurrentMemberPhases([]);
      setMemberIndex(0);
      setPredictionInput('');
      setPendingPhaseResult(null);
      setActivityComplete(false);
      pendingCaptureRef.current = false;
      controller.preparePhase(0);
      setRefreshKey((key) => key + 1);
      setActiveTab('submission');
    },
  });

  useEffect(() => {
    void (async () => {
      const user = getFirebaseAuth().currentUser;
      if (!user) {
        return;
      }
      const profile = await getUserProfile(user.uid);
      if (profile?.memberFirstNames?.length) {
        setTeamMembers(profile.memberFirstNames);
      }
    })();
  }, []);

  useEffect(() => () => controller.dispose(), [controller]);

  const currentMemberName = teamMembers[memberIndex] ?? `Member ${memberIndex + 1}`;
  const currentPhase = BREATHING_PHASES[labState.phaseIndex];
  const isLastPhaseForMember = labState.phaseIndex >= BREATHING_PHASES.length - 1;
  const isLastMember = memberIndex >= teamMembers.length - 1;
  const overallProgress = getOverallProgress(memberAttempts, currentMemberPhases, teamMembers.length);
  const progressPercent =
    overallProgress.total > 0
      ? Math.round((overallProgress.completed / overallProgress.total) * 100)
      : 0;

  useEffect(() => {
    if (labState.recordingState !== 'completed' || pendingPhaseResult !== null) {
      if (labState.recordingState === 'idle') {
        pendingCaptureRef.current = false;
      }
      return;
    }

    if (pendingCaptureRef.current) {
      return;
    }

    pendingCaptureRef.current = true;
    const metrics = controller.getRecordingMetrics();
    setPendingPhaseResult(buildPhaseResult(labState.phaseIndex, predictionInput.trim(), metrics));
  }, [controller, labState.phaseIndex, labState.recordingState, pendingPhaseResult, predictionInput]);

  const handleStartRecording = () => {
    if (!predictionInput.trim()) {
      Alert.alert('Prediction required', 'Enter your predicted breaths per minute before recording.');
      return;
    }
    pendingCaptureRef.current = false;
    setPendingPhaseResult(null);
    controller.startCountdown();
  };

  const handleResetPhase = () => {
    pendingCaptureRef.current = false;
    setPendingPhaseResult(null);
    controller.resetPhaseToIdle();
  };

  const handleContinuePhase = () => {
    if (!pendingPhaseResult) {
      return;
    }

    const updatedPhases = [...currentMemberPhases, pendingPhaseResult];
    setPendingPhaseResult(null);
    pendingCaptureRef.current = false;

    if (isLastPhaseForMember) {
      const memberAttempt = buildMemberAttempt(currentMemberName, memberIndex, updatedPhases);
      setMemberAttempts((current) => [...current, memberAttempt]);
      setCurrentMemberPhases([]);

      if (isLastMember) {
        setActivityComplete(true);
        controller.preparePhase(0);
        return;
      }

      setMemberIndex((index) => index + 1);
      setPredictionInput('');
      controller.preparePhase(0);
      return;
    }

    setCurrentMemberPhases(updatedPhases);
    setPredictionInput('');
    controller.preparePhase(labState.phaseIndex + 1);
  };

  const handleSubmitAttempt = () => {
    const validation = validateFinalSubmission(memberAttempts, teamMembers.length);
    if (!validation.ok) {
      Alert.alert('Incomplete attempt', validation.message ?? 'Complete all members and phases first.');
      return;
    }
    submission.requestSubmit(buildSubmissionPayload(memberAttempts));
  };

  const usePlaceholderMetrics = labState.recordingState === 'countdown';

  const showPrediction =
    labState.recordingState === 'idle' && !activityComplete && pendingPhaseResult === null;

  const showLiveMonitoring =
    isMonitoringPanelVisible(labState.recordingState) &&
    !activityComplete &&
    pendingPhaseResult === null;

  const overviewContent = <ActivityOverviewPanel activityId="breathing-trainer" />;

  const activityContent = (
    <ThemedView style={styles.container}>
      <ActivitySection title="Progress">
        <ThemedText type="body">
          Member {memberIndex + 1} of {teamMembers.length}: {currentMemberName}
        </ThemedText>
        {!activityComplete ? (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              Phase {labState.phaseIndex + 1} of {MAX_BREATHING_PHASES} — {currentPhase.label}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Overall progress: {overallProgress.completed} / {overallProgress.total} phase recordings completed
            </ThemedText>
            <ProgressBar value={progressPercent} label="Team progress" />
          </>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            All team members have completed every phase. Submit your team attempt below.
          </ThemedText>
        )}
      </ActivitySection>

      {!activityComplete && pendingPhaseResult === null ? (
        <ActivitySection title={`Phase ${currentPhase.attemptNumber} — ${currentPhase.label}`}>
          <ThemedText type="body">{currentPhase.instruction}</ThemedText>
          <View style={styles.timerRow}>
            <ThemedText type="small" themeColor="textSecondary">
              {labState.recordingState === 'countdown'
                ? 'Get ready'
                : labState.recordingState === 'processing'
                  ? 'Analyzing breath signal'
                  : labState.recordingState === 'recording' || labState.recordingState === 'completed'
                    ? 'Time remaining'
                    : 'Recording duration'}
            </ThemedText>
            <ThemedText type="title">
              {labState.recordingState === 'recording' || labState.recordingState === 'completed'
                ? formatRecordingTime(Math.max(0, RECORDING_DURATION_SEC - labState.elapsedSec))
                : formatRecordingTime(RECORDING_DURATION_SEC)}
            </ThemedText>
          </View>
        </ActivitySection>
      ) : null}

      {showPrediction ? (
        <ActivitySection title="Prediction">
          <ThemedText type="small" themeColor="textSecondary">
            Predict breathing per minute before recording (e.g. 18 bpm).
          </ThemedText>
          <TextInput
            value={predictionInput}
            onChangeText={setPredictionInput}
            placeholder="e.g. 18 bpm"
            placeholderTextColor={theme.textSecondary}
            keyboardType="numeric"
            style={activityStyles.input}
          />
          <RecordCircleButton onPress={handleStartRecording} />
        </ActivitySection>
      ) : null}

      {showLiveMonitoring ? (
        <>
          {labState.recordingState === 'processing' ? (
            <ActivitySection title="Analyzing">
              <ThemedText type="body">Analyzing breathing signal…</ThemedText>
            </ActivitySection>
          ) : (
            <>
              <ActivitySection title="Live metrics">
                <StatCard
                  label="Breaths recorded"
                  value={String(usePlaceholderMetrics ? 0 : labState.breathCount)}
                />
              </ActivitySection>

              <ActivitySection title="Breathing monitor">
                <MovementSparkline
                  values={usePlaceholderMetrics ? [] : labState.centeredSignal.map(Math.abs)}
                />
              </ActivitySection>
            </>
          )}
        </>
      ) : null}

      {pendingPhaseResult ? (
        <ActivitySection title="Phase complete">
          <ThemedText type="body">
            {currentMemberName} — {pendingPhaseResult.conditionLabel}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Prediction: {pendingPhaseResult.prediction}
          </ThemedText>
          <ThemedText type="body">
            Outcome:{' '}
            {formatBreathingOutcome(
              pendingPhaseResult.breathsPerMinute,
              pendingPhaseResult.breathCount,
              pendingPhaseResult.durationSec,
            )}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Sensor movement: peak {pendingPhaseResult.sensorMovementSummary.peakAmplitude.toFixed(3)},{' '}
            {pendingPhaseResult.sensorMovementSummary.sampleCount} samples
          </ThemedText>
          <AppButton
            label="Reset phase"
            variant="outline"
            onPress={handleResetPhase}
            style={styles.actionButton}
          />
          <AppButton
            label={isLastPhaseForMember && isLastMember ? 'Save member results' : 'Continue to next phase'}
            onPress={handleContinuePhase}
            style={styles.actionButton}
          />
        </ActivitySection>
      ) : null}

      {currentMemberPhases.length > 0 ? (
        <ActivitySection title={`${currentMemberName} — current results`}>
          <BreathingTrainerResultsTable phases={currentMemberPhases} />
        </ActivitySection>
      ) : null}

      {memberAttempts.length > 0 ? (
        <ActivitySection title="Completed members">
          {memberAttempts.map((member) => (
            <View key={`${member.memberIndex}-${member.memberName}`} style={styles.memberBlock}>
              <ThemedText type="captionBold">{member.memberName}</ThemedText>
              <BreathingTrainerResultsTable phases={member.phases} />
            </View>
          ))}
        </ActivitySection>
      ) : null}

      {activityComplete ? (
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

      <RecordingCountdownOverlay
        visible={labState.recordingState === 'countdown'}
        countdown={labState.countdown}
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
  timerRow: {
    marginTop: SpacingScale.sm,
    gap: SpacingScale.xxs,
  },
  actionButton: {
    marginTop: SpacingScale.sm,
  },
  memberBlock: {
    gap: SpacingScale.xs,
    marginBottom: SpacingScale.sm,
  },
});
