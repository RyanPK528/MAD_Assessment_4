import type { ReactNode } from 'react';
import { Button, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

interface DesignTrialCardProps {
  title: string;
  label: string;
  onLabelChange: (value: string) => void;
  prediction: string;
  onPredictionChange: (value: string) => void;
  notes?: string;
  onNotesChange?: (value: string) => void;
  onSave?: () => void;
  saveDisabled?: boolean;
  children?: ReactNode;
}

export function DesignTrialCard({
  title,
  label,
  onLabelChange,
  prediction,
  onPredictionChange,
  notes = '',
  onNotesChange,
  onSave,
  saveDisabled = false,
  children,
}: DesignTrialCardProps) {
  const theme = useTheme();

  return (
    <ThemedView style={[styles.card, { borderColor: theme.border, backgroundColor: theme.surface }]}>
      <ThemedText type="subtitle">{title}</ThemedText>
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        Design label
      </ThemedText>
      <TextInput
        value={label}
        onChangeText={onLabelChange}
        placeholder="e.g. No parachute (baseline)"
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
      />
      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        Prediction
      </ThemedText>
      <TextInput
        value={prediction}
        onChangeText={onPredictionChange}
        placeholder="What do you expect?"
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
      />
      {onNotesChange && (
        <>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Notes
          </ThemedText>
          <TextInput
            value={notes}
            onChangeText={onNotesChange}
            placeholder="Observations..."
            placeholderTextColor={theme.textSecondary}
            multiline
            style={[styles.input, styles.notes, { color: theme.textPrimary, borderColor: theme.border }]}
          />
        </>
      )}
      {children}
      {onSave && (
        <View style={styles.buttonRow}>
          <Button title="Save trial" onPress={onSave} disabled={saveDisabled} />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.four,
    borderRadius: Spacing.three,
    borderWidth: 1,
    gap: Spacing.two,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.two,
    fontSize: 16,
  },
  notes: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  buttonRow: {
    marginTop: Spacing.two,
  },
});
