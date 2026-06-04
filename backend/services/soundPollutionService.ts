export type SoundRiskLevel = 'safe' | 'fatigue' | 'damage' | 'pain' | 'severe';

export function classifySoundRisk(db: number): SoundRiskLevel {
  if (db < 60) return 'safe';
  if (db < 85) return 'fatigue';
  if (db < 100) return 'damage';
  if (db < 120) return 'pain';
  return 'severe';
}

export function getSoundRiskLabel(level: SoundRiskLevel): string {
  const labels: Record<SoundRiskLevel, string> = {
    safe: 'Safe for long periods',
    fatigue: 'Long exposure may cause fatigue',
    damage: 'Hearing damage possible',
    pain: 'Serious damage in minutes',
    severe: 'Immediate severe damage risk',
  };
  return labels[level];
}

export const DB_BANDS = [
  { min: 0, max: 30, example: 'Whisper, quiet library', risk: 'No risk' },
  { min: 30, max: 60, example: 'Normal conversation', risk: 'Safe for long periods' },
  { min: 60, max: 85, example: 'Busy traffic, vacuum', risk: 'Generally safe' },
  { min: 85, max: 90, example: 'Lawn mower, loud classroom', risk: 'Damage after long exposure' },
  { min: 90, max: 100, example: 'Power tools, loud music', risk: 'Damage likely' },
  { min: 100, max: 110, example: 'Rock concert', risk: 'Serious damage in minutes' },
  { min: 110, max: 120, example: 'Siren close by', risk: 'Immediate damage possible' },
  { min: 120, max: 140, example: 'Jet engine close range', risk: 'Immediate severe damage' },
  { min: 140, max: Infinity, example: 'Explosion, gunshot', risk: 'Instant permanent damage' },
] as const;

export function normalizeMeteringToDb(metering: number): number {
  const clamped = Math.max(-60, Math.min(0, metering));
  return Math.round(30 + (clamped + 60) * (90 / 60));
}
