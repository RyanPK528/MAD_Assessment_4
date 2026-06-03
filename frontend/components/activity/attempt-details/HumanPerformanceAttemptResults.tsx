import { ActivitySection } from '@/components/activity/ActivitySection';
import { HumanPerformanceResultsTable } from '@/components/activity/HumanPerformanceResultsTable';
import { ThemedText } from '@/components/themed-text';
import { StretchAttemptResult } from '@/services/humanPerformanceService';
import { ActivityAttemptRecord } from '@/types/activityAttempt';

export function HumanPerformanceAttemptResults({ attempt }: { attempt: ActivityAttemptRecord }) {
  const payload = attempt.data as {
    attempts?: StretchAttemptResult[];
  };
  const phases = Array.isArray(payload.attempts) ? payload.attempts : [];

  if (phases.length === 0) {
    return (
      <ActivitySection title="Results">
        <ThemedText type="small" themeColor="textSecondary">
          No phase results available for this attempt.
        </ThemedText>
      </ActivitySection>
    );
  }

  return (
    <ActivitySection title="Results">
      <HumanPerformanceResultsTable attempts={phases} />
    </ActivitySection>
  );
}
