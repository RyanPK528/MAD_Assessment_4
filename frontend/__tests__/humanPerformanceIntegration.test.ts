/**
 * Integration Test: Human Performance Lab (Activity 5)
 * Links motion analysis, attempt building, validation, and submission payload assembly.
 */
import {
  buildAttemptResult,
  buildSubmissionPayload,
  evaluatePrediction,
  validateFinalSubmission,
} from '../../backend/services/humanPerformanceLogic';
import { JERK_DELTA_THRESHOLD, MOVEMENT_PHASES } from '../../backend/services/humanPerformanceTypes';
import type { StretchAttemptResult } from '../../backend/services/humanPerformanceTypes';
import {
  clampSmoothness,
  computeMagnitude,
  decreaseSmoothness,
  magnitudeDelta,
  smoothSignal,
} from '../../backend/utils/motionAnalysis';

describe('Human Performance — Integration Test (Motion + Validation + Submit)', () => {
  it('processes simulated sensor samples into attempt metrics', () => {
    let smoothness = 100;
    let largestDelta = 0;
    let vibrationEvents = 0;
    const deltas: number[] = [];
    let previousMagnitude = computeMagnitude(0, 0, 9.8);

    const jerkSamples = [
      { x: 0, y: 0, z: 9.8 },
      { x: 2.5, y: 0, z: 5.0 },
      { x: 0.1, y: 0, z: 9.9 },
      { x: 2.0, y: 0.2, z: 6.0 },
    ];

    for (const sample of jerkSamples) {
      const magnitude = computeMagnitude(sample.x, sample.y, sample.z);
      const delta = magnitudeDelta(magnitude, previousMagnitude);
      previousMagnitude = magnitude;
      deltas.push(delta);

      if (delta > JERK_DELTA_THRESHOLD) {
        vibrationEvents += 1;
        largestDelta = Math.max(largestDelta, delta);
      }

      smoothness = decreaseSmoothness(smoothness, delta, 1.5);
    }

    const graphSamples = smoothSignal(deltas);
    const attempt = buildAttemptResult(0, '5 mm', 40, largestDelta, vibrationEvents, clampSmoothness(smoothness));

    expect(vibrationEvents).toBeGreaterThan(0);
    expect(graphSamples.length).toBeGreaterThan(0);
    expect(attempt.largestMovementMm).toBeGreaterThan(0);
    expect(attempt.movementLabel).toBe(MOVEMENT_PHASES[0].label);
    expect(evaluatePrediction(`${attempt.largestMovementMm} mm`, attempt.largestMovementMm)).toBe(true);
  });

  it('completes three phases and passes final submission validation', () => {
    const attempts: StretchAttemptResult[] = MOVEMENT_PHASES.map((phase, index) =>
      buildAttemptResult(index, `${index + 4} mm`, 30 + index * 5, 0.2 + index * 0.05, index, 95 - index),
    );

    const validation = validateFinalSubmission(attempts);
    expect(validation.ok).toBe(true);

    const payload = buildSubmissionPayload(attempts);
    expect(payload.attempts).toHaveLength(3);
    expect(payload.predictions).toHaveLength(3);
    expect(payload.attempts[2].movementLabel).toBe(MOVEMENT_PHASES[2].label);
  });

  it('rejects submission when fewer than three phases are complete', () => {
    const partial = [
      buildAttemptResult(0, '5 mm', 30, 0.2, 1, 95),
      buildAttemptResult(1, '6 mm', 25, 0.18, 0, 98),
    ];

    const result = validateFinalSubmission(partial);
    expect(result.ok).toBe(false);
    expect(result.message).toBeTruthy();
  });
});
