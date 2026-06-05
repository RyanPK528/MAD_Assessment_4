import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { AttemptCard } from '@/components/activity/AttemptCard';
import { EmptyAttemptsMessage } from '@/components/activity/EmptyAttemptsMessage';
import { AppButton } from '@/components/ui/app-button';
import { ThemedText } from '@/components/themed-text';
import { ActivityId } from '@/constants/activities';
import { SpacingScale } from '@/constants/theme';
import { useActivityAttempts } from '@/hooks/useActivityAttempts';
import { useTheme } from '@/hooks/use-theme';

interface AttemptListProps {
  activityId: ActivityId;
  refreshKey?: number;
}

export function AttemptList({ activityId, refreshKey = 0 }: AttemptListProps) {
  const theme = useTheme();
  const router = useRouter();
  const { attempts, loading, error, refresh } = useActivityAttempts(activityId);

  useEffect(() => {
    void refresh();
  }, [refreshKey, refresh]);

  if (loading && attempts.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <ThemedText type="small" style={{ color: theme.danger }}>
          {error}
        </ThemedText>
        <AppButton label="Retry" variant="outline" onPress={() => void refresh()} />
      </View>
    );
  }

  if (attempts.length === 0) {
    return (
      <EmptyAttemptsMessage message="No attempts submitted yet. Complete the activity and submit from the Activity tab." />
    );
  }

  return (
    <View style={styles.list} key={`attempt-list-${refreshKey}`}>
      {attempts.map((attempt) => (
        <AttemptCard
          key={attempt.attemptId}
          attempt={attempt}
          onPress={() =>
            router.push({
              pathname: '/activity/attempt/[attemptId]',
              params: { attemptId: attempt.attemptId, activityId },
            })
          }
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: SpacingScale.sm,
  },
  centered: {
    alignItems: 'center',
    gap: SpacingScale.sm,
    paddingVertical: SpacingScale.md,
  },
});
