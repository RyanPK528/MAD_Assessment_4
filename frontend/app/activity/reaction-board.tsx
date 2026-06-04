import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, TextInput } from 'react-native';

import { ActivityLayout, ActivityTab } from '@/components/activity/ActivityLayout';
import { ActivityOverviewPanel } from '@/components/activity/ActivityOverviewPanel';
import { ActivitySection } from '@/components/activity/ActivitySection';
import { ActivitySubmissionPanel } from '@/components/activity/ActivitySubmissionPanel';
import { ReactionBoardResultsTable } from '@/components/activity/ReactionBoardResultsTable';
import { ReactionTapZone } from '@/components/activity/ReactionTapZone';
import { ReactionTracingZone } from '@/components/activity/ReactionTracingZone';
import { ReflectionModal } from '@/components/activity/ReflectionModal';
import { AppButton } from '@/components/ui/app-button';
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
  MAX_REACTION_PHASES,
  REACTION_PHASES,
  ReactionMemberTrial,
  ReactionPhaseAggregate,
  TapChallengeState,
  buildMemberTrial,
  buildPhaseAggregate,
  buildSubmissionPayload,
  createInitialTapChallengeState,
  createTapReactionController,
  getRunningGroupAverage,
  validateFinalSubmission,
} from '@/services/reactionBoardService';

const DEFAULT_TEAM_MEMBERS = ['Team member 1'];

export default function ReactionBoardScreen() {
  const theme = useTheme();
  const activityStyles = useActivityStyles();

  const [activeTab, setActiveTab] = useState<ActivityTab>('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [teamMembers, setTeamMembers] = useState<string[]>(DEFAULT_TEAM_MEMBERS);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [memberIndex, setMemberIndex] = useState(0);
  const [phaseAggregates, setPhaseAggregates] = useState<ReactionPhaseAggregate[]>([]);
  const [currentPhaseTrials, setCurrentPhaseTrials] = useState<ReactionMemberTrial[]>([]);
  const [predictionInput, setPredictionInput] = useState('');
  const [tapState, setTapState] = useState<TapChallengeState>(createInitialTapChallengeState());
  const [challengeActive, setChallengeActive] = useState(false);
  const [phaseComplete, setPhaseComplete] = useState(false);
  const [pendingReactionMs, setPendingReactionMs] = useState<number | null>(null);
  const [pendingTracing, setPendingTracing] = useState<{ accuracy: number; durationSec: number } | null>(
    null,
  );
  const [tracingSessionKey, setTracingSessionKey] = useState(0);

  const tapController = useMemo(() => createTapReactionController(setTapState), []);
  const previousTapStage = useRef(tapState.stage);

  const submission = useActivitySubmission({
    activityId: 'reaction-board',
    onSuccess: () => {
      setPhaseAggregates([]);
      setCurrentPhaseTrials([]);
      setPhaseIndex(0);
      setMemberIndex(0);
      setPredictionInput('');
      setChallengeActive(false);
      setPhaseComplete(false);
      setPendingReactionMs(null);
      setPendingTracing(null);
      tapController.resetToIdle();
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

  useEffect(() => () => tapController.dispose(), [tapController]);

  const currentPhase = REACTION_PHASES[phaseIndex];
  const isTracingPhase = currentPhase.kind === 'tracing';
  const isLastPhase = phaseIndex >= REACTION_PHASES.length - 1;
  const allPhasesComplete = phaseAggregates.length >= MAX_REACTION_PHASES;
  const currentMemberName = teamMembers[memberIndex] ?? `Member ${memberIndex + 1}`;
  const runningAverage = getRunningGroupAverage(phaseIndex, currentPhaseTrials);
  const showPredictionStep = !challengeActive && !phaseComplete && !allPhasesComplete;

  useEffect(() => {
    if (
      !isTracingPhase &&
      challengeActive &&
      !phaseComplete &&
      previousTapStage.current === 'tooSoon' &&
      tapState.stage === 'idle'
    ) {
      tapController.beginWaiting();
    }
    previousTapStage.current = tapState.stage;
  }, [tapState.stage, challengeActive, phaseComplete, isTracingPhase, tapController]);

  const resetMemberAttempt = () => {
    setChallengeActive(false);
    setPendingReactionMs(null);
    setPendingTracing(null);
    tapController.resetToIdle();
  };

  const resetCurrentPhase = () => {
    setCurrentPhaseTrials([]);
    setMemberIndex(0);
    setPredictionInput('');
    setPhaseComplete(false);
    resetMemberAttempt();
  };

  const advanceToNextMemberOrCompletePhase = (trial: ReactionMemberTrial) => {
    setCurrentPhaseTrials((current) => [...current, trial]);

    const isLastMember = memberIndex >= teamMembers.length - 1;
    if (isLastMember) {
      setPhaseComplete(true);
      setChallengeActive(false);
      return;
    }

    setMemberIndex((index) => index + 1);
    setPredictionInput('');
    resetMemberAttempt();
  };

  const recordMemberTrial = (
    reactionTimeMs?: number,
    accuracy?: number,
    durationSec?: number,
  ) => {
    const trial = buildMemberTrial(
      phaseIndex,
      currentMemberName,
      memberIndex,
      predictionInput.trim(),
      reactionTimeMs,
      accuracy,
      durationSec,
    );
    advanceToNextMemberOrCompletePhase(trial);
  };

  const handleStartChallenge = () => {
    if (!predictionInput.trim()) {
      Alert.alert('Prediction required', 'Enter your predicted reaction time or accuracy before starting.');
      return;
    }

    setPendingReactionMs(null);
    setPendingTracing(null);

    if (isTracingPhase) {
      setChallengeActive(true);
      setTracingSessionKey((key) => key + 1);
      return;
    }

    tapController.beginWaiting();
    setChallengeActive(true);
  };

  const handleTapZonePress = () => {
    tapController.handleZonePress();
  };

  const handleTargetPress = () => {
    const reactionMs = tapController.handleZonePress();
    if (reactionMs !== null) {
      setPendingReactionMs(reactionMs);
      recordMemberTrial(reactionMs);
    }
  };

  const handleTracingComplete = (accuracy: number, durationSec: number) => {
    setPendingTracing({ accuracy, durationSec });
    recordMemberTrial(undefined, accuracy, durationSec);
  };

  const handleResetPhase = () => {
    resetCurrentPhase();
  };

  const handleContinuePhase = () => {
    const aggregate = buildPhaseAggregate(phaseIndex, currentPhaseTrials);
    setPhaseAggregates((current) => {
      const updated = [...current];
      updated[phaseIndex] = aggregate;
      return updated;
    });

    resetCurrentPhase();

    if (!isLastPhase) {
      setPhaseIndex((index) => index + 1);
    }
  };

  const handleSubmitAttempt = () => {
    const validation = validateFinalSubmission(phaseAggregates, teamMembers.length);
    if (!validation.ok) {
      Alert.alert('Incomplete attempt', validation.message ?? 'Complete all phases first.');
      return;
    }
    submission.requestSubmit(buildSubmissionPayload(phaseAggregates));
  };

  const phaseCompleteAverageLabel = isTracingPhase ? 'Group average accuracy' : 'Group average reaction time';
  const phaseCompleteAverageValue = isTracingPhase
    ? `${getRunningGroupAverage(phaseIndex, currentPhaseTrials) ?? '0%'}`
    : `${getRunningGroupAverage(phaseIndex, currentPhaseTrials) ?? '0 ms'}`;

  const overviewContent = <ActivityOverviewPanel activityId="reaction-board" />;

  const activityContent = (
    <ThemedView style={styles.container}>
      <ActivitySection title={`Phase ${currentPhase.attemptNumber} — ${currentPhase.label}`}>
        <ThemedText type="body">{currentPhase.instruction}</ThemedText>
        {!phaseComplete ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.memberLabel}>
            Member {memberIndex + 1} of {teamMembers.length}: {currentMemberName}
          </ThemedText>
        ) : null}
      </ActivitySection>

      {showPredictionStep ? (
        <ActivitySection title="Prediction">
          <ThemedText type="small" themeColor="textSecondary">
            {isTracingPhase
              ? `Predict ${currentMemberName}'s tracing accuracy (percent), e.g. 80%.`
              : `Predict ${currentMemberName}'s reaction time in milliseconds, e.g. 350 ms.`}
          </ThemedText>
          <TextInput
            value={predictionInput}
            onChangeText={setPredictionInput}
            placeholder={isTracingPhase ? 'e.g. 80%' : 'e.g. 350 ms'}
            placeholderTextColor={theme.textSecondary}
            style={activityStyles.input}
          />
          <AppButton label="Start challenge" onPress={handleStartChallenge} style={styles.buttonGap} />
        </ActivitySection>
      ) : null}

      {!isTracingPhase && challengeActive ? (
        <ActivitySection title="Reaction Zone">
          <ReactionTapZone
            state={tapState}
            nonDominantHand={currentPhase.kind === 'tap-non-dominant'}
            onZonePress={handleTapZonePress}
            onTargetPress={handleTargetPress}
          />
          {pendingReactionMs !== null ? (
            <StatCard label="Reaction time" value={`${pendingReactionMs} ms`} />
          ) : null}
        </ActivitySection>
      ) : null}

      {isTracingPhase && challengeActive ? (
        <ActivitySection title="Tracing Zone">
          <ReactionTracingZone
            key={tracingSessionKey}
            active={challengeActive}
            onComplete={handleTracingComplete}
          />
        </ActivitySection>
      ) : null}

      {runningAverage && currentPhaseTrials.length > 0 && !phaseComplete ? (
        <ActivitySection title="Group progress">
          <StatCard
            label={isTracingPhase ? 'Running average accuracy' : 'Running average reaction time'}
            value={runningAverage}
          />
          <ThemedText type="small" themeColor="textSecondary">
            {currentPhaseTrials.length} of {teamMembers.length} member(s) completed this phase.
          </ThemedText>
        </ActivitySection>
      ) : null}

      {phaseComplete ? (
        <ActivitySection title="Phase complete">
          <ThemedText type="body">All team members have completed this phase.</ThemedText>
          <StatCard label={phaseCompleteAverageLabel} value={phaseCompleteAverageValue} />
          <AppButton
            label="Reset phase"
            onPress={handleResetPhase}
            variant="outline"
            style={styles.buttonGap}
          />
          <AppButton
            label={isLastPhase ? 'Save phases' : 'Continue to next phase'}
            onPress={handleContinuePhase}
            style={styles.buttonGap}
          />
        </ActivitySection>
      ) : null}

      {phaseAggregates.length > 0 || currentPhaseTrials.length > 0 ? (
        <ActivitySection title="Current attempt">
          <ReactionBoardResultsTable
            phases={
              phaseComplete
                ? [...phaseAggregates, buildPhaseAggregate(phaseIndex, currentPhaseTrials)]
                : phaseAggregates
            }
          />
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
    <ActivitySubmissionPanel activityId="reaction-board" refreshKey={refreshKey} />
  );

  return (
    <>
      <ActivityLayout
        activityName="Reaction Board Challenge"
        overviewContent={overviewContent}
        activityContent={activityContent}
        submissionContent={submissionContent}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <ReflectionModal
        visible={submission.modalVisible}
        activityName={ACTIVITY_CATALOG['reaction-board'].label}
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
  memberLabel: { marginTop: SpacingScale.sm },
  buttonGap: { marginTop: SpacingScale.sm },
});
