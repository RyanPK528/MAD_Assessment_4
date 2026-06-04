import { ActivitySection } from '@/components/activity/ActivitySection';
import { BreathingTrainerResultsTable } from '@/components/activity/BreathingTrainerResultsTable';
import { ThemedText } from '@/components/themed-text';
import { BreathingMemberAttempt } from '@/services/breathingTrainerService';
import { ActivityAttemptRecord } from '@/types/activityAttempt';

interface LegacySession {
  phase: string;
  bpm: number;
  breathCount: number;
}

function isMemberAttempt(value: unknown): value is BreathingMemberAttempt {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as BreathingMemberAttempt).memberName === 'string' &&
    Array.isArray((value as BreathingMemberAttempt).phases)
  );
}

export function BreathingTrainerAttemptResults({ attempt }: { attempt: ActivityAttemptRecord }) {
  const data = attempt.data as {
    memberAttempts?: unknown[];
    sessions?: LegacySession[];
  };

  if (Array.isArray(data.memberAttempts) && data.memberAttempts.length > 0 && isMemberAttempt(data.memberAttempts[0])) {
    const memberAttempts = data.memberAttempts as BreathingMemberAttempt[];

    return (
      <>
        {memberAttempts.map((member) => (
          <ActivitySection
            key={`member-${member.memberIndex}-${member.memberName}`}
            title={`${member.memberName} — Breathing results`}
          >
            <BreathingTrainerResultsTable phases={member.phases} />
          </ActivitySection>
        ))}
      </>
    );
  }

  if (Array.isArray(data.sessions) && data.sessions.length > 0) {
    return (
      <ActivitySection title="Recorded sessions">
        {data.sessions.map((session, index) => (
          <ThemedText key={`${session.phase}-${index}`} type="body">
            {session.phase}: {session.bpm} BPM ({session.breathCount} breaths)
          </ThemedText>
        ))}
      </ActivitySection>
    );
  }

  return (
    <ActivitySection title="Results">
      <ThemedText type="small" themeColor="textSecondary">
        No breathing data recorded for this attempt.
      </ThemedText>
    </ActivitySection>
  );
}
