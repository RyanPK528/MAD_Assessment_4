import {
  MAX_STRETCH_ATTEMPTS,
  MOVEMENT_PHASES,
  StretchAttemptResult,
} from './humanPerformanceTypes';
import { deltaToMillimeters, formatOutcome } from '../utils/motionAnalysis';

export { MAX_STRETCH_ATTEMPTS, MOVEMENT_PHASES };

export function evaluatePrediction(
  prediction: string,
  largestMovementMm: number,
  toleranceMm = 2,
): boolean | null {
  const trimmed = prediction.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.includes('+/-') || trimmed.includes('±')) {
    return null;
  }

  const numericMatch = trimmed.match(/-?\d+(\.\d+)?/);
  if (!numericMatch) {
    return null;
  }

  const predicted = Number(numericMatch[0]);
  if (Number.isNaN(predicted)) {
    return null;
  }

  return Math.abs(predicted - largestMovementMm) <= toleranceMm;
}

export function validateFinalSubmission(attempts: StretchAttemptResult[]): {
  ok: boolean;
  message?: string;
} {
  if (attempts.length < MAX_STRETCH_ATTEMPTS) {
    const remaining = MAX_STRETCH_ATTEMPTS - attempts.length;
    return {
      ok: false,
      message: `Complete all ${MAX_STRETCH_ATTEMPTS} movement phases before submitting (${remaining} remaining).`,
    };
  }

  if (attempts.some((entry) => !entry.prediction.trim())) {
    return { ok: false, message: 'Please enter a prediction for every phase.' };
  }

  return { ok: true };
}

export function buildSubmissionPayload(attempts: StretchAttemptResult[]) {
  return {
    attempts: attempts.map((entry) => ({
      attemptNumber: entry.attemptNumber,
      movementLabel: entry.movementLabel,
      prediction: entry.prediction,
      durationSec: entry.durationSec,
      largestMovementMm: entry.largestMovementMm,
      vibrationEvents: entry.vibrationEvents,
      smoothnessPercent: entry.smoothnessPercent,
      wasCorrect: entry.wasCorrect,
    })),
    predictions: attempts.map((entry) => ({
      prediction: entry.prediction,
      outcome: formatOutcome(entry.durationSec, entry.largestMovementMm),
    })),
  };
}

export function buildAttemptResult(
  phaseIndex: number,
  prediction: string,
  durationSec: number,
  largestDelta: number,
  vibrationEvents: number,
  smoothnessScore: number,
): StretchAttemptResult {
  const phase = MOVEMENT_PHASES[phaseIndex];
  const largestMovementMm = deltaToMillimeters(largestDelta);

  return {
    attemptNumber: phase.attemptNumber,
    movementLabel: phase.label,
    prediction,
    durationSec,
    largestMovementMm,
    vibrationEvents,
    smoothnessPercent: Math.round(smoothnessScore),
    wasCorrect: evaluatePrediction(prediction, largestMovementMm),
  };
}
