import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { SpacingScale } from '@/constants/theme';

export interface TrialRow {
  label: string;
  prediction: string;
  outcome: string;
  correct?: boolean | null;
}

interface TrialResultsTableProps {
  rows: TrialRow[];
  labelHeader?: string;
  predictionHeader?: string;
  outcomeHeader?: string;
  showCorrectColumn?: boolean;
}

export function TrialResultsTable({
  rows,
  labelHeader = 'Action',
  predictionHeader = 'Prediction',
  outcomeHeader = 'Outcome',
  showCorrectColumn = false,
}: TrialResultsTableProps) {
  const theme = useTheme();

  if (rows.length === 0) {
    return (
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        No trials recorded yet.
      </ThemedText>
    );
  }

  return (
    <View style={[styles.table, { borderColor: theme.border }]}>
      <View style={[styles.headerRow, { backgroundColor: theme.backgroundSelected }]}>
        <ThemedText type="captionBold" style={styles.colLabel}>
          {labelHeader}
        </ThemedText>
        <ThemedText type="captionBold" style={styles.colPred}>
          {predictionHeader}
        </ThemedText>
        <ThemedText type="captionBold" style={styles.colOutcome}>
          {outcomeHeader}
        </ThemedText>
        {showCorrectColumn ? (
          <ThemedText type="captionBold" style={styles.colCorrect}>
            Were you right?
          </ThemedText>
        ) : null}
      </View>
      {rows.map((row, index) => (
        <View
          key={`${row.label}-${index}`}
          style={[styles.dataRow, { borderTopColor: theme.border }]}
        >
          <ThemedText type="caption" style={styles.colLabel}>
            {row.label}
          </ThemedText>
          <ThemedText type="caption" style={[styles.colPred, { color: theme.textSecondary }]}>
            {row.prediction}
          </ThemedText>
          <ThemedText type="caption" style={styles.colOutcome}>
            {row.outcome}
          </ThemedText>
          {showCorrectColumn ? (
            <View style={styles.colCorrect}>
              {row.correct === null || row.correct === undefined ? (
                <ThemedText type="caption" themeColor="textSecondary">
                  —
                </ThemedText>
              ) : (
                <ThemedText
                  type="captionBold"
                  style={{ color: row.correct ? theme.success : theme.danger }}
                >
                  {row.correct ? 'Yes' : 'No'}
                </ThemedText>
              )}
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderRadius: SpacingScale.md,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    padding: SpacingScale.sm,
    gap: SpacingScale.xxs,
  },
  dataRow: {
    flexDirection: 'row',
    padding: SpacingScale.sm,
    borderTopWidth: 1,
    alignItems: 'flex-start',
    gap: SpacingScale.xxs,
  },
  colLabel: {
    flex: 0.9,
    minWidth: 0,
  },
  colPred: {
    flex: 1.1,
    minWidth: 0,
  },
  colOutcome: {
    flex: 1.1,
    minWidth: 0,
  },
  colCorrect: {
    flex: 0.7,
    minWidth: 0,
  },
});
