import {
  BREATHING_PHASES,
  BreathingMemberAttempt,
  BreathingPhaseResult,
  BreathingRecordingMetrics,
  CHART_DISPLAY_SAMPLES,
  CYCLE_PROMINENCE_RATIO,
  HIGH_PASS_BASELINE_WINDOW_SAMPLES,
  MAX_BREATHING_PHASES,
  MIN_PEAK_DISTANCE_SAMPLES,
  PEAK_CONFIRMATION_LAG_SAMPLES,
  PEAK_PROMINENCE_RATIO,
  PEAK_PROMINENCE_WINDOW_SAMPLES,
  PEAK_THRESHOLD_RATIO,
  RECORDING_DURATION_SEC,
  WHITTAKER_ITERATIONS,
  WHITTAKER_LAMBDA,
} from './breathingTrainerTypes';
import { yieldToEventLoop } from '../utils/cooperativeScheduling';

export {
  BREATHING_PHASES,
  CYCLE_PROMINENCE_RATIO,
  HIGH_PASS_BASELINE_WINDOW_SAMPLES,
  MAX_BREATHING_PHASES,
  MIN_PEAK_DISTANCE_SAMPLES,
  PEAK_CONFIRMATION_LAG_SAMPLES,
  PEAK_PROMINENCE_RATIO,
  PEAK_PROMINENCE_WINDOW_SAMPLES,
  PEAK_THRESHOLD_RATIO,
  RECORDING_DURATION_SEC,
  START_COUNTDOWN_SEC,
  WHITTAKER_ITERATIONS,
  WHITTAKER_LAMBDA,
} from './breathingTrainerTypes';

export interface DetectBreathsOptions {
  peakThresholdRatio?: number;
  minPeakDistanceSamples?: number;
  peakProminenceRatio?: number;
  peakProminenceWindowSamples?: number;
  cycleProminenceRatio?: number;
  troughStartIndex?: number;
  peakConfirmationLagSamples?: number;
}

export interface NewBreathPeaksResult {
  newPeaks: number;
  lastPeakIndex: number;
}

export function computeAccelMagnitude(x: number, y: number, z: number): number {
  return Math.hypot(x, y, z);
}

export function highPassMovingBaseline(
  values: number[],
  windowSize = HIGH_PASS_BASELINE_WINDOW_SAMPLES,
): number[] {
  if (values.length === 0) {
    return [];
  }

  return values.map((value, index) => {
    const start = Math.max(0, index - windowSize + 1);
    const window = values.slice(start, index + 1);
    const baseline = window.reduce((sum, sample) => sum + sample, 0) / window.length;
    return value - baseline;
  });
}

export function filterBreathingMotionSamples(
  motionSamples: number[],
  windowSize = HIGH_PASS_BASELINE_WINDOW_SAMPLES,
): number[] {
  if (motionSamples.length === 0) {
    return [];
  }

  const highPassed = highPassMovingBaseline(motionSamples, windowSize);
  return whittakerEilersSmooth(highPassed);
}

export function whittakerEilersSmooth(
  values: number[],
  lambda = WHITTAKER_LAMBDA,
  iterations = WHITTAKER_ITERATIONS,
): number[] {
  if (values.length < 3) {
    return [...values];
  }

  let smoothed = [...values];

  for (let k = 0; k < iterations; k += 1) {
    const next = [...smoothed];

    for (let i = 1; i < values.length - 1; i += 1) {
      next[i] = (values[i] + lambda * (smoothed[i - 1] + smoothed[i + 1])) / (1 + 2 * lambda);
    }

    smoothed = next;
  }

  return smoothed;
}

export async function whittakerEilersSmoothAsync(
  values: number[],
  lambda = WHITTAKER_LAMBDA,
  iterations = WHITTAKER_ITERATIONS,
): Promise<number[]> {
  if (values.length < 3) {
    return [...values];
  }

  let smoothed = [...values];

  for (let k = 0; k < iterations; k += 1) {
    const next = [...smoothed];

    for (let i = 1; i < values.length - 1; i += 1) {
      next[i] = (values[i] + lambda * (smoothed[i - 1] + smoothed[i + 1])) / (1 + 2 * lambda);
    }

    smoothed = next;
    await yieldToEventLoop();
  }

  return smoothed;
}

export function centerSignal(values: number[]): number[] {
  if (values.length === 0) {
    return [];
  }

  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return values.map((value) => value - mean);
}

function getSignalAmplitude(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return Math.max(...values) - Math.min(...values);
}

export function isBreathPeak(
  values: number[],
  index: number,
  amplitude: number,
  options: DetectBreathsOptions = {},
): boolean {
  if (index <= 0 || index >= values.length - 1 || amplitude <= 0) {
    return false;
  }

  const peakThresholdRatio = options.peakThresholdRatio ?? PEAK_THRESHOLD_RATIO;
  const prominenceRatio = options.peakProminenceRatio ?? PEAK_PROMINENCE_RATIO;
  const prominenceWindow = options.peakProminenceWindowSamples ?? PEAK_PROMINENCE_WINDOW_SAMPLES;
  const cycleProminenceRatio = options.cycleProminenceRatio ?? CYCLE_PROMINENCE_RATIO;

  const prev = values[index - 1];
  const current = values[index];
  const next = values[index + 1];
  const threshold = amplitude * peakThresholdRatio;
  const isLocalMax =
    current >= prev && current >= next && (current > prev || current > next);

  if (!(isLocalMax && current > threshold)) {
    return false;
  }

  if (options.troughStartIndex !== undefined && cycleProminenceRatio > 0) {
    const troughStart = Math.max(0, options.troughStartIndex);
    let troughSinceLast = current;

    for (let j = troughStart; j <= index; j += 1) {
      troughSinceLast = Math.min(troughSinceLast, values[j] ?? current);
    }

    const cycleProminence = current - troughSinceLast;
    return cycleProminence >= amplitude * cycleProminenceRatio;
  }

  const windowStart = Math.max(0, index - prominenceWindow);
  const windowEnd = Math.min(values.length - 1, index + prominenceWindow);
  let localMin = current;

  for (let j = windowStart; j <= windowEnd; j += 1) {
    localMin = Math.min(localMin, values[j] ?? current);
  }

  const prominence = current - localMin;
  return prominence >= amplitude * prominenceRatio;
}

export function isDominantBreathPeak(
  values: number[],
  index: number,
  halfWindow: number,
): boolean {
  if (index <= 0 || index >= values.length - 1) {
    return false;
  }

  const current = values[index] ?? 0;
  const windowStart = Math.max(0, index - halfWindow);
  const windowEnd = Math.min(values.length - 1, index + halfWindow);
  let windowMax = current;

  for (let j = windowStart; j <= windowEnd; j += 1) {
    windowMax = Math.max(windowMax, values[j] ?? Number.NEGATIVE_INFINITY);
  }

  return current >= windowMax;
}

function findStrongestPeakInRange(
  values: number[],
  rangeStart: number,
  rangeEnd: number,
  amplitude: number,
  options: DetectBreathsOptions,
  troughStartIndex: number,
): number | null {
  const minDistance = options.minPeakDistanceSamples ?? MIN_PEAK_DISTANCE_SAMPLES;
  const halfWindow = Math.floor(minDistance / 2);
  let bestIndex: number | null = null;
  let bestValue = Number.NEGATIVE_INFINITY;

  for (let i = rangeStart; i <= rangeEnd; i += 1) {
    const peakOptions: DetectBreathsOptions = {
      ...options,
      troughStartIndex,
    };

    if (
      isBreathPeak(values, i, amplitude, peakOptions) &&
      isDominantBreathPeak(values, i, halfWindow) &&
      (values[i] ?? Number.NEGATIVE_INFINITY) > bestValue
    ) {
      bestValue = values[i] ?? Number.NEGATIVE_INFINITY;
      bestIndex = i;
    }
  }

  return bestIndex;
}

function findNextBreathPeakIndex(
  values: number[],
  searchStart: number,
  maxIndex: number,
  lastPeakIndex: number,
  amplitude: number,
  options: DetectBreathsOptions,
): number | null {
  const minDistance = options.minPeakDistanceSamples ?? MIN_PEAK_DISTANCE_SAMPLES;
  const troughStartIndex = Math.max(0, lastPeakIndex);

  for (let i = searchStart; i <= maxIndex; i += 1) {
    if (i - lastPeakIndex <= minDistance) {
      continue;
    }

    const lookEnd = Math.min(maxIndex, i + minDistance);
    const peakIndex = findStrongestPeakInRange(
      values,
      i,
      lookEnd,
      amplitude,
      options,
      troughStartIndex,
    );

    if (peakIndex !== null) {
      return peakIndex;
    }
  }

  return null;
}

export function findBreathPeakIndices(values: number[], options: DetectBreathsOptions = {}): number[] {
  if (values.length < 3) {
    return [];
  }

  const minDistance = options.minPeakDistanceSamples ?? MIN_PEAK_DISTANCE_SAMPLES;
  const lag = options.peakConfirmationLagSamples ?? PEAK_CONFIRMATION_LAG_SAMPLES;
  const maxIndex = values.length - 1 - lag;

  if (maxIndex < 1) {
    return [];
  }

  const amplitude = getSignalAmplitude(values);
  const peaks: number[] = [];
  let lastPeak = -minDistance;
  let searchStart = 1;

  while (searchStart <= maxIndex) {
    const peakIndex = findNextBreathPeakIndex(
      values,
      searchStart,
      maxIndex,
      lastPeak,
      amplitude,
      options,
    );

    if (peakIndex === null) {
      break;
    }

    peaks.push(peakIndex);
    lastPeak = peakIndex;
    searchStart = peakIndex + 1;
  }

  return peaks;
}

export function countNewBreathPeaks(
  filtered: number[],
  afterSampleIndex: number,
  options: DetectBreathsOptions = {},
): NewBreathPeaksResult {
  if (filtered.length < 3) {
    return { newPeaks: 0, lastPeakIndex: afterSampleIndex };
  }

  const lag = options.peakConfirmationLagSamples ?? PEAK_CONFIRMATION_LAG_SAMPLES;
  const maxIndex = filtered.length - 1 - lag;

  if (maxIndex < 1) {
    return { newPeaks: 0, lastPeakIndex: afterSampleIndex };
  }

  const amplitude = getSignalAmplitude(filtered);
  let lastAcceptedIndex = afterSampleIndex;
  let newPeaks = 0;
  let searchStart = Math.max(1, afterSampleIndex + 1);

  while (searchStart <= maxIndex) {
    const peakIndex = findNextBreathPeakIndex(
      filtered,
      searchStart,
      maxIndex,
      lastAcceptedIndex,
      amplitude,
      options,
    );

    if (peakIndex === null) {
      break;
    }

    newPeaks += 1;
    lastAcceptedIndex = peakIndex;
    searchStart = peakIndex + 1;
  }

  return {
    newPeaks,
    lastPeakIndex: newPeaks > 0 ? lastAcceptedIndex : afterSampleIndex,
  };
}

export function detectBreathCycles(values: number[], options: DetectBreathsOptions = {}): number {
  return findBreathPeakIndices(values, options).length;
}

/** @deprecated Use detectBreathCycles */
export function detectBreaths(values: number[], options: DetectBreathsOptions = {}): number {
  return detectBreathCycles(values, options);
}

export function computeBreathsPerMinute(breathCount: number, durationSec: number): number {
  const safeDuration = Math.max(1, durationSec);
  return Math.round((breathCount / safeDuration) * 60);
}

export function monotonicBreathCount(previous: number, detected: number): number {
  return Math.max(previous, detected);
}

export function downsampleSignal(values: number[], targetLength = CHART_DISPLAY_SAMPLES): number[] {
  if (values.length === 0) {
    return [];
  }

  if (values.length <= targetLength) {
    return [...values];
  }

  const step = values.length / targetLength;
  const result: number[] = [];

  for (let i = 0; i < targetLength; i += 1) {
    const index = Math.min(values.length - 1, Math.floor(i * step));
    result.push(values[index] ?? 0);
  }

  return result;
}

export function analyzeBreathingSignalLive(
  motionSamples: number[],
  elapsedSec: number,
): BreathingRecordingMetrics {
  return analyzeBreathingSignal(motionSamples, Math.max(1, elapsedSec));
}

export function analyzeBreathingSignal(
  motionSamples: number[],
  durationSec = RECORDING_DURATION_SEC,
): BreathingRecordingMetrics {
  const filtered = filterBreathingMotionSamples(motionSamples);
  const breathCount = detectBreathCycles(filtered);
  const breathsPerMinute = computeBreathsPerMinute(breathCount, durationSec);
  const peakAmplitude =
    filtered.length === 0 ? 0 : Math.max(...filtered.map(Math.abs));

  return {
    breathCount,
    breathsPerMinute,
    durationSec,
    centeredSignal: downsampleSignal(filtered),
    peakAmplitude,
    sampleCount: motionSamples.length,
  };
}

export async function analyzeBreathingSignalAsync(
  motionSamples: number[],
  durationSec = RECORDING_DURATION_SEC,
): Promise<BreathingRecordingMetrics> {
  const highPassed = highPassMovingBaseline(motionSamples);
  const filtered = await whittakerEilersSmoothAsync(highPassed);
  const breathCount = detectBreathCycles(filtered);
  const breathsPerMinute = computeBreathsPerMinute(breathCount, durationSec);
  const peakAmplitude =
    filtered.length === 0 ? 0 : Math.max(...filtered.map(Math.abs));

  return {
    breathCount,
    breathsPerMinute,
    durationSec,
    centeredSignal: downsampleSignal(filtered),
    peakAmplitude,
    sampleCount: motionSamples.length,
  };
}

export function buildAuthoritativeMetrics(
  chartMetrics: BreathingRecordingMetrics,
  authoritativeBreathCount: number,
  durationSec: number,
): BreathingRecordingMetrics {
  return {
    ...chartMetrics,
    breathCount: authoritativeBreathCount,
    breathsPerMinute: computeBreathsPerMinute(authoritativeBreathCount, durationSec),
    durationSec,
  };
}

export function formatBreathingOutcome(bpm: number, breathCount: number, durationSec: number): string {
  return `${bpm} BPM (${breathCount} breaths in ${durationSec}s)`;
}

export function evaluateBreathingPrediction(
  prediction: string,
  bpm: number,
  toleranceBpm = 5,
): boolean | null {
  const trimmed = prediction.trim();
  if (!trimmed) {
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

  return Math.abs(predicted - bpm) <= toleranceBpm;
}

export function buildPhaseResult(
  phaseIndex: number,
  prediction: string,
  metrics: BreathingRecordingMetrics,
): BreathingPhaseResult {
  const phase = BREATHING_PHASES[phaseIndex];

  return {
    attemptNumber: phase.attemptNumber,
    conditionLabel: phase.label,
    kind: phase.kind,
    prediction,
    breathsPerMinute: metrics.breathsPerMinute,
    breathCount: metrics.breathCount,
    durationSec: metrics.durationSec,
    sensorMovementSummary: {
      peakAmplitude: metrics.peakAmplitude,
      sampleCount: metrics.sampleCount,
    },
    centeredSignal: metrics.centeredSignal,
    wasCorrect: evaluateBreathingPrediction(prediction, metrics.breathsPerMinute),
  };
}

export function buildMemberAttempt(
  memberName: string,
  memberIndex: number,
  phases: BreathingPhaseResult[],
): BreathingMemberAttempt {
  return {
    memberName,
    memberIndex,
    phases,
  };
}

export function buildSubmissionPayload(memberAttempts: BreathingMemberAttempt[]) {
  const predictions = memberAttempts.flatMap((member) =>
    member.phases.map((phase) => ({
      prediction: phase.prediction,
      outcome: formatBreathingOutcome(phase.breathsPerMinute, phase.breathCount, phase.durationSec),
    })),
  );

  return {
    memberAttempts: memberAttempts.map((member) => ({
      memberName: member.memberName,
      memberIndex: member.memberIndex,
      phases: member.phases.map((phase) => ({
        attemptNumber: phase.attemptNumber,
        conditionLabel: phase.conditionLabel,
        kind: phase.kind,
        prediction: phase.prediction,
        breathsPerMinute: phase.breathsPerMinute,
        breathCount: phase.breathCount,
        durationSec: phase.durationSec,
        sensorMovementSummary: phase.sensorMovementSummary,
        centeredSignal: phase.centeredSignal,
        wasCorrect: phase.wasCorrect,
      })),
    })),
    predictions,
  };
}

export function validateFinalSubmission(
  memberAttempts: BreathingMemberAttempt[],
  memberCount: number,
): { ok: boolean; message?: string } {
  if (memberAttempts.length < memberCount) {
    const remaining = memberCount - memberAttempts.length;
    return {
      ok: false,
      message: `Complete all team members before submitting (${remaining} remaining).`,
    };
  }

  for (const member of memberAttempts) {
    if (member.phases.length < MAX_BREATHING_PHASES) {
      return {
        ok: false,
        message: `${member.memberName} must complete all ${MAX_BREATHING_PHASES} phases.`,
      };
    }

    if (member.phases.some((phase) => !phase.prediction.trim())) {
      return {
        ok: false,
        message: `Please enter a prediction for every phase (${member.memberName}).`,
      };
    }
  }

  return { ok: true };
}

export function getOverallProgress(
  memberAttempts: BreathingMemberAttempt[],
  currentMemberPhases: BreathingPhaseResult[],
  memberCount: number,
): { completed: number; total: number } {
  return {
    completed: memberAttempts.length * MAX_BREATHING_PHASES + currentMemberPhases.length,
    total: memberCount * MAX_BREATHING_PHASES,
  };
}
