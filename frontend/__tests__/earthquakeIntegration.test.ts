/**
 * Integration / End-to-End Tests: Earthquake Structure & Sound Pollution
 * Tests the complete workflow for Activities 2 and 4 including
 * multi-design comparison and sound action logging with risk assessment.
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
  SoundAction,
} from '@/services/soundPollutionService';

describe('Earthquake Structure — Integration Test (Multi-Design Workflow)', () => {
  it('simulates a full 3-design experiment and ranks the best structure', () => {
    // ─── STEP 1: Simulate sensor data for Design 1 (4 folds, 4 pillars) ───
    // Weak structure: high displacement over 10 seconds of vibration
    let totalDisplacement = 0;
    let totalRotation = 0;
    const dt = 0.1; // 100ms intervals

    // Simulate 100 sensor readings (10 seconds) with high movement
    for (let i = 0; i < 100; i++) {
      // Simulated shaking: magnitude varies between 1.1g and 1.8g
      const accelMag = 1.0 + Math.sin(i * 0.3) * 0.4 + 0.4;
      const gyroMag = Math.sin(i * 0.5) * 2.0;
      totalDisplacement += aggregateDisplacement(accelMag, dt);
      totalRotation += aggregateRotation(Math.abs(gyroMag), dt);
    }

    const design1: StructureDesign = {
      label: '4 folds + 4 pillars',
      folds: 4,
      pillars: 4,
      maxDisplacementCm: totalDisplacement,
      maxRotationDeg: totalRotation,
      prediction: '+/- 4cm',
    };

    // ─── STEP 2: Design 2 (8 folds, 6 pillars) — better structure ───
    totalDisplacement = 0;
    totalRotation = 0;
    for (let i = 0; i < 100; i++) {
      // Less movement due to better structure (damping factor)
      const accelMag = 1.0 + Math.sin(i * 0.3) * 0.2 + 0.1;
      const gyroMag = Math.sin(i * 0.5) * 0.8;
      totalDisplacement += aggregateDisplacement(accelMag, dt);
      totalRotation += aggregateRotation(Math.abs(gyroMag), dt);
    }

    const design2: StructureDesign = {
      label: '8 folds + 6 pillars',
      folds: 8,
      pillars: 6,
      maxDisplacementCm: totalDisplacement,
      maxRotationDeg: totalRotation,
      prediction: '+/- 2cm',
    };

    // ─── STEP 3: Design 3 (10 folds + 8 pillars) — best structure ───
    totalDisplacement = 0;
    totalRotation = 0;
    for (let i = 0; i < 100; i++) {
      // Minimal movement
      const accelMag = 1.0 + Math.sin(i * 0.3) * 0.05 + 0.02;
      const gyroMag = Math.sin(i * 0.5) * 0.3;
      totalDisplacement += aggregateDisplacement(accelMag, dt);
      totalRotation += aggregateRotation(Math.abs(gyroMag), dt);
    }

    const design3: StructureDesign = {
      label: '10 folds + 8 pillars',
      folds: 10,
      pillars: 8,
      maxDisplacementCm: totalDisplacement,
      maxRotationDeg: totalRotation,
      prediction: '+/- 1cm',
    };

    // ─── STEP 4: Rank designs and verify best ───
    const allDesigns = [design1, design2, design3];
    const ranked = rankDesigns(allDesigns);

    // Best design (least total movement) should be Design 3
    expect(ranked[0].label).toBe('10 folds + 8 pillars');
    expect(ranked[0].folds).toBe(10);

    // Worst design should be Design 1
    expect(ranked[2].label).toBe('4 folds + 4 pillars');

    // Verify progressive improvement
    const totalMovement = (d: StructureDesign) => d.maxDisplacementCm + d.maxRotationDeg;
    expect(totalMovement(ranked[0])).toBeLessThan(totalMovement(ranked[1]));
    expect(totalMovement(ranked[1])).toBeLessThan(totalMovement(ranked[2]));

    // ─── STEP 5: Build submission payload ───
    const submission = {
      designs: allDesigns,
      bestDesign: ranked[0],
    };

    expect(submission.designs).toHaveLength(3);
    expect(submission.bestDesign.label).toBe('10 folds + 8 pillars');
    expect(submission.bestDesign.maxDisplacementCm).toBeLessThan(design1.maxDisplacementCm);
  });
});

describe('Sound Pollution — Integration Test (Full Measurement Workflow)', () => {
  it('simulates measuring 3 classroom sounds and building a complete submission', () => {
    // ─── STEP 1: Simulate metering readings from expo-audio ───
    // Raw metering values from the native audio module range from -60 to 0
    const bookDropMetering = -15; // loud impact
    const talkingMetering = -35; // moderate
    const whisperMetering = -52; // quiet

    // ─── STEP 2: Normalize to displayable dB values ───
    const bookDropDb = normalizeMeteringToDb(bookDropMetering);
    const talkingDb = normalizeMeteringToDb(talkingMetering);
    const whisperDb = normalizeMeteringToDb(whisperMetering);

    // Verify relative ordering is correct
    expect(bookDropDb).toBeGreaterThan(talkingDb);
    expect(talkingDb).toBeGreaterThan(whisperDb);

    // Verify range (should be between 30 and 120 dB display)
    expect(whisperDb).toBeGreaterThanOrEqual(30);
    expect(bookDropDb).toBeLessThanOrEqual(120);

    // ─── STEP 3: Classify risk for each sound ───
    const bookDropRisk = classifyRisk(bookDropDb);
    const talkingRisk = classifyRisk(talkingDb);
    const whisperRisk = classifyRisk(whisperDb);

    // Book drop should be in damage/pain range (~97 dB)
    expect(['damage', 'pain']).toContain(bookDropRisk);
    // Normal talking should be safe/fatigue
    expect(['safe', 'fatigue']).toContain(talkingRisk);
    // Whisper should be safe
    expect(whisperRisk).toBe('safe');

    // ─── STEP 4: Build complete action log (simulating 3 measurements) ───
    const actions: SoundAction[] = [
      {
        label: 'Dropping a book on table',
        prediction: 'louder',
        measuredDb: bookDropDb,
        riskLevel: bookDropRisk,
        latitude: -6.22895,
        longitude: 106.79496,
      },
      {
        label: 'Normal talking',
        prediction: 'softer',
        measuredDb: talkingDb,
        riskLevel: talkingRisk,
        latitude: -6.22895,
        longitude: 106.79496,
      },
      {
        label: 'Whispering',
        prediction: 'softer',
        measuredDb: whisperDb,
        riskLevel: whisperRisk,
        latitude: -6.22895,
        longitude: 106.79496,
      },
    ];

    // ─── STEP 5: Validate complete submission structure ───
    expect(actions).toHaveLength(3);

    // Each action has all required fields
    actions.forEach((action) => {
      expect(action.label.length).toBeGreaterThan(0);
      expect(action.measuredDb).toBeGreaterThanOrEqual(30);
      expect(action.riskLevel).toBeDefined();
      expect(getRiskLabel(action.riskLevel).length).toBeGreaterThan(0);
      expect(action.latitude).not.toBeNull();
      expect(action.longitude).not.toBeNull();
    });

    // ─── STEP 6: Verify prediction accuracy would be evaluated ───
    // "Dropping a book" was predicted as 'louder' — it IS the loudest
    const loudest = actions.reduce((max, a) => (a.measuredDb > max.measuredDb ? a : max), actions[0]);
    expect(loudest.label).toBe('Dropping a book on table');
    expect(loudest.prediction).toBe('louder');
  });
});
