import { useEffect, useMemo, useState } from 'react';
import { Button, Pressable, StyleSheet, View } from 'react-native';

import { ActivityLayout, ActivityTab } from '@/components/activity/ActivityLayout';
import { ActivityOverviewPanel } from '@/components/activity/ActivityOverviewPanel';
import { ActivitySection } from '@/components/activity/ActivitySection';
import { ActivitySubmissionPanel } from '@/components/activity/ActivitySubmissionPanel';
import { ReflectionModal } from '@/components/activity/ReflectionModal';
import { createReactionBoardController, ReactionBoardState } from '@/services/reactionBoardService';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ACTIVITY_CATALOG } from '@/constants/activityCatalog';
import { Radii, SpacingScale } from '@/constants/theme';
import { useActivitySubmission } from '@/hooks/useActivitySubmission';
import { useActivityStyles } from '@/hooks/use-activity-styles';
import { useTheme } from '@/hooks/use-theme';

type ChallengePhase = 'tap' | 'swap' | 'tracing';

const PHASES: { id: ChallengePhase; label: string; hint: string }[] = [
  {
    id: 'tap',
    label: 'Phase 1 – Tap Reaction',
    hint: 'Tap the screen as soon as the hidden button appears. Rotate through each team member.',
  },
  {
    id: 'swap',
    label: 'Phase 2 – Swap Hands',
    hint: 'Repeat using your non-dominant hand and compare results. Rotate through each team member.',
  },
  {
    id: 'tracing',
    label: 'Phase 3 – Tracing Challenge',
    hint: 'Tap each waypoint in order to trace the moving shape. Review accuracy and delay.',
  },
];

const TRACE_WAYPOINTS = ['A', 'B', 'C', 'D', 'E'];

export default function ReactionBoardScreen() {
  const theme = useTheme();
  const activityStyles = useActivityStyles();
  const [activeTab, setActiveTab] = useState<ActivityTab>('overview');
  const [refreshKey, setRefreshKey] = useState(0);
  const [activePhase, setActivePhase] = useState<ChallengePhase>('tap');
  const [state, setState] = useState<ReactionBoardState>({
    stage: 'idle',
    reactionTimeMs: null,
    message: 'Tap to Start Challenge',
  });
  const [tapAttempts, setTapAttempts] = useState<number[]>([]);
  const [swapAttempts, setSwapAttempts] = useState<number[]>([]);
  const [traceStep, setTraceStep] = useState(0);
  const [traceStartMs, setTraceStartMs] = useState<number | null>(null);
  const [tracingAttempts, setTracingAttempts] = useState<{ totalMs: number; accuracy: number }[]>([]);

  const controller = useMemo(() => createReactionBoardController(setState), []);

  const submission = useActivitySubmission({
    activityId: 'reaction-board',
    onSuccess: () => {
      setTapAttempts([]);
      setSwapAttempts([]);
      setTracingAttempts([]);
      setTraceStep(0);
      setTraceStartMs(null);
      controller.startChallenge();
      setRefreshKey((key) => key + 1);
      setActiveTab('submission');
    },
  });

  useEffect(() => {
    controller.startChallenge();
    return () => controller.stop();
  }, [controller]);

  const handleTap = () => {
    const reactionTimeMs = controller.handleTap();
    if (reactionTimeMs !== null) {
      if (activePhase === 'tap') {
        setTapAttempts((current) => [reactionTimeMs, ...current].slice(0, 10));
      } else if (activePhase === 'swap') {
        setSwapAttempts((current) => [reactionTimeMs, ...current].slice(0, 10));
      }
    }
  };

  const handleTraceWaypoint = (index: number) => {
    if (index !== traceStep) {
      return;
    }

    if (traceStep === 0) {
      setTraceStartMs(Date.now());
    }

    const nextStep = traceStep + 1;
    if (nextStep >= TRACE_WAYPOINTS.length) {
      const totalMs = Date.now() - (traceStartMs ?? Date.now());
      const accuracy = 100;
      setTracingAttempts((current) => [{ totalMs, accuracy }, ...current].slice(0, 10));
      setTraceStep(0);
      setTraceStartMs(null);
      return;
    }

    setTraceStep(nextStep);
  };

  const hasResults = tapAttempts.length > 0 || swapAttempts.length > 0 || tracingAttempts.length > 0;

  const handleSubmit = () => {
    submission.requestSubmit({
      tapAttempts,
      swapAttempts,
      tracingAttempts,
    });
  };

  const getTapAreaBackgroundColor = () => {
    switch (state.stage) {
      case 'active':
        return '#22C55E';
      case 'tooSoon':
        return '#EF4444';
      default:
        return '#374151';
    }
  };

  const overviewContent = <ActivityOverviewPanel activityId="reaction-board" />;

  const activityContent = (
    <ThemedView style={styles.container}>
      <ActivitySection title="Challenge Phase">
        <View style={styles.phaseRow}>
          {PHASES.map((phase) => (
            <Pressable
              key={phase.id}
              onPress={() => {
                setActivePhase(phase.id);
                if (phase.id !== 'tracing') {
                  controller.startChallenge();
                } else {
                  setTraceStep(0);
                  setTraceStartMs(null);
                }
              }}
              style={[
                activityStyles.chip,
                activePhase === phase.id && activityStyles.chipActive,
              ]}
            >
              <ThemedText
                type="captionBold"
                style={{ color: activePhase === phase.id ? theme.onAccent : theme.textPrimary }}
              >
                {phase.label.replace('Phase ', 'P')}
              </ThemedText>
            </Pressable>
          ))}
        </View>
        <ThemedText type="body">{PHASES.find((p) => p.id === activePhase)?.hint}</ThemedText>
      </ActivitySection>

      {(activePhase === 'tap' || activePhase === 'swap') && (
        <>
          <ActivitySection title="Current Stage">
            <ThemedText type="body">Stage: {state.stage}</ThemedText>
            <ThemedText type="small">{state.message}</ThemedText>
            {state.reactionTimeMs !== null && state.stage === 'complete' && (
              <ThemedText type="body" style={{ marginTop: SpacingScale.sm }}>
                Reaction time: {state.reactionTimeMs} ms
              </ThemedText>
            )}
          </ActivitySection>
          <Pressable
            onPress={handleTap}
            style={[styles.tapArea, { backgroundColor: getTapAreaBackgroundColor() }]}
          >
            <ThemedText type="title" style={styles.tapText}>
              {activePhase === 'swap' ? `${state.message} (non-dominant hand)` : state.message}
            </ThemedText>
          </Pressable>
        </>
      )}

      {activePhase === 'tracing' && (
        <ActivitySection title="Tracing Challenge">
          <ThemedText type="body">Tap each waypoint in order to complete the trace.</ThemedText>
          <View style={styles.traceRow}>
            {TRACE_WAYPOINTS.map((label, index) => {
              const completed = index < traceStep;
              const active = index === traceStep;
              return (
                <Pressable
                  key={label}
                  onPress={() => handleTraceWaypoint(index)}
                  style={[
                    styles.traceNode,
                    {
                      borderColor: theme.border,
                      backgroundColor: completed ? theme.success : active ? theme.accent : theme.backgroundElement,
                    },
                  ]}
                >
                  <ThemedText type="captionBold" style={{ color: completed || active ? '#fff' : theme.textPrimary }}>
                    {label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
          {tracingAttempts[0] && (
            <ThemedText type="small">
              Last trace: {tracingAttempts[0].totalMs} ms, {tracingAttempts[0].accuracy}% accuracy
            </ThemedText>
          )}
        </ActivitySection>
      )}

      <ActivitySection title="Submit">
        <Button
          title="Submit attempt"
          onPress={handleSubmit}
          disabled={!submission.canSubmit || !hasResults}
        />
      </ActivitySection>
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
  phaseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SpacingScale.xs },
  tapArea: {
    minHeight: 200,
    marginTop: SpacingScale.sm,
    borderRadius: Radii.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapText: { color: '#FFFFFF', textAlign: 'center' },
  traceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SpacingScale.xs,
    marginTop: SpacingScale.sm,
  },
  traceNode: {
    width: 48,
    height: 48,
    borderRadius: Radii.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
