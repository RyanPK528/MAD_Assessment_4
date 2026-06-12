import { Accelerometer } from 'expo-sensors';
import type { Subscription } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import {
  computeMagnitude,
  decreaseSmoothness,
  magnitudeDelta,
  smoothSignal,
} from '../utils/motionAnalysis';
import { createBatchProcessor, yieldToEventLoop } from '../utils/cooperativeScheduling';
import {
  JERK_DELTA_THRESHOLD,
  MOVEMENT_PHASES,
  SMOOTHNESS_DECAY_FACTOR,
  StretchLabState,
  createInitialStretchLabState,
} from './humanPerformanceTypes';

export {
  buildAttemptResult,
  buildSubmissionPayload,
  evaluatePrediction,
  validateFinalSubmission,
} from './humanPerformanceLogic';

export {
  JERK_DELTA_THRESHOLD,
  MAX_STRETCH_ATTEMPTS,
  MOVEMENT_PHASES,
  SMOOTHNESS_DECAY_FACTOR,
  createInitialStretchLabState,
} from './humanPerformanceTypes';

export type { MovementPhase, StretchAttemptResult, StretchLabState, StretchRecordingState } from './humanPerformanceTypes';

export { formatRecordingTime, formatOutcome, deltaToMillimeters } from '../utils/motionAnalysis';

const COUNTDOWN_START = 3;

type AccelSample = { x: number; y: number; z: number };

export function createStretchLabController(onUpdate: (state: StretchLabState) => void) {
  let state = createInitialStretchLabState();
  let accelerometerSubscription: Subscription | null = null;
  let countdownTimer: ReturnType<typeof setTimeout> | null = null;
  let elapsedTimer: ReturnType<typeof setInterval> | null = null;
  let sampleTimer: ReturnType<typeof setInterval> | null = null;
  let recordingStartedAt: number | null = null;
  let previousMagnitude = 0;
  let deltaSamples: number[] = [];

  const publish = () => {
    onUpdate({ ...state, graphSamples: [...state.graphSamples] });
  };

  const clearCountdownTimer = () => {
    if (countdownTimer) {
      clearTimeout(countdownTimer);
      countdownTimer = null;
    }
  };

  const clearElapsedTimer = () => {
    if (elapsedTimer) {
      clearInterval(elapsedTimer);
      elapsedTimer = null;
    }
  };

  const clearSampleTimer = () => {
    if (sampleTimer) {
      clearInterval(sampleTimer);
      sampleTimer = null;
    }
  };

  const stopSensors = () => {
    accelerometerSubscription?.remove();
    accelerometerSubscription = null;
    accelBatch.stop();
    if (Platform.OS !== 'web') {
      Accelerometer.setUpdateInterval(1000);
    }
  };

  const updateElapsed = () => {
    if (recordingStartedAt === null) {
      return;
    }

    state.elapsedSec = Math.floor((Date.now() - recordingStartedAt) / 1000);
  };

  const resetAttemptMetrics = () => {
    previousMagnitude = 0;
    deltaSamples = [];
    recordingStartedAt = null;
    state.vibrationEvents = 0;
    state.smoothnessScore = 100;
    state.largestDelta = 0;
    state.graphSamples = [];
    state.elapsedSec = 0;
  };

  const handleSample = (x: number, y: number, z: number) => {
    const magnitude = computeMagnitude(x, y, z);
    const delta = magnitudeDelta(magnitude, previousMagnitude);
    previousMagnitude = magnitude;

    deltaSamples.push(delta);

    if (delta > JERK_DELTA_THRESHOLD) {
      state.vibrationEvents += 1;
      state.largestDelta = Math.max(state.largestDelta, delta);
      if (Platform.OS !== 'web') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }

    state.smoothnessScore = decreaseSmoothness(
      state.smoothnessScore,
      delta,
      SMOOTHNESS_DECAY_FACTOR,
    );
  };

  const accelBatch = createBatchProcessor<AccelSample>((batch) => {
    for (const { x, y, z } of batch) {
      handleSample(x, y, z);
    }
    state.graphSamples = smoothSignal(deltaSamples.slice(-60));
    publish();
  }, 200);

  const subscribeAccelerometer = () => {
    if (Platform.OS === 'web') {
      sampleTimer = setInterval(() => {
        accelBatch.push({ x: 0, y: 0, z: 9.8 + Math.random() * 0.5 });
      }, 100);
      return;
    }

    Accelerometer.setUpdateInterval(100);
    accelerometerSubscription = Accelerometer.addListener(({ x, y, z }) => {
      accelBatch.push({ x, y, z });
    });
  };

  const finishRecording = () => {
    if (state.recordingState !== 'recording') {
      return;
    }

    if (recordingStartedAt !== null) {
      state.elapsedSec = Math.max(0, Math.round((Date.now() - recordingStartedAt) / 1000));
      recordingStartedAt = null;
    }

    stopSensors();
    clearSampleTimer();
    clearElapsedTimer();

    void (async () => {
      if (deltaSamples.length > 200) {
        await yieldToEventLoop();
      }
      state.graphSamples = smoothSignal(deltaSamples.slice(-60));
      state.recordingState = 'completed';
      publish();
    })();
  };

  const startRecordingInternal = () => {
    resetAttemptMetrics();
    state.recordingState = 'recording';
    state.countdown = null;
    recordingStartedAt = Date.now();
    subscribeAccelerometer();
    elapsedTimer = setInterval(() => {
      updateElapsed();
      publish();
    }, 250);
    publish();
  };

  const tickCountdown = () => {
    if (state.countdown === null) {
      return;
    }

    if (state.countdown <= 1) {
      clearCountdownTimer();
      startRecordingInternal();
      return;
    }

    state.countdown -= 1;
    publish();

    countdownTimer = setTimeout(tickCountdown, 1000);
  };

  const startCountdown = () => {
    if (state.recordingState !== 'idle') {
      return;
    }

    resetAttemptMetrics();
    state.countdown = COUNTDOWN_START;
    state.recordingState = 'countdown';
    publish();
    countdownTimer = setTimeout(tickCountdown, 1000);
  };

  const preparePhase = (phaseIndex: number) => {
    stopSensors();
    clearCountdownTimer();
    clearElapsedTimer();
    clearSampleTimer();
    state = createInitialStretchLabState();
    state.phaseIndex = Math.max(0, Math.min(phaseIndex, MOVEMENT_PHASES.length - 1));
    publish();
  };

  const advancePhase = () => {
    const nextIndex = state.phaseIndex + 1;
    if (nextIndex >= MOVEMENT_PHASES.length) {
      return false;
    }
    preparePhase(nextIndex);
    return true;
  };

  const resetPhaseToIdle = () => {
    stopSensors();
    clearCountdownTimer();
    clearElapsedTimer();
    clearSampleTimer();
    resetAttemptMetrics();
    state.recordingState = 'idle';
    state.countdown = null;
    publish();
  };

  const dispose = () => {
    stopSensors();
    clearCountdownTimer();
    clearElapsedTimer();
    clearSampleTimer();
  };

  publish();

  return {
    startCountdown,
    finishRecording,
    preparePhase,
    advancePhase,
    resetPhaseToIdle,
    getState: () => ({ ...state, graphSamples: [...state.graphSamples] }),
    dispose,
  };
}
