/**
 * End-to-End Test (Jest flow): Breathing Pace Trainer (Activity 7)
 * Logic-only: synthetic signal → analysis → member attempts → submission payload.
 */
import {
  analyzeBreathingSignal,
  buildMemberAttempt,
  buildPhaseResult,
  buildSubmissionPayload,
  validateFinalSubmission,
} from '../../backend/services/breathingTrainerLogic';
import { BREATHING_PHASES } from '../../backend/services/breathingTrainerTypes';
import type { BreathingMemberAttempt } from '../../backend/services/breathingTrainerTypes';

const TEAM_MEMBERS = ['Alex', 'Sam'];

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

describe('Breathing Pace Trainer — E2E Test (Full Team Workflow)', () => {
  it('completes 3 phases × 2 members and builds a valid submission payload', () => {
    const memberAttempts: BreathingMemberAttempt[] = [];

    for (let memberIndex = 0; memberIndex < TEAM_MEMBERS.length; memberIndex += 1) {
      const memberName = TEAM_MEMBERS[memberIndex];
      const phases = BREATHING_PHASES.map((_, phaseIndex) => {
        const breathCount = 6 + phaseIndex + memberIndex;
        const zSamples = buildSyntheticBreathSignal(breathCount);
        const metrics = analyzeBreathingSignal(zSamples, 30);
        const prediction = `${16 + phaseIndex + memberIndex} bpm`;
        return buildPhaseResult(phaseIndex, prediction, metrics);
      });

      memberAttempts.push(buildMemberAttempt(memberName, memberIndex, phases));
    }

    expect(memberAttempts).toHaveLength(2);
    expect(memberAttempts[0].phases).toHaveLength(3);
    expect(memberAttempts[1].phases[0].conditionLabel).toBe(BREATHING_PHASES[0].label);

    const validation = validateFinalSubmission(memberAttempts, TEAM_MEMBERS.length);
    expect(validation.ok).toBe(true);

    const payload = buildSubmissionPayload(memberAttempts);
    expect(payload.memberAttempts).toHaveLength(2);
    expect(payload.predictions).toHaveLength(6);
    expect(payload.predictions[0].prediction).toContain('bpm');
    expect(payload.predictions[0].outcome).toMatch(/BPM/);
  });

  it('rejects submission when a member is missing phases', () => {
    const incomplete: BreathingMemberAttempt[] = [
      buildMemberAttempt('Alex', 0, [
        buildPhaseResult(0, '18 bpm', {
          breathCount: 8,
          breathsPerMinute: 16,
          durationSec: 30,
          centeredSignal: [0.1, 0.2],
          peakAmplitude: 0.3,
          sampleCount: 100,
        }),
      ]),
    ];

    const result = validateFinalSubmission(incomplete, 2);
    expect(result.ok).toBe(false);
    expect(result.message).toContain('Complete all team members');
  });
});
