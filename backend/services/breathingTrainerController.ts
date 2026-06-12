import { Accelerometer } from 'expo-sensors';
import type { Subscription } from 'expo-sensors';
import { Platform } from 'react-native';

import {
  analyzeBreathingSignal,
  analyzeBreathingSignalAsync,
  analyzeBreathingSignalLive,
  computeBreathsPerMinute,
  monotonicBreathCount,
  RECORDING_DURATION_SEC,
  START_COUNTDOWN_SEC,
} from './breathingTrainerLogic';
import {
  BREATHING_PHASES,
  BreathingLabState,
  createInitialBreathingLabState,
} from './breathingTrainerTypes';

export {
  buildMemberAttempt,
  buildPhaseResult,
  buildSubmissionPayload,
  evaluateBreathingPrediction,
  formatBreathingOutcome,
  getOverallProgress,
  validateFinalSubmission,
} from './breathingTrainerLogic';

export {
  BREATHING_PHASES,
  MAX_BREATHING_PHASES,
  RECORDING_DURATION_SEC,
  START_COUNTDOWN_SEC,
  createInitialBreathingLabState,
} from './breathingTrainerTypes';

export type {
  BreathingLabState,
  BreathingMemberAttempt,
  BreathingPhaseDefinition,
  BreathingPhaseResult,
  BreathingRecordingMetrics,
  BreathingRecordingState,
} from './breathingTrainerTypes';

export function formatRecordingTime(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return `${min}:${sec < 10 ? '0' : ''}${sec}`;
}

export function createBreathingTrainerController(onUpdate: (state: BreathingLabState) => void) {
  let state = createInitialBreathingLabState();
  let accelerometerSubscription: Subscription | null = null;
  let countdownTimer: ReturnType<typeof setTimeout> | null = null;
  let elapsedTimer: ReturnType<typeof setInterval> | null = null;
  let sampleTimer: ReturnType<typeof setInterval> | null = null;
  let liveMetricsTimer: ReturnType<typeof setInterval> | null = null;
  let zSamples: number[] = [];

  const publish = () => {
    onUpdate({
      ...state,
      centeredSignal: [...state.centeredSignal],
    });
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

  const clearLiveMetricsTimer = () => {
    if (liveMetricsTimer) {
      clearInterval(liveMetricsTimer);
      liveMetricsTimer = null;
    }
  };

  const stopSensors = () => {
    accelerometerSubscription?.remove();
    accelerometerSubscription = null;
    if (Platform.OS !== 'web') {
      Accelerometer.setUpdateInterval(1000);
    }
  };

  const resetRecordingMetrics = () => {
    zSamples = [];
    state.elapsedSec = 0;
    state.breathCount = 0;
    state.breathsPerMinute = 0;
    state.centeredSignal = [];
  };

  const updateLiveMetrics = () => {
    if (zSamples.length === 0) {
      return;
    }

    const durationSec = Math.max(1, state.elapsedSec);
    const metrics = analyzeBreathingSignalLive(zSamples, durationSec);
    state.breathCount = monotonicBreathCount(state.breathCount, metrics.breathCount);
    state.breathsPerMinute = computeBreathsPerMinute(state.breathCount, durationSec);
    state.centeredSignal = metrics.centeredSignal;
    publish();
  };

  const applyAnalysisAsync = async (durationSec: number) => {
    const metrics = await analyzeBreathingSignalAsync(zSamples, durationSec);
    state.breathCount = monotonicBreathCount(state.breathCount, metrics.breathCount);
    state.breathsPerMinute = computeBreathsPerMinute(state.breathCount, durationSec);
    state.centeredSignal = metrics.centeredSignal;
    state.elapsedSec = durationSec;
  };

  const startLiveMetricsTimer = () => {
    clearLiveMetricsTimer();
    liveMetricsTimer = setInterval(updateLiveMetrics, 250);
  };

  const finishRecording = async () => {
    if (state.recordingState !== 'recording') {
      return;
    }

    stopSensors();
    clearSampleTimer();
    clearElapsedTimer();
    clearLiveMetricsTimer();

    const durationSec = Math.min(RECORDING_DURATION_SEC, Math.max(1, state.elapsedSec));
    state.recordingState = 'processing';
    publish();

    await applyAnalysisAsync(durationSec);
    state.recordingState = 'completed';
    publish();
  };

  const subscribeAccelerometer = () => {
    if (Platform.OS === 'web') {
      sampleTimer = setInterval(() => {
        const phase = zSamples.length / 10;
        zSamples.push(Math.sin(phase) * 0.4);
      }, 100);
      return;
    }

    Accelerometer.setUpdateInterval(100);
    accelerometerSubscription = Accelerometer.addListener(({ z }) => {
      zSamples.push(z);
    });
  };

  const startRecordingInternal = () => {
    resetRecordingMetrics();
    state.recordingState = 'recording';
    state.countdown = null;
    subscribeAccelerometer();
    startLiveMetricsTimer();

    elapsedTimer = setInterval(() => {
      state.elapsedSec += 1;

      if (state.elapsedSec >= RECORDING_DURATION_SEC) {
        void finishRecording();
        return;
      }

      publish();
    }, 1000);

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

    resetRecordingMetrics();
    state.countdown = START_COUNTDOWN_SEC;
    state.recordingState = 'countdown';
    publish();
    countdownTimer = setTimeout(tickCountdown, 1000);
  };

  const preparePhase = (phaseIndex: number) => {
    stopSensors();
    clearCountdownTimer();
    clearElapsedTimer();
    clearSampleTimer();
    clearLiveMetricsTimer();
    state = createInitialBreathingLabState();
    state.phaseIndex = Math.max(0, Math.min(phaseIndex, BREATHING_PHASES.length - 1));
    publish();
  };

  const advancePhase = () => {
    const nextIndex = state.phaseIndex + 1;
    if (nextIndex >= BREATHING_PHASES.length) {
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
    clearLiveMetricsTimer();
    resetRecordingMetrics();
    state.recordingState = 'idle';
    state.countdown = null;
    publish();
  };

  const getRecordingMetrics = () => {
    const durationSec = Math.min(RECORDING_DURATION_SEC, Math.max(1, state.elapsedSec));
    return analyzeBreathingSignal(zSamples, durationSec);
  };

  const dispose = () => {
    stopSensors();
    clearCountdownTimer();
    clearElapsedTimer();
    clearSampleTimer();
    clearLiveMetricsTimer();
  };

  publish();

  return {
    startCountdown,
    finishRecording,
    preparePhase,
    advancePhase,
    resetPhaseToIdle,
    getRecordingMetrics,
    getState: () => ({
      ...state,
      centeredSignal: [...state.centeredSignal],
    }),
    dispose,
  };
}
