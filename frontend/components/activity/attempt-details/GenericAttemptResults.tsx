import { ActivitySection } from '@/components/activity/ActivitySection';
import { ThemedText } from '@/components/themed-text';
import { ActivityAttemptRecord } from '@/types/activityAttempt';

export function GenericAttemptResults({ attempt }: { attempt: ActivityAttemptRecord }) {
  return (
    <ActivitySection title="Results">
      <ThemedText type="small" themeColor="textSecondary">
        {JSON.stringify(attempt.data, null, 2)}
      </ThemedText>
    </ActivitySection>
  );
}
