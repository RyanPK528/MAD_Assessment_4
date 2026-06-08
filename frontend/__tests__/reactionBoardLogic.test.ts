import {
  buildMemberTrial,
  buildPhaseAggregate,
  buildPhaseResult,
  buildSubmissionPayload,
  calculateGroupAverageAccuracy,
  calculateGroupAverageReactionMs,
  calculateTracingAccuracy,
  evaluateTapPrediction,
  evaluateTracingPrediction,
  validateFinalSubmission,
} from '../../backend/services/reactionBoardLogic';
import { REACTION_PHASES } from '../../backend/services/reactionBoardTypes';

describe('reactionBoardLogic', () => {
  describe('evaluateTapPrediction', () => {
    it('returns true when prediction is within tolerance', () => {
      expect(evaluateTapPrediction('350 ms', 320)).toBe(true);
    });

    it('returns false when prediction is outside tolerance', () => {
      expect(evaluateTapPrediction('200', 350)).toBe(false);
    });

    it('returns null for non-numeric predictions', () => {
      expect(evaluateTapPrediction('fast', 350)).toBeNull();
    });
  });

  describe('evaluateTracingPrediction', () => {
    it('returns true when accuracy prediction is close', () => {
      expect(evaluateTracingPrediction('80%', 85)).toBe(true);
    });

    it('returns false when accuracy prediction differs', () => {
      expect(evaluateTracingPrediction('90', 60)).toBe(false);
    });
  });

  describe('calculateTracingAccuracy', () => {
    it('returns 0 for empty samples', () => {
      expect(calculateTracingAccuracy([])).toBe(0);
    });

    it('returns 0 when finger never touches', () => {
      expect(
        calculateTracingAccuracy([
          { fingerX: 0, fingerY: 0, circleX: 100, circleY: 100, touching: false },
        ]),
      ).toBe(0);
    });

    it('returns high score when finger tracks the target', () => {
      const samples = Array.from({ length: 10 }, () => ({
        fingerX: 50,
        fingerY: 50,
        circleX: 50,
        circleY: 50,
        touching: true,
      }));
      expect(calculateTracingAccuracy(samples)).toBe(100);
    });

    it('returns lower score when finger is far from target', () => {
      const samples = Array.from({ length: 10 }, () => ({
        fingerX: 200,
        fingerY: 200,
        circleX: 50,
        circleY: 50,
        touching: true,
      }));
      expect(calculateTracingAccuracy(samples)).toBeLessThan(50);
    });
  });

  describe('buildMemberTrial', () => {
    it('builds tap member trial with outcome and correctness', () => {
      const trial = buildMemberTrial(0, 'Alex', 0, '300 ms', 310);
      expect(trial.memberName).toBe('Alex');
      expect(trial.outcome).toContain('ms');
      expect(trial.wasCorrect).toBe(true);
    });

    it('builds tracing member trial', () => {
      const trial = buildMemberTrial(2, 'Sam', 1, '75%', undefined, 80, 10);
      expect(trial.accuracyPercent).toBe(80);
      expect(trial.outcome).toContain('80%');
    });

    it('marks incorrect tap prediction outside tolerance', () => {
      const trial = buildMemberTrial(0, 'Jordan', 2, '200 ms', 450);
      expect(trial.wasCorrect).toBe(false);
    });

    it('preserves member index on tap trial', () => {
      const trial = buildMemberTrial(1, 'Casey', 1, '350 ms', 340);
      expect(trial.memberIndex).toBe(1);
      expect(trial.memberName).toBe('Casey');
      expect(trial.reactionTimeMs).toBe(340);
    });
  });

  describe('group averages', () => {
    it('calculates average reaction time across members', () => {
      const trials = [
        buildMemberTrial(0, 'A', 0, '300', 300),
        buildMemberTrial(0, 'B', 1, '400', 400),
      ];
      expect(calculateGroupAverageReactionMs(trials)).toBe(350);
    });

    it('calculates average accuracy across members', () => {
      const trials = [
        buildMemberTrial(2, 'A', 0, '70', undefined, 70, 10),
        buildMemberTrial(2, 'B', 1, '90', undefined, 90, 10),
      ];
      expect(calculateGroupAverageAccuracy(trials)).toBe(80);
    });
  });

  describe('buildPhaseAggregate', () => {
    it('attaches group average for tap phase', () => {
      const aggregate = buildPhaseAggregate(0, [
        buildMemberTrial(0, 'A', 0, '300', 300),
        buildMemberTrial(0, 'B', 1, '500', 500),
      ]);
      expect(aggregate.groupAverageReactionMs).toBe(400);
      expect(aggregate.kind).toBe('tap-dominant');
    });

    it('attaches group average accuracy for tracing phase', () => {
      const aggregate = buildPhaseAggregate(2, [
        buildMemberTrial(2, 'A', 0, '60', undefined, 60, 10),
        buildMemberTrial(2, 'B', 1, '80', undefined, 80, 10),
      ]);
      expect(aggregate.groupAverageAccuracyPercent).toBe(70);
    });
  });

  describe('buildPhaseResult', () => {
    it('builds tap phase result with outcome and correctness', () => {
      const result = buildPhaseResult(0, '300 ms', 310);
      expect(result.attemptNumber).toBe(1);
      expect(result.outcome).toContain('ms');
      expect(result.wasCorrect).toBe(true);
    });
  });

  describe('validateFinalSubmission', () => {
    it('rejects incomplete phase sets', () => {
      const result = validateFinalSubmission(
        [buildPhaseAggregate(0, [buildMemberTrial(0, 'A', 0, '300', 310)])],
        2,
      );
      expect(result.ok).toBe(false);
    });

    it('rejects phases with fewer than memberCount trials', () => {
      const result = validateFinalSubmission(
        [
          buildPhaseAggregate(0, [buildMemberTrial(0, 'A', 0, '300', 310)]),
          buildPhaseAggregate(1, [
            buildMemberTrial(1, 'A', 0, '300', 310),
            buildMemberTrial(1, 'B', 1, '400', 390),
          ]),
          buildPhaseAggregate(2, [
            buildMemberTrial(2, 'A', 0, '70', undefined, 75, 10),
            buildMemberTrial(2, 'B', 1, '80', undefined, 85, 10),
          ]),
        ],
        2,
      );
      expect(result.ok).toBe(false);
    });

    it('accepts three completed phases with all members', () => {
      const memberCount = 2;
      const makeTapPhase = (phaseIndex: number) =>
        buildPhaseAggregate(phaseIndex, [
          buildMemberTrial(phaseIndex, 'A', 0, '300', 310),
          buildMemberTrial(phaseIndex, 'B', 1, '400', 390),
        ]);
      const phases = [
        makeTapPhase(0),
        makeTapPhase(1),
        buildPhaseAggregate(2, [
          buildMemberTrial(2, 'A', 0, '70', undefined, 75, 10),
          buildMemberTrial(2, 'B', 1, '80', undefined, 85, 10),
        ]),
      ];
      expect(validateFinalSubmission(phases, memberCount).ok).toBe(true);
      expect(buildSubmissionPayload(phases).phases).toHaveLength(3);
      expect(buildSubmissionPayload(phases).phases[0].memberTrials).toHaveLength(2);
    });
  });
});
