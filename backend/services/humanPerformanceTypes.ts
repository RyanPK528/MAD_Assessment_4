export const MAX_STRETCH_ATTEMPTS = 3;

export const JERK_DELTA_THRESHOLD = 0.25;

export const SMOOTHNESS_DECAY_FACTOR = 1.5;

/** Approximate scale from accelerometer delta to millimetres for display. */
export const DELTA_TO_MM_SCALE = 20;

export type StretchRecordingState = 'idle' | 'countdown' | 'recording' | 'completed';

export interface MovementPhase {
  attemptNumber: 1 | 2 | 3;
  label: string;
  instruction: string;
}

export const MOVEMENT_PHASES: MovementPhase[] = [
  {
    attemptNumber: 1,
    label: 'Circle + Figure 8',
    instruction: 'Perform a circle, then a figure 8 in succession while holding the phone firmly. Press Finish when done.',
  },
  {
    attemptNumber: 2,
    label: 'Up / Down',
    instruction: 'Move the phone smoothly up and down. Press Finish when done.',
  },
  {
    attemptNumber: 3,
    label: 'Left / Right',
    instruction: 'Move the phone smoothly left and right. Press Finish when done.',
  },
];

export interface StretchLabState {
  phaseIndex: number;
  recordingState: StretchRecordingState;
  countdown: number | null;
  elapsedSec: number;
  vibrationEvents: number;
  smoothnessScore: number;
  largestDelta: number;
  graphSamples: number[];
}

export interface StretchAttemptResult {
  attemptNumber: 1 | 2 | 3;
  movementLabel: string;
  prediction: string;
  durationSec: number;
  largestMovementMm: number;
  vibrationEvents: number;
  smoothnessPercent: number;
  wasCorrect: boolean | null;
}

export function createInitialStretchLabState(): StretchLabState {
  return {
    phaseIndex: 0,
    recordingState: 'idle',
    countdown: null,
    elapsedSec: 0,
    vibrationEvents: 0,
    smoothnessScore: 100,
    largestDelta: 0,
    graphSamples: [],
  };
}
