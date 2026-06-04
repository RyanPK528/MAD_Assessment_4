import { ActivitySection } from '@/components/activity/ActivitySection';
import { TrialResultsTable, TrialRow } from '@/components/activity/TrialResultsTable';
import { ThemedText } from '@/components/themed-text';
import { ReactionPhaseAggregate, ReactionPhaseResult } from '@/services/reactionBoardService';
import { ActivityAttemptRecord } from '@/types/activityAttempt';

function aggregateToRows(aggregate: ReactionPhaseAggregate): TrialRow[] {
  const memberRows: TrialRow[] = aggregate.memberTrials.map((trial) => ({
    label: trial.memberName,
    prediction: trial.prediction,
    outcome: trial.outcome,
    correct: trial.wasCorrect,
  }));

  memberRows.push({
    label: 'Group average',
    prediction: '—',
    outcome:
      aggregate.kind === 'tracing'
        ? `${aggregate.groupAverageAccuracyPercent ?? 0}% accuracy`
        : `${aggregate.groupAverageReactionMs ?? 0} ms`,
    correct: undefined,
  });

  return memberRows;
}

function isPhaseAggregate(value: unknown): value is ReactionPhaseAggregate {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as ReactionPhaseAggregate).memberTrials)
  );
}

export function ReactionBoardAttemptResults({ attempt }: { attempt: ActivityAttemptRecord }) {
  const data = attempt.data as {
    phases?: (ReactionPhaseAggregate | ReactionPhaseResult)[];
    tapAttempts?: number[];
    swapAttempts?: number[];
    tracingAttempts?: Array<{ totalMs: number; accuracy: number }>;
  };

  if (Array.isArray(data.phases) && data.phases.length > 0 && isPhaseAggregate(data.phases[0])) {
    const aggregates = data.phases as ReactionPhaseAggregate[];

    return (
      <>
        {aggregates.map((aggregate) => (
          <ActivitySection key={`phase-${aggregate.attemptNumber}`} title={`Phase ${aggregate.attemptNumber} — ${aggregate.phaseLabel}`}>
            <TrialResultsTable
              rows={aggregateToRows(aggregate)}
              labelHeader="Member"
              predictionHeader="Prediction"
              outcomeHeader="Outcome"
              showCorrectColumn
            />
          </ActivitySection>
        ))}
      </>
    );
  }

  if (Array.isArray(data.phases) && data.phases.length > 0) {
    const rows: TrialRow[] = (data.phases as ReactionPhaseResult[]).map((phase) => ({
      label: `Phase ${phase.attemptNumber}`,
      prediction: phase.prediction,
      outcome: phase.outcome,
      correct: phase.wasCorrect,
    }));

    return (
      <ActivitySection title="Results">
        <TrialResultsTable
          rows={rows}
          labelHeader="Phase"
          predictionHeader="Prediction"
          outcomeHeader="Outcome (time + movement)"
          showCorrectColumn
        />
      </ActivitySection>
    );
  }

  return (
    <>
      <ActivitySection title="Phase 1 – Tap Reaction">
        {(data.tapAttempts ?? []).length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">No tap results.</ThemedText>
        ) : (
          (data.tapAttempts ?? []).map((ms, index) => (
            <ThemedText key={`tap-${index}`} type="body">
              Trial {index + 1}: {ms} ms
            </ThemedText>
          ))
        )}
      </ActivitySection>

      <ActivitySection title="Phase 2 – Swap Hands">
        {(data.swapAttempts ?? []).length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">No swap-hand results.</ThemedText>
        ) : (
          (data.swapAttempts ?? []).map((ms, index) => (
            <ThemedText key={`swap-${index}`} type="body">
              Trial {index + 1}: {ms} ms
            </ThemedText>
          ))
        )}
      </ActivitySection>

      <ActivitySection title="Phase 3 – Tracing">
        {(data.tracingAttempts ?? []).length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">No tracing results.</ThemedText>
        ) : (
          (data.tracingAttempts ?? []).map((entry, index) => (
            <ThemedText key={`trace-${index}`} type="body">
              Trial {index + 1}: {entry.totalMs} ms, {entry.accuracy}% accuracy
            </ThemedText>
          ))
        )}
      </ActivitySection>
    </>
  );
}
