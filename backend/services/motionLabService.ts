import { Accelerometer, Gyroscope, GyroscopeMeasurement } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import type { Subscription } from 'expo-sensors';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface MotionLabState {
  acceleration: Vector3;
  rotation: Vector3;
  smoothnessScore: number;
  breachCount: number;
  isBreachActive: boolean;
  lastUpdateAt: number;
}

const computeDelta = (current: Vector3, previous: Vector3): number => {
  const dx = current.x - previous.x;
  const dy = current.y - previous.y;
  const dz = current.z - previous.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

const safeNormalize = (value: number): number => Math.max(0, Math.min(100, 100 - value));

export function createMotionLabController(onUpdate: (state: MotionLabState) => void) {
  let accelerometerSubscription: Subscription | null = null;
  let gyroscopeSubscription: Subscription | null = null;
  let lastAcceleration: Vector3 = { x: 0, y: 0, z: 0 };
  let lastRotation: Vector3 = { x: 0, y: 0, z: 0 };
  let breachCount = 0;

  const publishState = () => {
    const smoothnessScore = safeNormalize(
      computeDelta(lastAcceleration, { x: 0, y: 0, z: 0 }) * 16 + computeDelta(lastRotation, { x: 0, y: 0, z: 0 }) * 12,
    );

    onUpdate({
      acceleration: lastAcceleration,
      rotation: lastRotation,
      smoothnessScore,
      breachCount,
      isBreachActive: smoothnessScore < 40,
      lastUpdateAt: Date.now(),
    });
  };

  const evaluateBreach = (accDelta: number, gyroDelta: number) => {
    const breach = accDelta > 1.2 || gyroDelta > 1.1;
    if (breach) {
      breachCount += 1;
      void Haptics.selectionAsync();
    }
    return breach;
  };

  const start = () => {
    Accelerometer.setUpdateInterval(100);
    Gyroscope.setUpdateInterval(100);

    accelerometerSubscription = Accelerometer.addListener((acceleration) => {
      const currentAcceleration: Vector3 = {
        x: acceleration.x,
        y: acceleration.y,
        z: acceleration.z,
      };

      const accelDelta = computeDelta(currentAcceleration, lastAcceleration);
      lastAcceleration = currentAcceleration;

      evaluateBreach(accelDelta, 0);
      publishState();
    });

    gyroscopeSubscription = Gyroscope.addListener((rotation) => {
      const currentRotation: Vector3 = {
        x: rotation.x,
        y: rotation.y,
        z: rotation.z,
      };

      const gyroDelta = computeDelta(currentRotation, lastRotation);
      lastRotation = currentRotation;

      evaluateBreach(0, gyroDelta);
      publishState();
    });
  };

  const stop = () => {
    accelerometerSubscription?.remove();
    gyroscopeSubscription?.remove();
    accelerometerSubscription = null;
    gyroscopeSubscription = null;
    Accelerometer.setUpdateInterval(1000);
    Gyroscope.setUpdateInterval(1000);
  };

  return { start, stop };
}
