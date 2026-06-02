import type { Accelerometer, Gyroscope, Magnetometer, Barometer } from 'expo-sensors';

export type SensorWithUpdateInterval =
  | typeof Accelerometer
  | typeof Gyroscope
  | typeof Magnetometer
  | typeof Barometer;

export function applySensorThrottle(sensor: SensorWithUpdateInterval, active: boolean): void {
  try {
    sensor.setUpdateInterval(active ? 100 : 1000);
  } catch {
    // Sensor may not be available on the current device.
  }
}