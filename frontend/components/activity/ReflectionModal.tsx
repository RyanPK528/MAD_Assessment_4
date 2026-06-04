import { useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppButton } from '@/components/ui/app-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Layout, Radii, SpacingScale } from '@/constants/theme';
import { useActivityStyles } from '@/hooks/use-activity-styles';
import { useTheme } from '@/hooks/use-theme';

interface ReflectionModalProps {
  visible: boolean;
  activityName: string;
  submitting?: boolean;
  errorMessage?: string | null;
  onConfirm: (selfRating: number, reflection: string) => void | Promise<void>;
  onCancel: () => void;
}

export function ReflectionModal({
  visible,
  activityName,
  submitting = false,
  errorMessage,
  onConfirm,
  onCancel,
}: ReflectionModalProps) {
  const theme = useTheme();
  const activityStyles = useActivityStyles();
  const [selfRating, setSelfRating] = useState('3');
  const [reflection, setReflection] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleConfirm = async () => {
    const rating = Number(selfRating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setLocalError('Please select a self-rating from 1 to 5.');
      return;
    }
    if (!reflection.trim()) {
      setLocalError('Please write a reflection for this attempt.');
      return;
    }
    setLocalError(null);
    await onConfirm(rating, reflection.trim());
  };

  const handleCancel = () => {
    if (submitting) {
      return;
    }
    setLocalError(null);
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <ThemedView style={[styles.card, { borderColor: theme.border }]}>
          <ThemedText type="sectionTitle">Submit attempt</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Rate and reflect on your {activityName} attempt before submitting.
          </ThemedText>

          <ThemedText type="captionBold" style={styles.label}>
            Self-rating (1–5)
          </ThemedText>
          <View style={styles.ratingRow}>
            {['1', '2', '3', '4', '5'].map((value) => (
              <Pressable
                key={value}
                onPress={() => setSelfRating(value)}
                style={[activityStyles.chip, selfRating === value && activityStyles.chipActive]}
              >
                <ThemedText
                  type="captionBold"
                  style={{ color: selfRating === value ? theme.onAccent : theme.textPrimary }}
                >
                  {value}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <ThemedText type="captionBold" style={styles.label}>
            Reflection
          </ThemedText>
          <TextInput
            value={reflection}
            onChangeText={setReflection}
            multiline
            placeholder="What did you learn from this attempt?"
            placeholderTextColor={theme.textSecondary}
            style={[activityStyles.input, activityStyles.multiline]}
          />

          {localError || errorMessage ? (
            <ThemedText type="small" style={{ color: theme.danger }}>
              {localError ?? errorMessage}
            </ThemedText>
          ) : null}

          <View style={styles.actions}>
            <AppButton label="Cancel" variant="outline" onPress={handleCancel} disabled={submitting} />
            <AppButton label="Submit attempt" onPress={handleConfirm} loading={submitting} disabled={submitting} />
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    padding: Layout.screenPadding,
  },
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: SpacingScale.lg,
    gap: SpacingScale.sm,
  },
  label: {
    marginTop: SpacingScale.xs,
  },
  ratingRow: {
    flexDirection: 'row',
    gap: SpacingScale.xs,
    flexWrap: 'wrap',
  },
  actions: {
    flexDirection: 'row',
    gap: SpacingScale.sm,
    marginTop: SpacingScale.sm,
  },
});
