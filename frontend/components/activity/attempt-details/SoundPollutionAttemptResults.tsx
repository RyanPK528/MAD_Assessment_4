import { ActivitySection } from '@/components/activity/ActivitySection';
import { TrialResultsTable } from '@/components/activity/TrialResultsTable';
import { ThemedText } from '@/components/themed-text';
import { classifyRisk, getRiskLabel } from '@/services/soundPollutionService';
import { ActivityAttemptRecord } from '@/types/activityAttempt';

export function SoundPollutionAttemptResults({ attempt }: { attempt: ActivityAttemptRecord }) {
  const data = attempt.data as {
    actions?: Array<{ label: string; prediction: string; measuredDb: number; riskLevel?: string }>;
    zones?: Array<{ label: string; lat?: number; lng?: number; db?: number }>;
  };

  const actions = Array.isArray(data.actions) ? data.actions : [];

  return (
    <>
      {actions.length > 0 ? (
        <ActivitySection title="Logged Actions">
          <TrialResultsTable
            predictionHeader="Predicted"
            outcomeHeader="Measured (dB)"
            rows={actions.map((action) => ({
              label: action.label,
              prediction: action.prediction,
              outcome: `${action.measuredDb} dB — ${getRiskLabel(action.riskLevel ?? classifyRisk(action.measuredDb))}`,
            }))}
          />
        </ActivitySection>
      ) : (
        <ActivitySection title="Results">
          <ThemedText type="small" themeColor="textSecondary">
            No actions logged for this attempt.
          </ThemedText>
        </ActivitySection>
      )}

      {Array.isArray(data.zones) && data.zones.length > 0 ? (
        <ActivitySection title="Zone Map">
          {data.zones.map((zone, index) => (
            <ThemedText key={`${zone.label}-${index}`} type="small" themeColor="textSecondary">
              {zone.label}: {zone.db ?? '—'} dB @ {zone.lat?.toFixed(3) ?? '?'}, {zone.lng?.toFixed(3) ?? '?'}
            </ThemedText>
          ))}
        </ActivitySection>
      ) : null}
    </>
  );
}
