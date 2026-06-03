export {
  buildAttemptResult,
  buildSubmissionPayload,
  evaluatePrediction,
  MAX_STRETCH_ATTEMPTS,
  MOVEMENT_PHASES,
  validateFinalSubmission,
} from '../../backend/services/humanPerformanceLogic';

export {
  createInitialStretchLabState,
  createStretchLabController,
  formatOutcome,
  formatRecordingTime,
  deltaToMillimeters,
  JERK_DELTA_THRESHOLD,
  SMOOTHNESS_DECAY_FACTOR,
} from '../../backend/services/humanPerformanceService';

export type {
  MovementPhase,
  StretchAttemptResult,
  StretchLabState,
  StretchRecordingState,
} from '../../backend/services/humanPerformanceTypes';

export {
  clampSmoothness,
  computeMagnitude,
  decreaseSmoothness,
  magnitudeDelta,
  smoothSignal,
} from '../../backend/utils/motionAnalysis';
