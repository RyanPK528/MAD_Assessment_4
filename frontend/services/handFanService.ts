import { Accelerometer } from 'expo-sensors';
import { Platform } from 'react-native';

import { applySensorThrottle } from '@/utils/sensorThrottler';

export type FanMaterial = 'paper' | 'cardboard';
export type FanDistanceCm = 15 | 30 | 45;

export interface FanDesign {
  label: string;
  bendAngleDeg: number;
  fanIntensity: number;
  estimatedForceN: number;
  stiffnessK: number;
  distanceCm: FanDistanceCm;
  material: FanMaterial;
  prediction: string;
  notes: string;
}

export interface HandFanState {
  phase: 'idle' | 'fanning' | 'measure';
  fanIntensity: number;
  liveIntensity: number;
  distanceCm: FanDistanceCm;
  material: FanMaterial;
  stiffnessK: number;
  designs: FanDesign[];
  bendAngleDeg: number;
  message: string;
}

export const STIFFNESS_PRESETS: Record<FanMaterial, number> = {
  paper: 0.05,
  cardboard: 0.5,
};

const MAX_DESIGNS = 3;

export function degreesToRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function computeEstimatedForce(stiffnessK: number, bendAngleDeg: number): number {
  return stiffnessK * degreesToRadians(bendAngleDeg);
}

export function createHandFanController(onUpdate: (state: HandFanState) => void) {
  let state: HandFanState = {
    phase: 'idle',
    fanIntensity: 0,
    liveIntensity: 0,
    distanceCm: 30,
    material: 'paper',
    stiffnessK: STIFFNESS_PRESETS.paper,
    designs: [],
    bendAngleDeg: 30,
    message: 'Select material and distance, then fan while holding the phone.',
  };

  let accelSub: ReturnType<typeof Accelerometer.addListener> | null = null;
  let intensitySamples: number[] = [];
  let draftLabel = '';
  let draftPrediction = '';
  let draftNotes = '';

  const publish = () => onUpdate({ ...state });

  const startFanTracking = () => {
    if (Platform.OS === 'web') {
      state = { ...state, message: 'Accelerometer unavailable on web.' };
      publish();
      return;
    }

    intensitySamples = [];
    state = { ...state, phase: 'fanning', liveIntensity: 0, message: 'Fanning — move the phone back and forth.' };
    publish();

    applySensorThrottle(Accelerometer, true);
    Accelerometer.setUpdateInterval(100);

    accelSub = Accelerometer.addListener(({ x, y, z }) => {
      const mag = Math.sqrt(x * x + y * y + z * z);
      const delta = Math.abs(mag - 1);
      intensitySamples.push(delta);
      const avg =
        intensitySamples.length > 0
          ? intensitySamples.reduce((a, b) => a + b, 0) / intensitySamples.length
          : 0;
      state = { ...state, liveIntensity: avg * 100 };
      publish();
    });
  };

  const stopFanTracking = () => {
    accelSub?.remove();
    accelSub = null;
    applySensorThrottle(Accelerometer, false);

    const avg =
      intensitySamples.length > 0
        ? intensitySamples.reduce((a, b) => a + b, 0) / intensitySamples.length
        : 0;
    const intensity = Math.round(avg * 1000) / 10;

    state = {
      ...state,
      phase: 'measure',
      fanIntensity: intensity,
      message: `Fan intensity recorded: ${intensity}. Enter bend angle and save.`,
    };
    publish();
    return intensity;
  };

  const setDistance = (cm: FanDistanceCm) => {
    state = { ...state, distanceCm: cm };
    publish();
  };

  const setMaterial = (material: FanMaterial) => {
    state = {
      ...state,
      material,
      stiffnessK: STIFFNESS_PRESETS[material],
    };
    publish();
  };

  const setBendAngle = (deg: number) => {
    state = { ...state, bendAngleDeg: Math.max(0, Math.min(90, deg)) };
    publish();
  };

  const setDraftLabel = (v: string) => {
    draftLabel = v;
  };
  const setDraftPrediction = (v: string) => {
    draftPrediction = v;
  };
  const setDraftNotes = (v: string) => {
    draftNotes = v;
  };

  const saveDesign = () => {
    if (state.designs.length >= MAX_DESIGNS) {
      state = { ...state, message: 'Maximum 3 designs saved.' };
      publish();
      return false;
    }

    const force = computeEstimatedForce(state.stiffnessK, state.bendAngleDeg);
    const design: FanDesign = {
      label: draftLabel || `Design ${state.designs.length + 1}`,
      bendAngleDeg: state.bendAngleDeg,
      fanIntensity: state.fanIntensity,
      estimatedForceN: Math.round(force * 1000) / 1000,
      stiffnessK: state.stiffnessK,
      distanceCm: state.distanceCm,
      material: state.material,
      prediction: draftPrediction,
      notes: draftNotes,
    };

    state = {
      ...state,
      designs: [...state.designs, design],
      phase: 'idle',
      fanIntensity: 0,
      message: `Saved "${design.label}". Force ≈ ${design.estimatedForceN} N`,
    };
    publish();
    return true;
  };

  const stop = () => {
    accelSub?.remove();
    accelSub = null;
    applySensorThrottle(Accelerometer, false);
  };

  return {
    startFanTracking,
    stopFanTracking,
    setDistance,
    setMaterial,
    setBendAngle,
    setDraftLabel,
    setDraftPrediction,
    setDraftNotes,
    saveDesign,
    stop,
  };
}
