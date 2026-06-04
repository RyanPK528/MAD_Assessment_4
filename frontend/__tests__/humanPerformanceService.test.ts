import {
  buildAttemptResult,
  buildSubmissionPayload,
  evaluatePrediction,
  validateFinalSubmission,
} from '../../backend/services/humanPerformanceLogic';
import {
  clampSmoothness,
  computeMagnitude,
  decreaseSmoothness,
  deltaToMillimeters,
  formatOutcome,
  formatRecordingTime,
  magnitudeDelta,
  smoothSignal,
} from '../../backend/utils/motionAnalysis';

describe('humanPerformance stretch lab', () => {
  it('computes magnitude and delta', () => {
    expect(computeMagnitude(3, 4, 0)).toBe(5);
    expect(magnitudeDelta(10, 9.5)).toBe(0.5);
  });

  it('smooths signal with moving average', () => {
    expect(smoothSignal([1, 2, 3])).toEqual([
      4 / 3,
      2,
      8 / 3,
    ]);
  });

  it('formats recording time', () => {
    expect(formatRecordingTime(65)).toBe('1:05');
    expect(formatRecordingTime(5)).toBe('0:05');
  });

  it('converts delta to millimetres', () => {
    expect(deltaToMillimeters(0.25)).toBe(5);
  });

  it('decreases smoothness with jerky motion', () => {
    expect(decreaseSmoothness(100, 0.5, 1.5)).toBe(99.25);
    expect(clampSmoothness(150)).toBe(100);
  });

  it('evaluates numeric predictions within tolerance', () => {
    expect(evaluatePrediction('5 mm', 5)).toBe(true);
    expect(evaluatePrediction('+/- 1 cm', 5)).toBe(null);
  });

  it('requires three attempts before final submit', () => {
    const result = validateFinalSubmission([
      {
        attemptNumber: 1,
        movementLabel: 'Circle + Figure 8',
        prediction: '5 mm',
        durationSec: 40,
        largestMovementMm: 5,
        vibrationEvents: 2,
        smoothnessPercent: 90,
        wasCorrect: true,
      },
    ]);
    expect(result.ok).toBe(false);
  });

  it('builds attempt and submission payloads', () => {
    const attempt = buildAttemptResult(0, '5 mm', 40, 0.25, 3, 88);
    expect(attempt.movementLabel).toBe('Circle + Figure 8');
    expect(attempt.largestMovementMm).toBe(5);

    const payload = buildSubmissionPayload([
      attempt,
      { ...attempt, attemptNumber: 2, movementLabel: 'Up / Down', durationSec: 20 },
      { ...attempt, attemptNumber: 3, movementLabel: 'Left / Right', durationSec: 20 },
    ]);
    expect(payload.attempts).toHaveLength(3);
    expect(payload.predictions[0].outcome).toBe(formatOutcome(40, 5));
  });
});
