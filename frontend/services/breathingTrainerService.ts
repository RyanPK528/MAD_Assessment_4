import { Accelerometer } from 'expo-sensors';
import { Platform } from 'react-native';

export type BreathingPhase = 'Resting' | 'PostExercise1' | 'PostExercise2';

export interface BreathingTrainerState {
  phase: BreathingPhase;
  secondsElapsed: number;
  breathsPerMinute: number;
  breathCount: number;
  message: string;
  isActive: boolean;
}

const computeMagnitude = (x: number, y: number, z: number): number => Math.sqrt(x * x + y * y + z * z);

const detectBreathPeaks = (samples: number[]): number => {
  let peaks = 0;
  for (let i = 1; i < samples.length - 1; i += 1) {
    if (samples[i] > samples[i - 1] && samples[i] > samples[i + 1] && samples[i] > 0.12) {
      peaks += 1;
    }
  }
  return peaks;
};

export function createBreathingTrainerController(onUpdate: (state: BreathingTrainerState) => void) {
  let subscription: ReturnType<typeof Accelerometer.addListener> | null = null;
  let phase: BreathingPhase = 'Resting';
  let secondsElapsed = 0;
  let breathSamples: number[] = [];
  let breathCount = 0;
  let intervalHandle: ReturnType<typeof setInterval> | null = null;

  const getMessage = () => {
    if (phase === 'Resting') {
      return 'Place the phone gently on your chest. Breathe naturally at rest.';
    }
    if (phase === 'PostExercise1') {
      return 'Jog in place for one minute, then keep recording.';
    }
    return 'Complete 100 star jumps, then keep recording.';
  };

  const publish = () => {
    const breathsPerMinute = Math.round((breathCount / Math.max(1, secondsElapsed)) * 60);
    onUpdate({
      phase,
      secondsElapsed,
      breathsPerMinute,
      breathCount,
      message: getMessage(),
      isActive: !!subscription,
    });
  };

  const advancePhase = () => {
    if (phase === 'Resting') {
      phase = 'PostExercise1';
    } else if (phase === 'PostExercise1') {
      phase = 'PostExercise2';
    } else {
      phase = 'Resting';
    }
  };

  const start = () => {
    secondsElapsed = 0;
    breathCount = 0;
    breathSamples = [];
    phase = 'Resting';

    // Sensors not available on web
    if (Platform.OS === 'web') {
       
      console.warn('[BreathingTrainer] Accelerometer not available on web platform');
      intervalHandle = setInterval(() => {
        secondsElapsed += 1;
        if (secondsElapsed === 20 || secondsElapsed === 40 || secondsElapsed === 60) {
          advancePhase();
        }
        publish();
      }, 1000);
      publish();
      return;
    }

    Accelerometer.setUpdateInterval(200);
    subscription = Accelerometer.addListener((acceleration) => {
      const magnitude = computeMagnitude(acceleration.x, acceleration.y, acceleration.z);
      breathSamples.push(magnitude);
      if (breathSamples.length > 20) {
        breathSamples.shift();
      }

      if (breathSamples.length === 20) {
        const peaks = detectBreathPeaks(breathSamples);
        if (peaks > breathCount) {
          breathCount = peaks;
        }
      }
    });

    intervalHandle = setInterval(() => {
      secondsElapsed += 1;
      if (secondsElapsed === 20 || secondsElapsed === 40 || secondsElapsed === 60) {
        advancePhase();
      }
      publish();
    }, 1000);

    publish();
  };

  const stop = () => {
    if (subscription) {
      subscription.remove();
      subscription = null;
    }
    if (intervalHandle) {
      clearInterval(intervalHandle);
      intervalHandle = null;
    }
    Accelerometer.setUpdateInterval(1000);
    publish();
  };

  return {
    start,
    stop,
  };
}
