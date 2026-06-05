export const MAX_REACTION_PHASES = 3;

export const TRACING_DURATION_SEC = 15;

export const TRACING_START_COUNTDOWN_SEC = 3;

export type TapChallengeStage = 'idle' | 'waiting' | 'ready' | 'tooSoon' | 'complete';

export type TracingChallengeStage = 'idle' | 'tracing' | 'complete';

export interface ReactionPhaseDefinition {
  attemptNumber: 1 | 2 | 3;
  label: string;
  instruction: string;
  kind: 'tap-dominant' | 'tap-non-dominant' | 'tracing';
}

export const REACTION_PHASES: ReactionPhaseDefinition[] = [
  {
    attemptNumber: 1,
    label: 'Dominant Hand Tap Reaction',
    instruction:
      'Hidden target appears after a random delay. Tap it as quickly as possible with your dominant hand. Repeat for each team member.',
    kind: 'tap-dominant',
  },
  {
    attemptNumber: 2,
    label: 'Swapped Hand Tap Reaction',
    instruction:
      'Repeat the reaction challenge using your non-dominant hand. Compare results. Repeat for each team member.',
    kind: 'tap-non-dominant',
  },
  {
    attemptNumber: 3,
    label: 'Tracing Challenge',
    instruction:
      'Follow the moving target with your finger for 15 seconds. Measure accuracy and delay. Repeat for each team member.',
    kind: 'tracing',
  },
];

export interface TracingSample {
  fingerX: number;
  fingerY: number;
  circleX: number;
  circleY: number;
  touching: boolean;
}

export interface ReactionMemberTrial {
  memberName: string;
  memberIndex: number;
  prediction: string;
  outcome: string;
  reactionTimeMs?: number;
  accuracyPercent?: number;
  tracingDurationSec?: number;
  wasCorrect: boolean | null;
}

export interface ReactionPhaseAggregate {
  attemptNumber: 1 | 2 | 3;
  phaseLabel: string;
  kind: ReactionPhaseDefinition['kind'];
  memberTrials: ReactionMemberTrial[];
  groupAverageReactionMs?: number;
  groupAverageAccuracyPercent?: number;
}

export interface ReactionPhaseResult {
  attemptNumber: 1 | 2 | 3;
  phaseLabel: string;
  prediction: string;
  outcome: string;
  reactionTimeMs?: number;
  accuracyPercent?: number;
  tracingDurationSec?: number;
  wasCorrect: boolean | null;
}

export interface TapChallengeState {
  stage: TapChallengeStage;
  reactionTimeMs: number | null;
  message: string;
}

export function createInitialTapChallengeState(): TapChallengeState {
  return {
    stage: 'idle',
    reactionTimeMs: null,
    message: 'Tap Start challenge to begin.',
  };
}

export function createInitialTracingState(): {
  stage: TracingChallengeStage;
  timeRemainingSec: number;
  accuracyPercent: number | null;
  message: string;
} {
  return {
    stage: 'idle',
    timeRemainingSec: TRACING_DURATION_SEC,
    accuracyPercent: null,
    message: 'Tap Start challenge to begin tracing.',
  };
}
