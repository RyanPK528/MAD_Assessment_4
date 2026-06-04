import { Accelerometer, Gyroscope } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import { applySensorThrottle } from '@/utils/sensorThrottler';

export interface StructureDesign {
  label: string;
  folds: number;
  pillars: number;
  maxDisplacementCm: number;
  maxRotationDeg: number;
  prediction: string;
}

export interface EarthquakeState {
  isVibrating: boolean;
  elapsedSec: number;
  currentDisplacementCm: number;
  currentRotationDeg: number;
  maxDisplacementCm: number;
  maxRotationDeg: number;
  designs: StructureDesign[];
  activeDesignIndex: number;
  message: string;
}

const MAX_DESIGNS = 3;
const GRAVITY = 9.8;

export function aggregateDisplacement(accelMag: number, dtSec: number): number {
  const displacementM = Math.max(0, (accelMag - GRAVITY) * dtSec * dtSec * 50);
  return displacementM * 100;
}

export function aggregateRotation(gyroMag: number, dtSec: number): number {
  return Math.abs(gyroMag) * dtSec * (180 / Math.PI);
}

export function rankDesigns(designs: StructureDesign[]): StructureDesign[] {
  return [...designs].sort(
    (a, b) =>
      a.maxDisplacementCm + a.maxRotationDeg - (b.maxDisplacementCm + b.maxRotationDeg),
  );
}

export function createEarthquakeStructureController(onUpdate: (state: EarthquakeState) => void) {
  let state: EarthquakeState = {
    isVibrating: false,
    elapsedSec: 0,
    currentDisplacementCm: 0,
    currentRotationDeg: 0,
    maxDisplacementCm: 0,
    maxRotationDeg: 0,
    designs: [],
    activeDesignIndex: 0,
    message: 'Enter your structure design and start the earthquake test.',
  };

  let accelSub: ReturnType<typeof Accelerometer.addListener> | null = null;
  let gyroSub: ReturnType<typeof Gyroscope.addListener> | null = null;
  let hapticInterval: ReturnType<typeof setInterval> | null = null;
  let elapsedInterval: ReturnType<typeof setInterval> | null = null;
  let testTimeout: ReturnType<typeof setTimeout> | null = null;
  let lastTimestamp = Date.now();
  let draftLabel = '';
  let draftFolds = 4;
  let draftPillars = 4;
  let draftPrediction = '';

  const publish = () => onUpdate({ ...state });

  const clearTimers = () => {
    if (hapticInterval) {
      clearInterval(hapticInterval);
      hapticInterval = null;
    }
    if (elapsedInterval) {
      clearInterval(elapsedInterval);
      elapsedInterval = null;
    }
    if (testTimeout) {
      clearTimeout(testTimeout);
      testTimeout = null;
    }
  };

  const stopSensors = () => {
    accelSub?.remove();
    gyroSub?.remove();
    accelSub = null;
    gyroSub = null;
    applySensorThrottle(Accelerometer, false);
    applySensorThrottle(Gyroscope, false);
  };

  const startVibrationTest = (durationSec = 10) => {
    if (Platform.OS === 'web') {
      state = { ...state, message: 'Sensors unavailable on web.' };
      publish();
      return;
    }

    if (state.isVibrating) {
      return;
    }

    state = {
      ...state,
      isVibrating: true,
      elapsedSec: 0,
      currentDisplacementCm: 0,
      currentRotationDeg: 0,
      maxDisplacementCm: 0,
      maxRotationDeg: 0,
      message: 'Earthquake in progress — keep phone on structure center.',
    };
    publish();

    lastTimestamp = Date.now();
    applySensorThrottle(Accelerometer, true);
    applySensorThrottle(Gyroscope, true);
    Accelerometer.setUpdateInterval(100);
    Gyroscope.setUpdateInterval(100);

    accelSub = Accelerometer.addListener(({ x, y, z }) => {
      const now = Date.now();
      const dt = (now - lastTimestamp) / 1000;
      lastTimestamp = now;
      const mag = Math.sqrt(x * x + y * y + z * z);
      const delta = aggregateDisplacement(mag, dt);
      const newDisp = state.currentDisplacementCm + delta;
      state = {
        ...state,
        currentDisplacementCm: newDisp,
        maxDisplacementCm: Math.max(state.maxDisplacementCm, newDisp),
      };
      publish();
    });

    gyroSub = Gyroscope.addListener(({ x, y, z }) => {
      const now = Date.now();
      const dt = (now - lastTimestamp) / 1000;
      const mag = Math.sqrt(x * x + y * y + z * z);
      const delta = aggregateRotation(mag, dt);
      const newRot = state.currentRotationDeg + delta;
      state = {
        ...state,
        currentRotationDeg: newRot,
        maxRotationDeg: Math.max(state.maxRotationDeg, newRot),
      };
      publish();
    });

    hapticInterval = setInterval(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 200);

    elapsedInterval = setInterval(() => {
      state = { ...state, elapsedSec: state.elapsedSec + 1 };
      publish();
    }, 1000);

    testTimeout = setTimeout(() => {
      stopVibrationTest();
    }, durationSec * 1000);
  };

  const stopVibrationTest = () => {
    clearTimers();
    stopSensors();
    state = {
      ...state,
      isVibrating: false,
      message: `Test complete. Max displacement: ${state.maxDisplacementCm.toFixed(2)} cm, rotation: ${state.maxRotationDeg.toFixed(2)}°`,
    };
    publish();
  };

  const setDraftLabel = (v: string) => {
    draftLabel = v;
  };
  const setDraftFolds = (v: number) => {
    draftFolds = v;
  };
  const setDraftPillars = (v: number) => {
    draftPillars = v;
  };
  const setDraftPrediction = (v: string) => {
    draftPrediction = v;
  };

  const saveDesign = () => {
    if (state.designs.length >= MAX_DESIGNS) {
      state = { ...state, message: 'Maximum 3 designs recorded.' };
      publish();
      return false;
    }

    const design: StructureDesign = {
      label: draftLabel || `Design ${state.designs.length + 1}`,
      folds: draftFolds,
      pillars: draftPillars,
      maxDisplacementCm: state.maxDisplacementCm,
      maxRotationDeg: state.maxRotationDeg,
      prediction: draftPrediction,
    };

    state = {
      ...state,
      designs: [...state.designs, design],
      maxDisplacementCm: 0,
      maxRotationDeg: 0,
      message: `Saved "${design.label}". ${MAX_DESIGNS - state.designs.length - 1} slots remaining.`,
    };
    publish();
    return true;
  };

  const getBestDesign = () => rankDesigns(state.designs)[0] ?? null;

  const stop = () => {
    clearTimers();
    stopSensors();
  };

  return {
    startVibrationTest,
    stopVibrationTest,
    setDraftLabel,
    setDraftFolds,
    setDraftPillars,
    setDraftPrediction,
    saveDesign,
    getBestDesign,
    stop,
    getDraft: () => ({
      label: draftLabel,
      folds: draftFolds,
      pillars: draftPillars,
      prediction: draftPrediction,
    }),
  };
}
