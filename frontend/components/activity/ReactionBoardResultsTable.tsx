import { StyleSheet, View } from 'react-native';

import { TrialResultsTable, TrialRow } from '@/components/activity/TrialResultsTable';
import { ThemedText } from '@/components/themed-text';
import { ReactionPhaseAggregate } from '@/services/reactionBoardService';
import { SpacingScale } from '@/constants/theme';

interface ReactionBoardResultsTableProps {
  phases: ReactionPhaseAggregate[];
}

function aggregateToRows(aggregate: ReactionPhaseAggregate): TrialRow[] {
  const memberRows: TrialRow[] = aggregate.memberTrials.map((trial) => ({
    label: trial.memberName,
    prediction: trial.prediction,
    outcome: trial.outcome,
    correct: trial.wasCorrect,
  }));

  const averageRow: TrialRow = {
    label: 'Group average',
    prediction: '—',
    outcome:
      aggregate.kind === 'tracing'
        ? `${aggregate.groupAverageAccuracyPercent ?? 0}% accuracy`
        : `${aggregate.groupAverageReactionMs ?? 0} ms`,
    correct: undefined,
  };

  return [...memberRows, averageRow];
}

export function ReactionBoardResultsTable({ phases }: ReactionBoardResultsTableProps) {
  if (phases.length === 0) {
    return (
      <ThemedText type="small" themeColor="textSecondary">
        No phase results recorded yet.
      </ThemedText>
    );
  }

  return (
    <View style={styles.wrapper}>
      {phases.map((aggregate) => (
        <View key={`phase-${aggregate.attemptNumber}`} style={styles.phaseBlock}>
          <ThemedText type="captionBold" style={styles.phaseTitle}>
            Phase {aggregate.attemptNumber} — {aggregate.phaseLabel}
          </ThemedText>
          <TrialResultsTable
            rows={aggregateToRows(aggregate)}
            labelHeader="Member"
            predictionHeader="Prediction"
            outcomeHeader="Outcome"
            showCorrectColumn
          />
        </View>
      ))}
      <ThemedText type="caption" themeColor="textSecondary" style={styles.note}>
        Each phase includes one trial per team member plus a group average.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: SpacingScale.md,
  },
  phaseBlock: {
    gap: SpacingScale.xs,
  },
  phaseTitle: {
    marginBottom: SpacingScale.xxs,
  },
  note: {
    marginTop: SpacingScale.xxs,
  },
});
