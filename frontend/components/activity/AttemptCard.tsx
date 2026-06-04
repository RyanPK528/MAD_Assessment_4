import { Pressable, StyleSheet, View } from 'react-native';

import { AppCard } from '@/components/ui/app-card';
import { ThemedText } from '@/components/themed-text';
import { SpacingScale } from '@/constants/theme';
import { formatAttemptDateTime, truncateReflection } from '@/services/activityAttemptUtils';
import { ActivityAttemptRecord } from '@/types/activityAttempt';
import { useTheme } from '@/hooks/use-theme';

interface AttemptCardProps {
  attempt: ActivityAttemptRecord;
  onPress: () => void;
}

export function AttemptCard({ attempt, onPress }: AttemptCardProps) {
  const theme = useTheme();
  const preview = truncateReflection(attempt.reflection);
  const ratingLabel =
    attempt.selfRating >= 1 && attempt.selfRating <= 5
      ? `Rating: ${attempt.selfRating}/5`
      : 'Rating: —';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Attempt ${attempt.attemptNumber}, ${ratingLabel}`}
    >
      <AppCard style={styles.card}>
        <View style={styles.headerRow}>
          <ThemedText type="cardTitle">Attempt {attempt.attemptNumber}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {formatAttemptDateTime(attempt.completedAt)}
          </ThemedText>
        </View>
        <ThemedText type="captionBold" style={{ color: theme.accent }}>
          {ratingLabel}
        </ThemedText>
        {preview ? (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
            {preview}
          </ThemedText>
        ) : (
          <ThemedText type="small" themeColor="textSecondary">
            No reflection provided.
          </ThemedText>
        )}
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: SpacingScale.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SpacingScale.sm,
  },
});
