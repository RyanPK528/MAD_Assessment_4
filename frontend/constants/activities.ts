export const TOTAL_CHALLENGES = 7;

export const ACTIVITY_IDS = [
  'parachute-drop',
  'sound-pollution',
  'hand-fan',
  'earthquake-structure',
  'human-performance',
  'reaction-board',
  'breathing-trainer',
] as const;

export type ActivityId = (typeof ACTIVITY_IDS)[number];