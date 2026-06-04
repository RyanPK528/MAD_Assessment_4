import { ACTIVITY_IDS, ActivityId } from '@/constants/activities';

export interface ActivityAttemptConfig {
  /** When set, blocks new submissions after this count. Omit for unlimited. */
  maxAttempts?: number;
}

export const ACTIVITY_ATTEMPT_CONFIG: Record<ActivityId, ActivityAttemptConfig> =
  Object.fromEntries(ACTIVITY_IDS.map((id) => [id, {}])) as Record<ActivityId, ActivityAttemptConfig>;

export function getMaxAttempts(activityId: ActivityId): number | undefined {
  return ACTIVITY_ATTEMPT_CONFIG[activityId]?.maxAttempts;
}
