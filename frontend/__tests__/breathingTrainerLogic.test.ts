import {
  analyzeBreathingSignal,
  analyzeBreathingSignalLive,
  buildMemberAttempt,
  buildPhaseResult,
  buildSubmissionPayload,
  centerSignal,
  computeBreathsPerMinute,
  detectBreaths,
  downsampleSignal,
  evaluateBreathingPrediction,
  getOverallProgress,
  validateFinalSubmission,
  whittakerEilersSmooth,
} from '../../backend/services/breathingTrainerLogic';
import { BREATHING_PHASES } from '../../backend/services/breathingTrainerTypes';

function buildSyntheticBreathSignal(breathCount: number, samplesPerBreath = 10): number[] {
  const values: number[] = [];

  for (let breath = 0; breath < breathCount; breath += 1) {
    for (let i = 0; i < samplesPerBreath; i += 1) {
      const phase = i / samplesPerBreath;
      values.push(Math.sin(phase * Math.PI) * 0.5);
    }
    for (let i = 0; i < samplesPerBreath; i += 1) {
      values.push(0);
    }
  }

  return values;
}

describe('breathingTrainerLogic', () => {
  describe('signal processing', () => {
    it('smooths noisy values without changing length', () => {
      const input = [0, 0.2, 0.5, 0.3, 0.1, 0];
      const smoothed = whittakerEilersSmooth(input);
      expect(smoothed).toHaveLength(input.length);
    });

    it('centers signal around zero', () => {
      const centered = centerSignal([1, 2, 3, 4, 5]);
      const mean = centered.reduce((sum, value) => sum + value, 0) / centered.length;
      expect(mean).toBeCloseTo(0, 5);
    });

    it('detects peaks in synthetic breathing signal', () => {
      const signal = buildSyntheticBreathSignal(4);
      const centered = centerSignal(whittakerEilersSmooth(signal));
      expect(detectBreaths(centered)).toBeGreaterThanOrEqual(3);
    });

    it('computes breaths per minute from count and duration', () => {
      expect(computeBreathsPerMinute(15, 30)).toBe(30);
    });

    it('downsamples long signals to target length', () => {
      const downsampled = downsampleSignal(Array.from({ length: 300 }, (_, index) => index), 60);
      expect(downsampled).toHaveLength(60);
    });

    it('analyzes z-axis samples into recording metrics', () => {
      const metrics = analyzeBreathingSignal(buildSyntheticBreathSignal(5), 30);
      expect(metrics.durationSec).toBe(30);
      expect(metrics.breathCount).toBeGreaterThan(0);
      expect(metrics.centeredSignal.length).toBeLessThanOrEqual(60);
    });

    it('supports live analysis with short elapsed windows', () => {
      const signal = buildSyntheticBreathSignal(3);
      const live = analyzeBreathingSignalLive(signal, 5);
      expect(live.breathCount).toBeGreaterThanOrEqual(0);
      expect(live.centeredSignal.length).toBeLessThanOrEqual(60);
    });
  });

  describe('evaluateBreathingPrediction', () => {
    it('returns true when prediction is within tolerance', () => {
      expect(evaluateBreathingPrediction('18 bpm', 20)).toBe(true);
    });

    it('returns false when prediction is outside tolerance', () => {
      expect(evaluateBreathingPrediction('30', 18)).toBe(false);
    });

    it('returns null for non-numeric predictions', () => {
      expect(evaluateBreathingPrediction('slow', 18)).toBeNull();
    });
  });

  describe('buildPhaseResult', () => {
    it('builds a phase result with correctness', () => {
      const metrics = analyzeBreathingSignal(buildSyntheticBreathSignal(4), 30);
      const result = buildPhaseResult(0, '20', metrics);

      expect(result.conditionLabel).toBe(BREATHING_PHASES[0].label);
      expect(result.kind).toBe('rest');
      expect(result.breathsPerMinute).toBe(metrics.breathsPerMinute);
      expect(typeof result.wasCorrect).toBe('boolean');
    });
  });

  describe('buildSubmissionPayload', () => {
    it('builds member attempts and flat predictions', () => {
      const metrics = analyzeBreathingSignal(buildSyntheticBreathSignal(3), 30);
      const phase = buildPhaseResult(0, '18', metrics);
      const member = buildMemberAttempt('Alex', 0, [phase]);
      const payload = buildSubmissionPayload([member]);

      expect(payload.memberAttempts).toHaveLength(1);
      expect(payload.memberAttempts[0].memberName).toBe('Alex');
      expect(payload.predictions).toHaveLength(1);
    });
  });

  describe('validateFinalSubmission', () => {
    it('rejects incomplete member count', () => {
      const result = validateFinalSubmission([], 2);
      expect(result.ok).toBe(false);
    });

    it('rejects members missing phases', () => {
      const metrics = analyzeBreathingSignal(buildSyntheticBreathSignal(3), 30);
      const phase = buildPhaseResult(0, '18', metrics);
      const member = buildMemberAttempt('Alex', 0, [phase]);
      const result = validateFinalSubmission([member], 1);
      expect(result.ok).toBe(false);
    });

    it('accepts complete member attempts', () => {
      const metrics = analyzeBreathingSignal(buildSyntheticBreathSignal(3), 30);
      const phases = [0, 1, 2].map((index) => buildPhaseResult(index, '18', metrics));
      const member = buildMemberAttempt('Alex', 0, phases);
      const result = validateFinalSubmission([member], 1);
      expect(result.ok).toBe(true);
    });
  });

  describe('getOverallProgress', () => {
    it('counts completed phase recordings across members', () => {
      const metrics = analyzeBreathingSignal(buildSyntheticBreathSignal(3), 30);
      const phase = buildPhaseResult(0, '18', metrics);
      const member = buildMemberAttempt('Alex', 0, [phase, phase, phase]);
      const progress = getOverallProgress([member], [phase], 2);

      expect(progress.completed).toBe(4);
      expect(progress.total).toBe(6);
    });
  });
});
