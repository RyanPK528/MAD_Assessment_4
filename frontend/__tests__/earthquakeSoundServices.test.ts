/**
 * Unit Tests: Earthquake Structure & Sound Pollution Services
 * Tests sensor data processing and sound classification for Activities 2 & 4.
 */
import {
  aggregateDisplacement,
  aggregateRotation,
  rankDesigns,
  StructureDesign,
} from '@/services/earthquakeStructureService';

import {
  classifyRisk,
  getRiskLabel,
  normalizeMeteringToDb,
} from '@/services/soundPollutionService';

describe('earthquakeStructureService — Unit Tests', () => {
  describe('aggregateDisplacement', () => {
    it('returns zero displacement when acceleration equals gravity (at rest)', () => {
      // At rest, magnitude ≈ 1.0g, so dynamic component = 0
      const displacement = aggregateDisplacement(1.0, 0.1);
      expect(displacement).toBe(0);
    });

    it('returns zero for small vibrations within deadzone (phone self-vibration)', () => {
      // 1.1g is only 0.1g above rest — below the 0.15g deadzone
      const displacement = aggregateDisplacement(1.1, 0.1);
      expect(displacement).toBe(0);
    });

    it('returns positive displacement when phone is shaken beyond deadzone', () => {
      // Shaking: magnitude = 1.5g → dynamic = 0.5g, above 0.15g deadzone
      const displacement = aggregateDisplacement(1.5, 0.1);
      expect(displacement).toBeGreaterThan(0);
    });

    it('returns positive displacement when accel is well below 1g', () => {
      // Below gravity: magnitude = 0.5g → |0.5 - 1.0| = 0.5g, above deadzone
      const displacement = aggregateDisplacement(0.5, 0.1);
      expect(displacement).toBeGreaterThan(0);
    });

    it('displacement scales with dt squared', () => {
      const d1 = aggregateDisplacement(2.0, 0.1);
      const d2 = aggregateDisplacement(2.0, 0.2);
      // d2 should be ~4x d1 (dt² relationship)
      expect(d2 / d1).toBeCloseTo(4, 1);
    });
  });

  describe('aggregateRotation', () => {
    it('returns 0 for small gyro readings within deadzone', () => {
      // 0.2 rad/s is below the 0.3 rad/s deadzone
      expect(aggregateRotation(0.2, 1.0)).toBe(0);
    });

    it('converts gyroscope magnitude to degrees over time (above deadzone)', () => {
      // 1.3 rad/s for 1 second: filtered = 1.3 - 0.3 = 1.0 rad/s → ~57.3°
      const rotation = aggregateRotation(1.3, 1.0);
      expect(rotation).toBeCloseTo(57.3, 0);
    });

    it('returns 0 for zero gyro reading', () => {
      expect(aggregateRotation(0, 0.1)).toBe(0);
    });

    it('scales linearly with time', () => {
      const r1 = aggregateRotation(2.0, 0.1);
      const r2 = aggregateRotation(2.0, 0.2);
      expect(r2).toBeCloseTo(r1 * 2, 5);
    });
  });

  describe('rankDesigns', () => {
    it('ranks designs by combined displacement + rotation (lowest first)', () => {
      const designs: StructureDesign[] = [
        { label: 'A', folds: 4, pillars: 4, maxDisplacementCm: 5, maxRotationDeg: 10, prediction: '' },
        { label: 'B', folds: 8, pillars: 6, maxDisplacementCm: 2, maxRotationDeg: 3, prediction: '' },
        { label: 'C', folds: 6, pillars: 5, maxDisplacementCm: 3, maxRotationDeg: 5, prediction: '' },
      ];

      const ranked = rankDesigns(designs);
      expect(ranked[0].label).toBe('B'); // 2+3=5 (lowest)
      expect(ranked[1].label).toBe('C'); // 3+5=8
      expect(ranked[2].label).toBe('A'); // 5+10=15 (highest)
    });

    it('does not mutate original array', () => {
      const designs: StructureDesign[] = [
        { label: 'X', folds: 1, pillars: 1, maxDisplacementCm: 10, maxRotationDeg: 10, prediction: '' },
        { label: 'Y', folds: 1, pillars: 1, maxDisplacementCm: 1, maxRotationDeg: 1, prediction: '' },
      ];
      const original = [...designs];
      rankDesigns(designs);
      expect(designs).toEqual(original);
    });
  });
});

describe('soundPollutionService — Unit Tests', () => {
  describe('classifyRisk', () => {
    it('classifies quiet sounds as safe', () => {
      expect(classifyRisk(30)).toBe('safe');
      expect(classifyRisk(59)).toBe('safe');
    });

    it('classifies moderate sounds as fatigue risk', () => {
      expect(classifyRisk(60)).toBe('fatigue');
      expect(classifyRisk(84)).toBe('fatigue');
    });

    it('classifies loud sounds as damage risk', () => {
      expect(classifyRisk(85)).toBe('damage');
      expect(classifyRisk(99)).toBe('damage');
    });

    it('classifies very loud sounds as pain risk', () => {
      expect(classifyRisk(100)).toBe('pain');
      expect(classifyRisk(119)).toBe('pain');
    });

    it('classifies extreme sounds as severe risk', () => {
      expect(classifyRisk(120)).toBe('severe');
      expect(classifyRisk(140)).toBe('severe');
    });
  });

  describe('getRiskLabel', () => {
    it('returns human-readable labels for each risk level', () => {
      expect(getRiskLabel('safe')).toContain('Safe');
      expect(getRiskLabel('damage')).toContain('damage');
      expect(getRiskLabel('severe')).toContain('severe');
    });
  });

  describe('normalizeMeteringToDb', () => {
    it('converts -60 dB metering to ~30 dB display', () => {
      expect(normalizeMeteringToDb(-60)).toBe(30);
    });

    it('converts 0 dB metering to ~120 dB display', () => {
      expect(normalizeMeteringToDb(0)).toBe(120);
    });

    it('clamps values below -60', () => {
      expect(normalizeMeteringToDb(-100)).toBe(30);
    });

    it('clamps values above 0', () => {
      expect(normalizeMeteringToDb(10)).toBe(120);
    });

    it('scales linearly between -60 and 0', () => {
      const mid = normalizeMeteringToDb(-30);
      // -30 is midpoint → should be around 75 dB display
      expect(mid).toBe(75);
    });
  });
});
