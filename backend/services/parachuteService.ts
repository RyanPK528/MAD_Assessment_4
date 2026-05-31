import { Barometer, Accelerometer } from 'expo-sensors';
import { Platform } from 'react-native';
import type { Subscription } from 'expo-sensors';
import { applySensorThrottle } from '../utils/sensorThrottler';

// ── Types ───────────────────────────────────────────────────────────────────

export type DropPhase = 'idle' | 'calibrating' | 'armed' | 'dropping' | 'landed' | 'complete';

export interface ParachuteDropState {
  phase: DropPhase;
  /** Pressure in hPa */
  pressureHpa: number;
  /** Altitude relative to launch point in metres (positive = above launch) */
  relativeAltitudeM: number;
  /** Peak altitude recorded during the drop (m) */
  peakAltitudeM: number;
  /** Vertical descent speed in m/s (positive = descending) */
  descentSpeedMs: number;
  /** Score 0-100. Higher = slower, more stable descent. */
  score: number;
  /** How many seconds the payload has been descending */
  descentSeconds: number;
  message: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

/** The standard lapse rate: 1 hPa ≈ 8.43 m altitude change */
const HPA_TO_METRES = 8.43;

/** A descent is "stable" below this vertical speed (m/s) */
const STABLE_SPEED_THRESHOLD = 1.5;

/** We consider the parachute "landed" when vertical speed drops below this for 2 s */
const LANDED_SPEED_THRESHOLD = 0.25;

// ── Factory ──────────────────────────────────────────────────────────────────

export function createParachuteDropController(
  onUpdate: (state: ParachuteDropState) => void,
) {
  let barometerSubscription: Subscription | null = null;
  let accelSubscription: Subscription | null = null;
  let intervalHandle: ReturnType<typeof setInterval> | null = null;

  let phase: DropPhase = 'idle';
  let baselinePressure: number | null = null;
  let lastPressure = 1013.25;
  let pressureSamples: number[] = [];

  let relativeAltitude = 0;
  let peakAltitude = 0;
  let lastAltitude = 0;
  let descentSpeed = 0;
  let descentSeconds = 0;
  let stableSeconds = 0;
  let score = 100;

  // ── Helpers ────────────────────────────────────────────────────────────────

  const pressureToAltitude = (pressure: number): number => {
    if (baselinePressure === null) return 0;
    // Higher pressure → lower altitude (inverse)
    return (baselinePressure - pressure) * HPA_TO_METRES;
  };

  const computeScore = (speedMs: number, durationS: number): number => {
    // Reward slow, stable descents. Penalise fast drops.
    const speedPenalty = Math.min(60, speedMs * 20);
    const stabilityBonus = stableSeconds * 2;
    return Math.max(0, Math.min(100, 100 - speedPenalty + stabilityBonus));
  };

  const buildMessage = (): string => {
    switch (phase) {
      case 'idle':
        return 'Place device flat. Press Start to calibrate baseline pressure.';
      case 'calibrating':
        return 'Calibrating… hold the device steady.';
      case 'armed':
        return 'Ready! Raise the device to launch altitude, then release.';
      case 'dropping':
        return `Descent in progress – ${descentSeconds}s elapsed. Vertical speed: ${descentSpeed.toFixed(2)} m/s`;
      case 'landed':
        return 'Payload landed! Reviewing descent data…';
      case 'complete':
        return `Challenge complete! Score: ${score} / 100`;
      default:
        return '';
    }
  };

  const publish = (): void => {
    onUpdate({
      phase,
      pressureHpa: lastPressure,
      relativeAltitudeM: relativeAltitude,
      peakAltitudeM: peakAltitude,
      descentSpeedMs: descentSpeed,
      score,
      descentSeconds,
      message: buildMessage(),
    });
  };

  // ── Core tick (every second) ───────────────────────────────────────────────

  const tick = (): void => {
    if (phase !== 'dropping') return;

    descentSeconds += 1;

    const currentAlt = pressureToAltitude(lastPressure);
    relativeAltitude = currentAlt;

    // Descent speed: positive when falling (altitude decreasing)
    descentSpeed = Math.max(0, lastAltitude - currentAlt);
    lastAltitude = currentAlt;

    if (currentAlt > peakAltitude) peakAltitude = currentAlt;

    if (descentSpeed < STABLE_SPEED_THRESHOLD) {
      stableSeconds += 1;
    }

    score = computeScore(descentSpeed, descentSeconds);

    // Landing detection: near-zero descent speed for 2 consecutive seconds
    if (descentSpeed < LANDED_SPEED_THRESHOLD) {
      stableSeconds += 1;
      if (stableSeconds >= 2 && descentSeconds >= 3) {
        phase = 'landed';
        stopSensors();
        setTimeout(() => {
          phase = 'complete';
          publish();
        }, 1500);
      }
    }

    publish();
  };

  // ── Sensor management ──────────────────────────────────────────────────────

  const startSensors = (): void => {
    applySensorThrottle(Barometer as any, true);
    applySensorThrottle(Accelerometer, true);

    barometerSubscription = Barometer.addListener(({ pressure }) => {
      lastPressure = pressure ?? 1013.25;

      if (phase === 'calibrating') {
        pressureSamples.push(lastPressure);
        if (pressureSamples.length >= 10) {
          baselinePressure =
            pressureSamples.reduce((s, p) => s + p, 0) / pressureSamples.length;
          pressureSamples = [];
          phase = 'armed';
          publish();
        }
      }

      if (phase === 'armed') {
        const currentAlt = pressureToAltitude(lastPressure);
        // Auto-arm: start drop session when device is lifted >0.3 m
        if (currentAlt > 0.3) {
          phase = 'dropping';
          lastAltitude = currentAlt;
          stableSeconds = 0;
          intervalHandle = setInterval(tick, 1000);
        }
      }

      publish();
    });
  };

  const stopSensors = (): void => {
    barometerSubscription?.remove();
    accelSubscription?.remove();
    barometerSubscription = null;
    accelSubscription = null;
    if (intervalHandle) {
      clearInterval(intervalHandle);
      intervalHandle = null;
    }
    applySensorThrottle(Barometer as any, false);
    applySensorThrottle(Accelerometer, false);
  };

  // ── Public API ─────────────────────────────────────────────────────────────

  const start = (): void => {
    phase = 'calibrating';
    baselinePressure = null;
    pressureSamples = [];
    relativeAltitude = 0;
    peakAltitude = 0;
    descentSpeed = 0;
    descentSeconds = 0;
    stableSeconds = 0;
    score = 100;
    publish();
    startSensors();
  };

  const reset = (): void => {
    stopSensors();
    phase = 'idle';
    publish();
  };

  const stop = (): void => {
    stopSensors();
  };

  publish();

  return { start, reset, stop };
}