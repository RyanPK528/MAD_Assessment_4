import type { ReactNode } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Layout, Radii, SpacingScale, getShadowStyle } from '@/constants/theme';
import { useActivityStyles } from '@/hooks/use-activity-styles';
import { useTheme } from '@/hooks/use-theme';

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
  labelPlaceholder?: string;
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
  labelPlaceholder = 'Design description',
  children,
}: DesignTrialCardProps) {
  const theme = useTheme();
  const activityStyles = useActivityStyles();

  return (
    <ThemedView
      style={[
        styles.card,
        {
          borderColor: theme.border,
          backgroundColor: theme.surface,
          ...getShadowStyle('sm', theme.shadow),
        },
      ]}>
      <ThemedText type="subtitle">{title}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Design label
      </ThemedText>
      <TextInput
        value={label}
        onChangeText={onLabelChange}
        placeholder={labelPlaceholder}
        placeholderTextColor={theme.textSecondary}
        style={activityStyles.input}
      />
      <ThemedText type="small" themeColor="textSecondary">
        Prediction
      </ThemedText>
      <TextInput
        value={prediction}
        onChangeText={onPredictionChange}
        placeholder="What do you expect?"
        placeholderTextColor={theme.textSecondary}
        style={activityStyles.input}
      />
      {onNotesChange && (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            Notes
          </ThemedText>
          <TextInput
            value={notes}
            onChangeText={onNotesChange}
            placeholder="Observations..."
            placeholderTextColor={theme.textSecondary}
            multiline
            style={[activityStyles.input, activityStyles.multiline]}
          />
        </>
      )}
      {children}
      {onSave && (
        <View style={styles.buttonRow}>
          <AppButton label="Save trial" onPress={onSave} disabled={saveDisabled} />
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Layout.cardPadding,
    borderRadius: Radii.xl,
    borderWidth: 1,
    gap: SpacingScale.sm,
  },
  buttonRow: {
    marginTop: SpacingScale.xs,
  },
});
