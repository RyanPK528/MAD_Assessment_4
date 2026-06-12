import {
  BREATHING_PHASES,
  BreathingMemberAttempt,
  BreathingPhaseResult,
  BreathingRecordingMetrics,
  CHART_DISPLAY_SAMPLES,
  MAX_BREATHING_PHASES,
  RECORDING_DURATION_SEC,
} from './breathingTrainerTypes';
import { yieldToEventLoop } from '../utils/cooperativeScheduling';

export {
  BREATHING_PHASES,
  MAX_BREATHING_PHASES,
  RECORDING_DURATION_SEC,
  START_COUNTDOWN_SEC,
} from './breathingTrainerTypes';

export function whittakerEilersSmooth(values: number[], lambda = 8, iterations = 6): number[] {
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
  lambda = 8,
  iterations = 6,
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

export function detectBreaths(values: number[]): number {
  if (values.length < 3) {
    return 0;
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const amplitude = max - min;
  const threshold = amplitude * 0.15;
  const minDistance = 7;

  let breaths = 0;
  let lastPeak = -minDistance;

  for (let i = 1; i < values.length - 1; i += 1) {
    const prev = values[i - 1];
    const current = values[i];
    const next = values[i + 1];
    const isPeak = current > prev && current > next && current > threshold;
    const farEnough = i - lastPeak > minDistance;

    if (isPeak && farEnough) {
      breaths += 1;
      lastPeak = i;
    }
  }

  return breaths;
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
  zSamples: number[],
  elapsedSec: number,
): BreathingRecordingMetrics {
  return analyzeBreathingSignal(zSamples, Math.max(1, elapsedSec));
}

export function analyzeBreathingSignal(
  zSamples: number[],
  durationSec = RECORDING_DURATION_SEC,
): BreathingRecordingMetrics {
  const smoothed = whittakerEilersSmooth(zSamples);
  const centered = centerSignal(smoothed);
  const breathCount = detectBreaths(centered);
  const breathsPerMinute = computeBreathsPerMinute(breathCount, durationSec);
  const peakAmplitude =
    centered.length === 0 ? 0 : Math.max(...centered.map(Math.abs));

  return {
    breathCount,
    breathsPerMinute,
    durationSec,
    centeredSignal: downsampleSignal(centered),
    peakAmplitude,
    sampleCount: zSamples.length,
  };
}

export async function analyzeBreathingSignalAsync(
  zSamples: number[],
  durationSec = RECORDING_DURATION_SEC,
): Promise<BreathingRecordingMetrics> {
  const smoothed = await whittakerEilersSmoothAsync(zSamples);
  const centered = centerSignal(smoothed);
  const breathCount = detectBreaths(centered);
  const breathsPerMinute = computeBreathsPerMinute(breathCount, durationSec);
  const peakAmplitude =
    centered.length === 0 ? 0 : Math.max(...centered.map(Math.abs));

  return {
    breathCount,
    breathsPerMinute,
    durationSec,
    centeredSignal: downsampleSignal(centered),
    peakAmplitude,
    sampleCount: zSamples.length,
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
