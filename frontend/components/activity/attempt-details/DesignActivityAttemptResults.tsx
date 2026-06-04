import { ActivitySection } from '@/components/activity/ActivitySection';
import { TrialResultsTable } from '@/components/activity/TrialResultsTable';
import { ThemedText } from '@/components/themed-text';
import { ActivityAttemptRecord } from '@/types/activityAttempt';

export function HandFanAttemptResults({ attempt }: { attempt: ActivityAttemptRecord }) {
  const data = attempt.data as {
    designs?: Array<{
      label: string;
      prediction: string;
      bendAngleDeg?: number;
      estimatedForceN?: number;
      distanceCm?: number;
    }>;
  };

  const designs = Array.isArray(data.designs) ? data.designs : [];

  if (designs.length === 0) {
    return (
      <ActivitySection title="Results">
        <ThemedText type="small" themeColor="textSecondary">
          No designs saved for this attempt.
        </ThemedText>
      </ActivitySection>
    );
  }

  return (
    <ActivitySection title="Design Results">
      <TrialResultsTable
        rows={designs.map((design) => ({
          label: design.label,
          prediction: design.prediction,
          outcome: `${design.bendAngleDeg ?? '—'}° bend, ${design.estimatedForceN ?? '—'} N @ ${design.distanceCm ?? '—'}cm`,
        }))}
      />
    </ActivitySection>
  );
}

export function EarthquakeAttemptResults({ attempt }: { attempt: ActivityAttemptRecord }) {
  const data = attempt.data as {
    designs?: Array<{
      label: string;
      prediction?: string;
      folds?: number;
      pillars?: number;
      maxDisplacementCm?: number;
      maxRotationDeg?: number;
    }>;
  };

  const designs = Array.isArray(data.designs) ? data.designs : [];

  if (designs.length === 0) {
    return (
      <ActivitySection title="Results">
        <ThemedText type="small" themeColor="textSecondary">
          No design results for this attempt.
        </ThemedText>
      </ActivitySection>
    );
  }

  return (
    <ActivitySection title="Design Results">
      <TrialResultsTable
        rows={designs.map((design) => ({
          label: design.label,
          prediction: design.prediction || `${design.folds ?? '—'} folds, ${design.pillars ?? '—'} pillars`,
          outcome: `${design.maxDisplacementCm?.toFixed(1) ?? '—'} cm / ${design.maxRotationDeg?.toFixed(1) ?? '—'}°`,
        }))}
      />
    </ActivitySection>
  );
}
