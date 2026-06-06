/**
 * Unit Tests: Parachute Drop Service
 * Tests physics calculations and controller state management for Activity 1.
 */
import {
  computeAverageVelocity,
  computeAcceleration,
  computePhysics,
  createEmptyTrial,
  createParachuteDropController,
  GRAVITY,
  MAX_TRIALS,
} from '@/services/parachuteDropService';

describe('parachuteDropService — Unit Tests', () => {
  describe('computeAverageVelocity', () => {
    it('calculates v = 2h/t for a standard 1m drop in 0.45s', () => {
      const velocity = computeAverageVelocity(1.0, 0.45);
      // v = 2 * 1.0 / 0.45 ≈ 4.44 m/s
      expect(velocity).toBeCloseTo(4.44, 1);
    });

    it('returns 0 when fall time is zero (avoids division by zero)', () => {
      expect(computeAverageVelocity(1.0, 0)).toBe(0);
    });

    it('returns 0 for negative fall time', () => {
      expect(computeAverageVelocity(1.0, -1)).toBe(0);
    });

    it('scales linearly with drop height', () => {
      const v1 = computeAverageVelocity(1.0, 0.5);
      const v2 = computeAverageVelocity(2.0, 0.5);
      expect(v2).toBeCloseTo(v1 * 2, 5);
    });
  });

  describe('computeAcceleration', () => {
    it('calculates a = 2h/t² for a 1m drop in 0.45s', () => {
      const accel = computeAcceleration(1.0, 0.45);
      // a = 2 * 1.0 / 0.45² ≈ 9.88 m/s²
      expect(accel).toBeCloseTo(9.88, 1);
    });

    it('returns 0 for zero time', () => {
      expect(computeAcceleration(1.5, 0)).toBe(0);
    });
  });

  describe('computePhysics (full calculation)', () => {
    it('returns null values when fallTimeSec is null', () => {
      const result = computePhysics(1.0, 0.2, null, 0.05, false, null);
      expect(result.impactSpeedMs).toBeNull();
      expect(result.accelerationMs2).toBeNull();
      expect(result.netForceN).toBeNull();
      expect(result.dragForceN).toBeNull();
      expect(result.gForce).toBeNull();
    });

    it('computes all physics values for a valid drop without bounce', () => {
      const result = computePhysics(1.0, 0.2, 0.45, 0.05, false, null);

      expect(result.impactSpeedMs).not.toBeNull();
      expect(result.impactSpeedMs!).toBeGreaterThan(0);
      expect(result.accelerationMs2!).toBeGreaterThan(0);
      expect(result.netForceN!).toBeGreaterThan(0);
      expect(result.dragForceN!).toBeGreaterThanOrEqual(0);
      // g-force = impactSpeed / (contactTime * 9.8)
      expect(result.gForce!).toBeGreaterThan(0);
    });

    it('computes higher g-force when object bounces', () => {
      const noBounce = computePhysics(1.0, 0.2, 0.45, 0.05, false, null);
      const withBounce = computePhysics(1.0, 0.2, 0.45, 0.05, true, 1.5);

      // Bouncing increases delta-v, so g-force should be higher
      expect(withBounce.gForce!).toBeGreaterThan(noBounce.gForce!);
    });

    it('returns null gForce when contactTime is missing', () => {
      const result = computePhysics(1.0, 0.2, 0.45, null, false, null);
      expect(result.gForce).toBeNull();
      // Other physics values should still be computed
      expect(result.impactSpeedMs).not.toBeNull();
    });
  });

  describe('createEmptyTrial', () => {
    it('creates baseline trial at index 0', () => {
      const trial = createEmptyTrial(0);
      expect(trial.label).toBe('No parachute (baseline)');
      expect(trial.fallTimeSec).toBeNull();
      expect(trial.videoUri).toBeNull();
    });

    it('creates design trial at index > 0', () => {
      const trial = createEmptyTrial(1);
      expect(trial.label).toBe('Design 1');
    });
  });
});
