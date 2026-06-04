import { ActivityId } from '@/constants/activities';
import { ActivityAttemptRecord, RawActivityResultEntry } from '@/types/activityAttempt';

const LEGACY_REFLECTION_PATTERN = /^Self-rating:\s*(\d)\/5\s*\|\s*(.*)$/s;

export function parseLegacyReflection(reflection?: string): {
  selfRating: number | null;
  reflectionText: string;
} {
  if (!reflection?.trim()) {
    return { selfRating: null, reflectionText: '' };
  }

  const match = reflection.trim().match(LEGACY_REFLECTION_PATTERN);
  if (!match) {
    return { selfRating: null, reflectionText: reflection.trim() };
  }

  const rating = Number(match[1]);
  return {
    selfRating: rating >= 1 && rating <= 5 ? rating : null,
    reflectionText: match[2]?.trim() ?? '',
  };
}

export function buildSyntheticAttemptId(activityId: string, completedAt: string): string {
  const input = `${activityId}:${completedAt}`;
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `legacy-${Math.abs(hash).toString(36)}`;
}

function isActivityId(value: string): value is ActivityId {
  return [
    'parachute-drop',
    'sound-pollution',
    'hand-fan',
    'earthquake-structure',
    'human-performance',
    'reaction-board',
    'breathing-trainer',
  ].includes(value);
}

export function normalizeRawResultEntry(
  raw: RawActivityResultEntry,
  fallbackAttemptNumber: number,
): ActivityAttemptRecord | null {
  if (!raw.activityId || !isActivityId(raw.activityId)) {
    return null;
  }

  const completedAt =
    typeof raw.completedAt === 'string' && raw.completedAt
      ? raw.completedAt
      : new Date(0).toISOString();

  const legacy = parseLegacyReflection(raw.reflection);
  const selfRating =
    typeof raw.selfRating === 'number' && raw.selfRating >= 1 && raw.selfRating <= 5
      ? raw.selfRating
      : legacy.selfRating ?? 0;

  const reflection =
    typeof raw.reflection === 'string' && raw.selfRating !== undefined
      ? raw.reflection.trim()
      : legacy.reflectionText || raw.reflection?.trim() || '';

  return {
    attemptId:
      typeof raw.attemptId === 'string' && raw.attemptId
        ? raw.attemptId
        : buildSyntheticAttemptId(raw.activityId, completedAt),
    activityId: raw.activityId,
    attemptNumber:
      typeof raw.attemptNumber === 'number' && raw.attemptNumber > 0
        ? raw.attemptNumber
        : fallbackAttemptNumber,
    completedAt,
    selfRating,
    reflection,
    submittedBy: typeof raw.submittedBy === 'string' ? raw.submittedBy : '',
    data: raw.data && typeof raw.data === 'object' ? raw.data : {},
    syncedAt: raw.syncedAt,
    latitude: raw.latitude ?? null,
    longitude: raw.longitude ?? null,
  };
}

export function normalizeActivityAttempts(
  rawResults: unknown[],
  activityId: ActivityId,
): ActivityAttemptRecord[] {
  const filtered = rawResults
    .filter(
      (entry): entry is RawActivityResultEntry =>
        !!entry &&
        typeof entry === 'object' &&
        (entry as RawActivityResultEntry).activityId === activityId,
    )
    .sort((a, b) => {
      const aTime = a.completedAt ?? '';
      const bTime = b.completedAt ?? '';
      return aTime.localeCompare(bTime);
    });

  const normalized = filtered.map((entry, index) =>
    normalizeRawResultEntry(entry, index + 1),
  );

  const valid = normalized.filter((entry): entry is ActivityAttemptRecord => entry !== null);

  // Re-assign attempt numbers chronologically for legacy records missing attemptNumber
  return valid
    .map((entry, index) => ({
      ...entry,
      attemptNumber: entry.attemptNumber > 0 ? entry.attemptNumber : index + 1,
    }))
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

export function getNextAttemptNumber(attempts: ActivityAttemptRecord[]): number {
  if (attempts.length === 0) {
    return 1;
  }
  const maxNumber = Math.max(...attempts.map((entry) => entry.attemptNumber));
  return maxNumber + 1;
}

export function validateAttemptSubmission(selfRating: number, reflection: string): {
  ok: boolean;
  message?: string;
} {
  if (!Number.isInteger(selfRating) || selfRating < 1 || selfRating > 5) {
    return { ok: false, message: 'Please select a self-rating from 1 to 5.' };
  }

  if (!reflection.trim()) {
    return { ok: false, message: 'Please write a reflection for this attempt.' };
  }

  return { ok: true };
}

export function truncateReflection(text: string, maxLength = 120): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength).trim()}…`;
}

export function formatAttemptDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return iso;
  }
}
