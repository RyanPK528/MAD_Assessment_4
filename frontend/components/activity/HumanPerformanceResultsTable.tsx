import { StyleSheet, View } from 'react-native';

import { TrialResultsTable, TrialRow } from '@/components/activity/TrialResultsTable';
import { ThemedText } from '@/components/themed-text';
import { StretchAttemptResult, formatOutcome } from '@/services/humanPerformanceService';
import { SpacingScale } from '@/constants/theme';

interface HumanPerformanceResultsTableProps {
  attempts: StretchAttemptResult[];
}

export function HumanPerformanceResultsTable({ attempts }: HumanPerformanceResultsTableProps) {
  const rows: TrialRow[] = attempts.map((attempt) => ({
    label: `Phase ${attempt.attemptNumber}`,
    prediction: attempt.prediction,
    outcome: formatOutcome(attempt.durationSec, attempt.largestMovementMm),
    correct: attempt.wasCorrect,
  }));

  return (
    <View style={styles.wrapper}>
      <TrialResultsTable
        rows={rows}
        labelHeader="Phase"
        predictionHeader="Predict vibration (absolute)"
        outcomeHeader="Outcome (time + movement)"
        showCorrectColumn
      />
      {attempts.length > 0 ? (
        <ThemedText type="caption" themeColor="textSecondary" style={styles.note}>
          Smoothness and vibration counts are saved with each phase submission.
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: SpacingScale.sm,
  },
  note: {
    marginTop: SpacingScale.xxs,
  },
});
