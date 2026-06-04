import { ActivitySection } from '@/components/activity/ActivitySection';
import { ThemedText } from '@/components/themed-text';
import { ActivityAttemptRecord } from '@/types/activityAttempt';

export function ReactionBoardAttemptResults({ attempt }: { attempt: ActivityAttemptRecord }) {
  const data = attempt.data as {
    tapAttempts?: number[];
    swapAttempts?: number[];
    tracingAttempts?: Array<{ totalMs: number; accuracy: number }>;
  };

  return (
    <>
      <ActivitySection title="Phase 1 – Tap Reaction">
        {(data.tapAttempts ?? []).length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">No tap results.</ThemedText>
        ) : (
          (data.tapAttempts ?? []).map((ms, index) => (
            <ThemedText key={`tap-${index}`} type="body">
              Trial {index + 1}: {ms} ms
            </ThemedText>
          ))
        )}
      </ActivitySection>

      <ActivitySection title="Phase 2 – Swap Hands">
        {(data.swapAttempts ?? []).length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">No swap-hand results.</ThemedText>
        ) : (
          (data.swapAttempts ?? []).map((ms, index) => (
            <ThemedText key={`swap-${index}`} type="body">
              Trial {index + 1}: {ms} ms
            </ThemedText>
          ))
        )}
      </ActivitySection>

      <ActivitySection title="Phase 3 – Tracing">
        {(data.tracingAttempts ?? []).length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary">No tracing results.</ThemedText>
        ) : (
          (data.tracingAttempts ?? []).map((entry, index) => (
            <ThemedText key={`trace-${index}`} type="body">
              Trial {index + 1}: {entry.totalMs} ms, {entry.accuracy}% accuracy
            </ThemedText>
          ))
        )}
      </ActivitySection>
    </>
  );
}

export function BreathingTrainerAttemptResults({ attempt }: { attempt: ActivityAttemptRecord }) {
  const data = attempt.data as {
    sessions?: Array<{ phase: string; bpm: number; breathCount?: number }>;
  };

  const sessions = Array.isArray(data.sessions) ? data.sessions : [];

  if (sessions.length === 0) {
    return (
      <ActivitySection title="Results">
        <ThemedText type="small" themeColor="textSecondary">
          No breathing sessions recorded for this attempt.
        </ThemedText>
      </ActivitySection>
    );
  }

  return (
    <ActivitySection title="Breathing Sessions">
      {sessions.map((session, index) => (
        <ThemedText key={`${session.phase}-${index}`} type="body">
          {session.phase}: {session.bpm} BPM{session.breathCount != null ? ` (${session.breathCount} breaths)` : ''}
        </ThemedText>
      ))}
    </ActivitySection>
  );
}
