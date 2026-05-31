// backend/services/soundPollutionService.ts
// Audio metering utilities and SQLite persistence for Activity 2: Sound Pollution Hunter.

import { addSyncRecord, getActivityRecords, SyncRecord } from './sqliteService';

export const ACTIVITY_ID = 2;

export const CLASSROOM_ACTIONS = [
  'Quiet Study',
  'Normal Talking',
  'Loud Talking',
  'Dropping a Book',
  'Walking',
  'Chair Scraping',
  'Clapping',
  'Shouting',
] as const;

export type ClassroomAction = typeof CLASSROOM_ACTIONS[number];

export type SoundReading = {
  dbLevel: number;
  action: ClassroomAction;
  timestamp: string;
};

export type SoundResult = {
  readings: SoundReading[];
  locationLabel: string;
  peakDb: number;
  averageDb: number;
  teamId: string;
  recordedAt: string;
};

/**
 * Convert expo-av metering value to estimated dB SPL.
 *
 * expo-av metering returns values in the range [-160, 0] on iOS
 * and roughly [-120, 0] on Android. We normalise to a 0–100 dB scale
 * typical for everyday environments.
 *
 * Formula: dB_SPL ≈ metering + 90
 * Clamped to [0, 120] for display safety.
 */
export function meteringToDb(meteringValue: number): number {
  const raw = meteringValue + 90;
  return Math.max(0, Math.min(120, Math.round(raw * 10) / 10));
}

/**
 * Interpret dB level with an environmental label.
 */
export function interpretDb(db: number): { label: string; color: string; description: string } {
  if (db < 30) return { label: 'Very Quiet', color: '#22C55E', description: 'Whisper, library — 30 dB' };
  if (db < 50) return { label: 'Quiet', color: '#84CC16', description: 'Normal office, conversation — 40–50 dB' };
  if (db < 65) return { label: 'Moderate', color: '#F59E0B', description: 'Classroom activity — 55–65 dB' };
  if (db < 80) return { label: 'Loud', color: '#EF4444', description: 'Raised voices, busy classroom — 70–80 dB' };
  if (db < 100) return { label: 'Very Loud', color: '#DC2626', description: 'Shouting, power tools — 85–100 dB' };
  return { label: 'Dangerous', color: '#7C3AED', description: 'Hearing damage risk above 100 dB' };
}

export function calculatePeakDb(readings: SoundReading[]): number {
  if (readings.length === 0) return 0;
  return Math.max(...readings.map((r) => r.dbLevel));
}

export function calculateAverageDb(readings: SoundReading[]): number {
  if (readings.length === 0) return 0;
  const sum = readings.reduce((acc, r) => acc + r.dbLevel, 0);
  return Math.round((sum / readings.length) * 10) / 10;
}

export function saveSoundResult(
  result: SoundResult,
  coords?: { latitude: number; longitude: number },
): void {
  addSyncRecord(
    ACTIVITY_ID,
    { activityId: ACTIVITY_ID, teamId: result.teamId, data: result, submittedAt: result.recordedAt },
    coords,
  );
}

export function getSoundHistory(): SyncRecord[] {
  return getActivityRecords(ACTIVITY_ID);
}
