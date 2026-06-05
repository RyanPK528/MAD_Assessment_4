import { StyleSheet, View } from 'react-native';

import { TrialResultsTable, TrialRow } from '@/components/activity/TrialResultsTable';
import { ThemedText } from '@/components/themed-text';
import { BreathingPhaseResult, formatBreathingOutcome } from '@/services/breathingTrainerService';
import { SpacingScale } from '@/constants/theme';

interface BreathingTrainerResultsTableProps {
  phases: BreathingPhaseResult[];
}

export function BreathingTrainerResultsTable({ phases }: BreathingTrainerResultsTableProps) {
  const rows: TrialRow[] = phases.map((phase) => ({
    label: phase.conditionLabel,
    prediction: phase.prediction,
    outcome: formatBreathingOutcome(phase.breathsPerMinute, phase.breathCount, phase.durationSec),
    correct: phase.wasCorrect,
  }));

  return (
    <View style={styles.wrapper}>
      <TrialResultsTable
        rows={rows}
        labelHeader="Condition"
        predictionHeader="Prediction"
        outcomeHeader="Outcome"
        showCorrectColumn
      />
      {phases.length > 0 ? (
        <ThemedText type="caption" themeColor="textSecondary" style={styles.note}>
          Sensor movement and breathing pattern data are saved with each phase recording.
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
