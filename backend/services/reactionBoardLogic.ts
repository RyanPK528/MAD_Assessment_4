import {
  MAX_REACTION_PHASES,
  REACTION_PHASES,
  ReactionMemberTrial,
  ReactionPhaseAggregate,
  ReactionPhaseResult,
  TracingSample,
} from './reactionBoardTypes';

export { MAX_REACTION_PHASES, REACTION_PHASES };

const TARGET_RADIUS = 15;
const MAX_PENALTY_DISTANCE = 45;

export function parseNumericValue(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/-?\d+(\.\d+)?/);
  if (!match) {
    return null;
  }

  const value = Number(match[0]);
  return Number.isNaN(value) ? null : value;
}

export function evaluateTapPrediction(
  prediction: string,
  reactionTimeMs: number,
  toleranceMs = 100,
): boolean | null {
  const predicted = parseNumericValue(prediction);
  if (predicted === null) {
    return null;
  }

  return Math.abs(predicted - reactionTimeMs) <= toleranceMs;
}

export function evaluateTracingPrediction(
  prediction: string,
  accuracyPercent: number,
  tolerancePercent = 10,
): boolean | null {
  const predicted = parseNumericValue(prediction);
  if (predicted === null) {
    return null;
  }

  return Math.abs(predicted - accuracyPercent) <= tolerancePercent;
}

export function calculateTracingAccuracy(samples: TracingSample[]): number {
  if (samples.length === 0) {
    return 0;
  }

  let totalAccuracy = 0;

  samples.forEach((sample) => {
    if (!sample.touching) {
      return;
    }

    const dx = sample.fingerX - sample.circleX;
    const dy = sample.fingerY - sample.circleY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= TARGET_RADIUS) {
      totalAccuracy += 100;
      return;
    }

    const distanceOutside = distance - TARGET_RADIUS;
    const penaltyRatio = Math.min(1, distanceOutside / MAX_PENALTY_DISTANCE);
    const accuracyDrop = Math.pow(penaltyRatio, 2) * 100;
    totalAccuracy += Math.max(0, 100 - accuracyDrop);
  });

  const touchingSamples = samples.filter((sample) => sample.touching).length;
  if (touchingSamples === 0) {
    return 0;
  }

  return Math.round(totalAccuracy / touchingSamples);
}

export function formatTapOutcome(reactionTimeMs: number): string {
  return `${Math.round(reactionTimeMs * 10) / 10} ms`;
}

export function formatTracingOutcome(accuracyPercent: number, durationSec: number): string {
  return `${accuracyPercent}% accuracy in ${durationSec} s`;
}

export function buildMemberTrial(
  phaseIndex: number,
  memberName: string,
  memberIndex: number,
  prediction: string,
  reactionTimeMs?: number,
  accuracyPercent?: number,
  tracingDurationSec?: number,
): ReactionMemberTrial {
  const phase = REACTION_PHASES[phaseIndex];
  const isTracing = phase.kind === 'tracing';

  const outcome = isTracing
    ? formatTracingOutcome(accuracyPercent ?? 0, tracingDurationSec ?? 0)
    : formatTapOutcome(reactionTimeMs ?? 0);

  const wasCorrect = isTracing
    ? evaluateTracingPrediction(prediction, accuracyPercent ?? 0)
    : evaluateTapPrediction(prediction, reactionTimeMs ?? 0);

  return {
    memberName,
    memberIndex,
    prediction: prediction.trim(),
    outcome,
    reactionTimeMs: isTracing ? undefined : reactionTimeMs,
    accuracyPercent: isTracing ? accuracyPercent : undefined,
    tracingDurationSec: isTracing ? tracingDurationSec : undefined,
    wasCorrect,
  };
}

export function calculateGroupAverageReactionMs(trials: ReactionMemberTrial[]): number | undefined {
  const values = trials
    .map((trial) => trial.reactionTimeMs)
    .filter((value): value is number => value !== undefined);
  if (values.length === 0) {
    return undefined;
  }
  const sum = values.reduce((total, value) => total + value, 0);
  return Math.round((sum / values.length) * 10) / 10;
}

export function calculateGroupAverageAccuracy(trials: ReactionMemberTrial[]): number | undefined {
  const values = trials
    .map((trial) => trial.accuracyPercent)
    .filter((value): value is number => value !== undefined);
  if (values.length === 0) {
    return undefined;
  }
  const sum = values.reduce((total, value) => total + value, 0);
  return Math.round(sum / values.length);
}

export function buildPhaseAggregate(
  phaseIndex: number,
  memberTrials: ReactionMemberTrial[],
): ReactionPhaseAggregate {
  const phase = REACTION_PHASES[phaseIndex];
  const isTracing = phase.kind === 'tracing';

  return {
    attemptNumber: phase.attemptNumber,
    phaseLabel: phase.label,
    kind: phase.kind,
    memberTrials,
    groupAverageReactionMs: isTracing ? undefined : calculateGroupAverageReactionMs(memberTrials),
    groupAverageAccuracyPercent: isTracing ? calculateGroupAverageAccuracy(memberTrials) : undefined,
  };
}

/** @deprecated Use buildMemberTrial + buildPhaseAggregate for multi-member flow */
export function buildPhaseResult(
  phaseIndex: number,
  prediction: string,
  reactionTimeMs?: number,
  accuracyPercent?: number,
  tracingDurationSec?: number,
): ReactionPhaseResult {
  const phase = REACTION_PHASES[phaseIndex];
  const isTracing = phase.kind === 'tracing';

  const outcome = isTracing
    ? formatTracingOutcome(accuracyPercent ?? 0, tracingDurationSec ?? 0)
    : formatTapOutcome(reactionTimeMs ?? 0);

  const wasCorrect = isTracing
    ? evaluateTracingPrediction(prediction, accuracyPercent ?? 0)
    : evaluateTapPrediction(prediction, reactionTimeMs ?? 0);

  return {
    attemptNumber: phase.attemptNumber,
    phaseLabel: phase.label,
    prediction: prediction.trim(),
    outcome,
    reactionTimeMs: isTracing ? undefined : reactionTimeMs,
    accuracyPercent: isTracing ? accuracyPercent : undefined,
    tracingDurationSec: isTracing ? tracingDurationSec : undefined,
    wasCorrect,
  };
}

export function validateFinalSubmission(
  aggregates: ReactionPhaseAggregate[],
  memberCount: number,
): {
  ok: boolean;
  message?: string;
} {
  if (aggregates.length < MAX_REACTION_PHASES) {
    const remaining = MAX_REACTION_PHASES - aggregates.length;
    return {
      ok: false,
      message: `Complete all ${MAX_REACTION_PHASES} phases before submitting (${remaining} remaining).`,
    };
  }

  for (const aggregate of aggregates) {
    if (aggregate.memberTrials.length < memberCount) {
      return {
        ok: false,
        message: `Phase ${aggregate.attemptNumber} needs ${memberCount} team member result(s) (${aggregate.memberTrials.length} recorded).`,
      };
    }

    if (aggregate.memberTrials.some((trial) => !trial.prediction.trim())) {
      return { ok: false, message: 'Please enter a prediction for every team member in each phase.' };
    }
  }

  return { ok: true };
}

export function buildSubmissionPayload(aggregates: ReactionPhaseAggregate[]) {
  return {
    phases: aggregates.map((aggregate) => ({
      attemptNumber: aggregate.attemptNumber,
      phaseLabel: aggregate.phaseLabel,
      kind: aggregate.kind,
      memberTrials: aggregate.memberTrials,
      groupAverageReactionMs: aggregate.groupAverageReactionMs,
      groupAverageAccuracyPercent: aggregate.groupAverageAccuracyPercent,
    })),
    predictions: aggregates.flatMap((aggregate) =>
      aggregate.memberTrials.map((trial) => ({
        prediction: trial.prediction,
        outcome: trial.outcome,
      })),
    ),
  };
}

export function getRunningGroupAverage(
  phaseIndex: number,
  trials: ReactionMemberTrial[],
): string | null {
  const phase = REACTION_PHASES[phaseIndex];
  if (phase.kind === 'tracing') {
    const avg = calculateGroupAverageAccuracy(trials);
    return avg !== undefined ? `${avg}%` : null;
  }
  const avg = calculateGroupAverageReactionMs(trials);
  return avg !== undefined ? `${avg} ms` : null;
}
