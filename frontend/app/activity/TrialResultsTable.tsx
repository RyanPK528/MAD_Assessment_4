import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

export interface TrialRow {
  label: string;
  prediction: string;
  outcome: string;
  correct?: boolean | null;
}

interface TrialResultsTableProps {
  rows: TrialRow[];
  predictionHeader?: string;
  outcomeHeader?: string;
}

export function TrialResultsTable({
  rows,
  predictionHeader = 'Prediction',
  outcomeHeader = 'Outcome',
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
        <ThemedText type="smallBold" style={styles.colLabel}>
          Action
        </ThemedText>
        <ThemedText type="smallBold" style={styles.colPred}>
          {predictionHeader}
        </ThemedText>
        <ThemedText type="smallBold" style={styles.colOutcome}>
          {outcomeHeader}
        </ThemedText>
      </View>
      {rows.map((row, index) => (
        <View
          key={`${row.label}-${index}`}
          style={[styles.dataRow, { borderTopColor: theme.border }]}
        >
          <ThemedText type="small" style={styles.colLabel}>
            {row.label}
          </ThemedText>
          <ThemedText type="small" style={[styles.colPred, { color: theme.textSecondary }]}>
            {row.prediction}
          </ThemedText>
          <View style={styles.colOutcome}>
            <ThemedText type="small">{row.outcome}</ThemedText>
            {row.correct !== undefined && row.correct !== null && (
              <ThemedText
                type="small"
                style={{ color: row.correct ? theme.success : theme.danger }}
              >
                {row.correct ? 'Correct' : 'Incorrect'}
              </ThemedText>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    padding: Spacing.two,
  },
  dataRow: {
    flexDirection: 'row',
    padding: Spacing.two,
    borderTopWidth: 1,
    alignItems: 'flex-start',
  },
  colLabel: {
    flex: 1.2,
  },
  colPred: {
    flex: 1,
  },
  colOutcome: {
    flex: 1.2,
    gap: Spacing.one,
  },
});