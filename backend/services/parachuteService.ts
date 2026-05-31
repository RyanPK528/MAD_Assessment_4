// backend/services/parachuteService.ts
// Physics utilities and SQLite persistence for Activity 1: Parachute Drop.

import { addSyncRecord, getActivityRecords, SyncRecord } from './sqliteService';

export const ACTIVITY_ID = 1;

export type ParachuteResult = {
  impactSpeedMs: number;      // m/s — from slow-motion video review
  contactTimeSec: number;     // seconds — from slow-motion video review
  gForce: number;             // calculated
  videoNotes: string;
  recordedAt: string;
  teamId: string;
};

/**
 * G-Force = (Impact Speed / Contact Time) / 9.8
 * Returns a number rounded to 2 decimal places.
 * Returns 0 if inputs are invalid to prevent divide-by-zero.
 */
export function calculateGForce(impactSpeedMs: number, contactTimeSec: number): number {
  if (contactTimeSec <= 0 || impactSpeedMs < 0) return 0;
  const raw = impactSpeedMs / contactTimeSec / 9.8;
  return Math.round(raw * 100) / 100;
}

/**
 * Interpret the G-force value with a science-based label.
 */
export function interpretGForce(gForce: number): {
  label: string;
  color: string;
  description: string;
} {
  if (gForce < 1) return {
    label: 'Gentle Landing',
    color: '#22C55E',
    description: 'Below 1g — very safe impact, parachute working well.',
  };
  if (gForce < 5) return {
    label: 'Moderate Impact',
    color: '#F59E0B',
    description: `${gForce}g — typical parachute landing, moderate force.`,
  };
  if (gForce < 10) return {
    label: 'Hard Impact',
    color: '#EF4444',
    description: `${gForce}g — high impact. Consider increasing parachute area.`,
  };
  return {
    label: 'Extreme Impact',
    color: '#7C3AED',
    description: `${gForce}g — exceeds safe limits. Redesign your parachute.`,
  };
}

/** Save result to local SQLite queue */
export function saveParachuteResult(
  result: ParachuteResult,
  coords?: { latitude: number; longitude: number },
): void {
  addSyncRecord(
    ACTIVITY_ID,
    { activityId: ACTIVITY_ID, teamId: result.teamId, data: result, submittedAt: result.recordedAt },
    coords,
  );
}

/** Retrieve saved results for display in history */
export function getParachuteHistory(): SyncRecord[] {
  return getActivityRecords(ACTIVITY_ID);
}
