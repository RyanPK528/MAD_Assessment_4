import { StyleSheet } from 'react-native';

import { ActivitySection } from '@/components/activity/ActivitySection';
import { ThemedText } from '@/components/themed-text';
import { SpacingScale } from '@/constants/theme';
import { ActivityAttemptRecord } from '@/types/activityAttempt';

export function AttemptReflectionSection({ attempt }: { attempt: ActivityAttemptRecord }) {
  return (
    <ActivitySection title="Reflection">
      <ThemedText type="body">
        Self-rating: {attempt.selfRating >= 1 ? `${attempt.selfRating}/5` : '—'}
      </ThemedText>
      <ThemedText type="body" style={styles.reflection}>
        {attempt.reflection || 'No reflection provided.'}
      </ThemedText>
    </ActivitySection>
  );
}

const styles = StyleSheet.create({
  reflection: {
    marginTop: SpacingScale.xs,
  },
});
