import { Accelerometer, Gyroscope, GyroscopeMeasurement } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface SensorReading {
  acceleration: Vector3;
  rotation: Vector3;
  timestamp: number;
}

export interface MotionLabState {
  acceleration: Vector3;
  rotation: Vector3;
  smoothnessScore: number;
  breachCount: number;
  isBreachActive: boolean;
  lastUpdateAt: number;
  isRecording: boolean;
  recordedSensorData: SensorReading[];
  elapsedRecordingTime: number;
}

const computeDelta = (current: Vector3, previous: Vector3): number => {
  const dx = current.x - previous.x;
  const dy = current.y - previous.y;
  const dz = current.z - previous.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

const safeNormalize = (value: number): number => Math.max(0, Math.min(100, 100 - value));

export function createMotionLabController(onUpdate: (state: MotionLabState) => void) {
  let accelerometerSubscription: ReturnType<typeof Accelerometer.addListener> | null = null;
  let gyroscopeSubscription: ReturnType<typeof Gyroscope.addListener> | null = null;
  let lastAcceleration: Vector3 = { x: 0, y: 0, z: 0 };
  let lastRotation: Vector3 = { x: 0, y: 0, z: 0 };
  let breachCount = 0;
  let isRecording = false;
  let recordedSensorData: SensorReading[] = [];
  let recordingStartTime: number | null = null;
  let timerInterval: ReturnType<typeof setInterval> | null = null;

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
      isRecording,
      recordedSensorData: [...recordedSensorData],
      elapsedRecordingTime: recordingStartTime ? (Date.now() - recordingStartTime) / 1000 : 0,
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
    // Sensors are not available on web; skip initialization
    if (Platform.OS === 'web') {
       
      console.warn('[MotionLab] Accelerometer and Gyroscope not available on web platform');
      return;
    }

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

      if (isRecording) {
        recordedSensorData.push({
          acceleration: currentAcceleration,
          rotation: { ...lastRotation },
          timestamp: Date.now(),
        });
      }

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

  const startRecording = () => {
    isRecording = true;
    recordedSensorData = [];
    recordingStartTime = Date.now();
    
    // Start a timer to refresh the UI for the elapsed time display
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      publishState();
    }, 100);
    
    publishState();
  };

  const stopRecording = () => {
    isRecording = false;
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    publishState();
  };

  const resetState = () => {
    stopRecording();
    breachCount = 0;
    recordedSensorData = [];
    recordingStartTime = null;
    publishState();
  };

  return { 
    start, 
    stop, 
    startRecording, 
    stopRecording, 
    resetState 
  };
}
