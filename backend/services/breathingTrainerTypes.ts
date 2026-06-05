export const MAX_BREATHING_PHASES = 3;
export const RECORDING_DURATION_SEC = 30;
export const START_COUNTDOWN_SEC = 3;
export const CHART_DISPLAY_SAMPLES = 60;

export type BreathingPhaseKind = 'rest' | 'post-exercise-1' | 'post-exercise-2';

export type BreathingRecordingState = 'idle' | 'countdown' | 'recording' | 'completed';

export interface BreathingPhaseDefinition {
  attemptNumber: 1 | 2 | 3;
  kind: BreathingPhaseKind;
  label: string;
  instruction: string;
}

export const BREATHING_PHASES: BreathingPhaseDefinition[] = [
  {
    attemptNumber: 1,
    kind: 'rest',
    label: 'Breathing at Rest',
    instruction: 'Place the phone gently on the chest. Record breathing at rest.',
  },
  {
    attemptNumber: 2,
    kind: 'post-exercise-1',
    label: 'After Exercise 1',
    instruction:
      'Perform jogging on the spot for one minute. Then begin recording. Compare results against Phase 1.',
  },
  {
    attemptNumber: 3,
    kind: 'post-exercise-2',
    label: 'After Exercise 2',
    instruction:
      'Perform approximately 100 star jumps. Then begin recording. Compare results against previous phases.',
  },
];

export interface SensorMovementSummary {
  peakAmplitude: number;
  sampleCount: number;
}

export interface BreathingPhaseResult {
  attemptNumber: 1 | 2 | 3;
  conditionLabel: string;
  kind: BreathingPhaseKind;
  prediction: string;
  breathsPerMinute: number;
  breathCount: number;
  durationSec: number;
  sensorMovementSummary: SensorMovementSummary;
  centeredSignal: number[];
  wasCorrect: boolean | null;
}

export interface BreathingMemberAttempt {
  memberName: string;
  memberIndex: number;
  phases: BreathingPhaseResult[];
}

export interface BreathingLabState {
  phaseIndex: number;
  recordingState: BreathingRecordingState;
  countdown: number | null;
  elapsedSec: number;
  breathCount: number;
  breathsPerMinute: number;
  centeredSignal: number[];
}

export interface BreathingRecordingMetrics {
  breathCount: number;
  breathsPerMinute: number;
  durationSec: number;
  centeredSignal: number[];
  peakAmplitude: number;
  sampleCount: number;
}

export function createInitialBreathingLabState(): BreathingLabState {
  return {
    phaseIndex: 0,
    recordingState: 'idle',
    countdown: null,
    elapsedSec: 0,
    breathCount: 0,
    breathsPerMinute: 0,
    centeredSignal: [],
  };
}
