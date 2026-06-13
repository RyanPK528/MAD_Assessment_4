import {
  analyzeBreathingSignal,
  analyzeBreathingSignalAsync,
  analyzeBreathingSignalLive,
  buildMemberAttempt,
  buildPhaseResult,
  buildSubmissionPayload,
  centerSignal,
  computeAccelMagnitude,
  computeBreathsPerMinute,
  countNewBreathPeaks,
  detectBreathCycles,
  detectBreaths,
  downsampleSignal,
  evaluateBreathingPrediction,
  filterBreathingMotionSamples,
  findBreathPeakIndices,
  getOverallProgress,
  highPassMovingBaseline,
  monotonicBreathCount,
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

function buildRippleExpansionFiltered(): number[] {
  const values = Array.from({ length: 40 }, () => 0);

  const addPeak = (center: number, height: number) => {
    values[center - 1] = height * 0.35;
    values[center] = height;
    values[center + 1] = height * 0.35;
  };

  addPeak(10, 1);
  addPeak(15, 0.9);
  addPeak(20, 0.82);

  return whittakerEilersSmooth(values);
}

function buildSmoothUpDownMagnitude(
  cycleSamples = 35,
  amplitude = 0.15,
  breathCount = 1,
  restSamples = 10,
): number[] {
  const values: number[] = [];

  for (let breath = 0; breath < breathCount; breath += 1) {
    for (let i = 0; i < cycleSamples; i += 1) {
      const phase = i / Math.max(1, cycleSamples - 1);
      values.push(9.8 + Math.sin(phase * Math.PI) * amplitude);
    }

    if (breath < breathCount - 1) {
      for (let i = 0; i < restSamples; i += 1) {
        values.push(9.8);
      }
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

    it('computes accelerometer magnitude from x,y,z', () => {
      expect(computeAccelMagnitude(3, 4, 0)).toBe(5);
    });

    it('highPassMovingBaseline removes slow drift from magnitude samples', () => {
      const drift = Array.from({ length: 40 }, (_, index) => 9.8 + index * 0.01);
      const oscillation = drift.map((value, index) => value + Math.sin(index / 3) * 0.05);
      const filtered = highPassMovingBaseline(oscillation, 10);
      const tailMean =
        filtered.slice(-10).reduce((sum, value) => sum + value, 0) / 10;

      expect(Math.abs(tailMean)).toBeLessThan(0.2);
    });

    it('detects peaks in synthetic breathing signal', () => {
      const signal = buildSyntheticBreathSignal(4, 25);
      const filtered = filterBreathingMotionSamples(signal);
      expect(detectBreathCycles(filtered)).toBeGreaterThanOrEqual(3);
    });

    it('computes breaths per minute from count and duration', () => {
      expect(computeBreathsPerMinute(15, 30)).toBe(30);
    });

    it('monotonicBreathCount never decreases the displayed count', () => {
      expect(monotonicBreathCount(3, 2)).toBe(3);
      expect(monotonicBreathCount(3, 5)).toBe(5);
      expect(monotonicBreathCount(0, 1)).toBe(1);
    });

    it('live analysis matches sync final analysis for the same signal and duration', () => {
      const signal = buildSyntheticBreathSignal(5);
      const live = analyzeBreathingSignalLive(signal, 30);
      const finalMetrics = analyzeBreathingSignal(signal, 30);

      expect(live.breathCount).toBe(finalMetrics.breathCount);
      expect(live.breathsPerMinute).toBe(finalMetrics.breathsPerMinute);
    });

    it('detects more weak breath peaks at 0.10 threshold than at 0.15', () => {
      const weakSignal = buildSyntheticBreathSignal(4).map((value) => value * 0.4);
      const filtered = filterBreathingMotionSamples(weakSignal);
      const sensitiveCount = detectBreathCycles(filtered, { peakThresholdRatio: 0.1 });
      const strictCount = detectBreathCycles(filtered, { peakThresholdRatio: 0.15 });

      expect(sensitiveCount).toBeGreaterThanOrEqual(strictCount);
    });

    it('merges ripple peaks in one expansion via min distance and prominence', () => {
      const ripple = buildRippleExpansionFiltered();
      const loosePeaks = findBreathPeakIndices(ripple, {
        peakProminenceRatio: 0,
        cycleProminenceRatio: 0,
        minPeakDistanceSamples: 4,
      });
      const strictPeaks = findBreathPeakIndices(ripple);

      expect(loosePeaks.length).toBeGreaterThan(1);
      expect(strictPeaks.length).toBe(1);
    });

    it('countNewBreathPeaks adds at most one breath for a ripple cluster per scan', () => {
      const ripple = buildRippleExpansionFiltered();
      const incremental = countNewBreathPeaks(ripple, Number.NEGATIVE_INFINITY);

      expect(incremental.newPeaks).toBe(1);
      expect(
        countNewBreathPeaks(ripple, incremental.lastPeakIndex).newPeaks,
      ).toBe(0);
    });

    it('counts one breath for a smooth up-down magnitude cycle', () => {
      const motion = buildSmoothUpDownMagnitude(35, 0.15, 1);
      const filtered = filterBreathingMotionSamples(motion);
      const peaks = findBreathPeakIndices(filtered);

      expect(peaks.length).toBe(1);
      expect(detectBreathCycles(filtered)).toBe(1);
      expect(countNewBreathPeaks(filtered, Number.NEGATIVE_INFINITY).newPeaks).toBe(1);
    });

    it('counts three breaths for three up-down magnitude cycles', () => {
      const motion = buildSmoothUpDownMagnitude(35, 0.15, 3, 20);
      let lastIndex = Number.NEGATIVE_INFINITY;
      let totalPeaks = 0;

      for (let end = 10; end <= motion.length; end += 10) {
        const chunk = filterBreathingMotionSamples(motion.slice(0, end));
        const result = countNewBreathPeaks(chunk, lastIndex);
        totalPeaks += result.newPeaks;
        if (result.newPeaks > 0) {
          lastIndex = result.lastPeakIndex;
        }
      }

      expect(totalPeaks).toBe(3);
    });

    it('incremental up-down cycle ticks accumulate to one breath', () => {
      const motion = buildSmoothUpDownMagnitude(35, 0.15, 1);
      let lastIndex = Number.NEGATIVE_INFINITY;
      let totalPeaks = 0;

      for (let end = 5; end <= motion.length; end += 5) {
        const chunk = filterBreathingMotionSamples(motion.slice(0, end));
        const result = countNewBreathPeaks(chunk, lastIndex);
        totalPeaks += result.newPeaks;
        if (result.newPeaks > 0) {
          lastIndex = result.lastPeakIndex;
        }
      }

      expect(totalPeaks).toBe(1);
    });

    it('downsamples long signals to target length', () => {
      const downsampled = downsampleSignal(Array.from({ length: 300 }, (_, index) => index), 60);
      expect(downsampled).toHaveLength(60);
    });

    it('analyzes motion magnitude samples into recording metrics', () => {
      const metrics = analyzeBreathingSignal(buildSyntheticBreathSignal(5), 30);
      expect(metrics.durationSec).toBe(30);
      expect(metrics.breathCount).toBeGreaterThan(0);
      expect(metrics.centeredSignal.length).toBeLessThanOrEqual(60);
    });

    it('analyzeBreathingSignalAsync matches sync analysis', async () => {
      const signal = buildSyntheticBreathSignal(5);
      const syncMetrics = analyzeBreathingSignal(signal, 30);
      const asyncMetrics = await analyzeBreathingSignalAsync(signal, 30);
      expect(asyncMetrics.breathCount).toBe(syncMetrics.breathCount);
      expect(asyncMetrics.breathsPerMinute).toBe(syncMetrics.breathsPerMinute);
      expect(asyncMetrics.centeredSignal).toEqual(syncMetrics.centeredSignal);
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
