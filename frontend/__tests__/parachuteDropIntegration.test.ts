/**
 * Integration / End-to-End Tests: Parachute Drop Activity Flow
 * Tests the complete workflow from setup → recording → physics → submission.
 * This simulates the full user journey through Activity 1.
 */
import {
  createParachuteDropController,
  createEmptyTrial,
  ParachuteDropState,
  GRAVITY,
} from '@/services/parachuteDropService';

describe('Parachute Drop — Integration Test (Full Activity Flow)', () => {
  let states: ParachuteDropState[];
  let controller: ReturnType<typeof createParachuteDropController>;

  beforeEach(() => {
    states = [];
    controller = createParachuteDropController((state) => {
      states.push(state);
    });
  });

  afterEach(() => {
    controller.stop();
  });

  it('completes a full 3-trial experiment with physics calculations', () => {
    // ─── STEP 1: Setup phase — configure drop parameters ───
    controller.setDropHeight(1.2);
    controller.setMass(0.15);

    const setupState = states[states.length - 1];
    expect(setupState.dropHeightM).toBe(1.2);
    expect(setupState.toyMassKg).toBe(0.15);
    expect(setupState.phase).toBe('setup');

    // ─── STEP 2: Begin trials ───
    controller.setPhase('recording');
    expect(states[states.length - 1].phase).toBe('recording');

    // ─── STEP 3: Trial 1 — No parachute (baseline) ───
    controller.setActiveTrial(0);
    controller.updateActiveTrial({ label: 'No parachute (baseline)', prediction: '0.5s' });
    // Simulate a drop with manually set fall time (as if timer ran)
    controller.updateActiveTrial({ fallTimeSec: 0.495 });
    controller.updateActiveTrial({ contactTimeSec: 0.03 });

    let trial1State = states[states.length - 1];
    const trial1 = trial1State.trials[0];
    expect(trial1.fallTimeSec).toBe(0.495);
    expect(trial1.impactSpeedMs).not.toBeNull();
    expect(trial1.impactSpeedMs!).toBeGreaterThan(0);
    expect(trial1.gForce).not.toBeNull();
    expect(trial1.gForce!).toBeGreaterThan(1); // Should be several g's for a fast drop

    // ─── STEP 4: Trial 2 — With parachute ───
    controller.setActiveTrial(1);
    controller.updateActiveTrial({ label: 'Plastic bag parachute', prediction: '1.2s' });
    controller.updateActiveTrial({ fallTimeSec: 1.1 });
    controller.updateActiveTrial({ contactTimeSec: 0.08 });

    const trial2State = states[states.length - 1];
    const trial2 = trial2State.trials[1];
    expect(trial2.fallTimeSec).toBe(1.1);
    // Parachute should result in SLOWER impact speed than no parachute
    expect(trial2.impactSpeedMs!).toBeLessThan(trial1.impactSpeedMs!);
    // Lower g-force with parachute (slower landing + longer contact)
    expect(trial2.gForce!).toBeLessThan(trial1.gForce!);

    // ─── STEP 5: Trial 3 — Improved design ───
    controller.setActiveTrial(2);
    controller.updateActiveTrial({ label: 'Large paper parachute', prediction: '1.5s' });
    controller.updateActiveTrial({ fallTimeSec: 1.45 });
    controller.updateActiveTrial({ contactTimeSec: 0.1 });

    const trial3State = states[states.length - 1];
    const trial3 = trial3State.trials[2];
    // Best design should be slowest
    expect(trial3.impactSpeedMs!).toBeLessThan(trial2.impactSpeedMs!);

    // ─── STEP 6: Verify drag force increases with better parachute ───
    // More drag = slower fall = parachute working better
    expect(trial3.dragForceN!).toBeGreaterThan(trial1.dragForceN!);

    // ─── STEP 7: Video URI can be attached ───
    controller.setActiveTrial(0);
    controller.setVideoUri('file:///data/video/trial1.mp4');
    const videoState = states[states.length - 1];
    expect(videoState.trials[0].videoUri).toBe('file:///data/video/trial1.mp4');

    // ─── STEP 8: Build submission payload ───
    const finalState = states[states.length - 1];
    const submissionData = {
      dropHeightM: finalState.dropHeightM,
      toyMassKg: finalState.toyMassKg,
      trials: finalState.trials,
      sessionTimerSec: finalState.sessionTimerSec,
    };

    expect(submissionData.trials).toHaveLength(3);
    expect(submissionData.trials.filter((t) => t.fallTimeSec !== null)).toHaveLength(3);
    expect(submissionData.dropHeightM).toBe(1.2);
    expect(submissionData.toyMassKg).toBe(0.15);
  });

  it('enforces session timer and drop timer lifecycle', async () => {
    // ─── Start session timer ───
    controller.startSessionTimer();
    let timerState = states[states.length - 1];
    expect(timerState.sessionRunning).toBe(true);

    // Wait 2 seconds to verify timer increments
    await new Promise((resolve) => setTimeout(resolve, 2100));
    timerState = states[states.length - 1];
    expect(timerState.sessionTimerSec).toBeGreaterThanOrEqual(2);

    // ─── Stop session timer ───
    controller.stopSessionTimer();
    timerState = states[states.length - 1];
    expect(timerState.sessionRunning).toBe(false);

    // ─── Drop timer records precise fall time ───
    controller.startDropTimer();
    expect(states[states.length - 1].dropTimerRunning).toBe(true);

    await new Promise((resolve) => setTimeout(resolve, 500));
    controller.stopDropTimer();

    const dropState = states[states.length - 1];
    expect(dropState.dropTimerRunning).toBe(false);
    expect(dropState.phase).toBe('review');
    // Fall time should be approximately 0.5s
    expect(dropState.trials[0].fallTimeSec!).toBeGreaterThan(0.4);
    expect(dropState.trials[0].fallTimeSec!).toBeLessThan(0.7);
  }, 10000);
});
