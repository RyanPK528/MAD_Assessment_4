import { Accelerometer } from 'expo-sensors';
import type { Subscription } from 'expo-sensors';
import { Platform } from 'react-native';

import {
  analyzeBreathingSignal,
  analyzeBreathingSignalAsync,
  buildAuthoritativeMetrics,
  computeAccelMagnitude,
  computeBreathsPerMinute,
  countNewBreathPeaks,
  downsampleSignal,
  filterBreathingMotionSamples,
  RECORDING_DURATION_SEC,
  START_COUNTDOWN_SEC,
} from './breathingTrainerLogic';
import {
  BREATHING_PHASES,
  BreathingLabState,
  BreathingRecordingMetrics,
  createInitialBreathingLabState,
} from './breathingTrainerTypes';

export {
  buildMemberAttempt,
  buildPhaseResult,
  buildSubmissionPayload,
  computeAccelMagnitude,
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
  let motionSamples: number[] = [];
  let peakBreathCount = 0;
  let lastCountedPeakSampleIndex = Number.NEGATIVE_INFINITY;
  let finalMetrics: BreathingRecordingMetrics | null = null;

  const applyMetricsToState = (metrics: BreathingRecordingMetrics, durationSec: number) => {
    state.breathCount = metrics.breathCount;
    state.breathsPerMinute = metrics.breathsPerMinute;
    state.centeredSignal = metrics.centeredSignal;
    state.elapsedSec = durationSec;
  };

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
    motionSamples = [];
    peakBreathCount = 0;
    lastCountedPeakSampleIndex = Number.NEGATIVE_INFINITY;
    finalMetrics = null;
    state.elapsedSec = 0;
    state.breathCount = 0;
    state.breathsPerMinute = 0;
    state.centeredSignal = [];
  };

  const refreshPeakBreathCount = (durationSec: number) => {
    if (motionSamples.length === 0) {
      return;
    }

    const filtered = filterBreathingMotionSamples(motionSamples);
    const { newPeaks, lastPeakIndex } = countNewBreathPeaks(
      filtered,
      lastCountedPeakSampleIndex,
    );

    if (newPeaks > 0) {
      peakBreathCount += newPeaks;
      lastCountedPeakSampleIndex = lastPeakIndex;
    }

    state.breathCount = peakBreathCount;
    state.breathsPerMinute = computeBreathsPerMinute(peakBreathCount, durationSec);
    state.centeredSignal = downsampleSignal(filtered);
  };

  const updateLiveMetrics = () => {
    if (motionSamples.length === 0) {
      return;
    }

    const durationSec = Math.max(1, state.elapsedSec);
    refreshPeakBreathCount(durationSec);
    publish();
  };

  const applyAnalysisAsync = async (durationSec: number) => {
    refreshPeakBreathCount(durationSec);
    const chartMetrics = await analyzeBreathingSignalAsync(motionSamples, durationSec);
    finalMetrics = buildAuthoritativeMetrics(chartMetrics, peakBreathCount, durationSec);
    applyMetricsToState(finalMetrics, durationSec);
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
        const phase = motionSamples.length / 10;
        motionSamples.push(Math.sin(phase) * 0.4 + 9.8);
      }, 100);
      return;
    }

    Accelerometer.setUpdateInterval(100);
    accelerometerSubscription = Accelerometer.addListener(({ x, y, z }) => {
      motionSamples.push(computeAccelMagnitude(x, y, z));
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
    motionSamples = [];
    peakBreathCount = 0;
    lastCountedPeakSampleIndex = Number.NEGATIVE_INFINITY;
    finalMetrics = null;
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
    if (finalMetrics) {
      return finalMetrics;
    }

    const durationSec = Math.min(RECORDING_DURATION_SEC, Math.max(1, state.elapsedSec));
    const chartMetrics = analyzeBreathingSignal(motionSamples, durationSec);
    return buildAuthoritativeMetrics(chartMetrics, peakBreathCount, durationSec);
  };

  const dispose = () => {
    stopSensors();
    clearCountdownTimer();
    clearElapsedTimer();
    clearSampleTimer();
    clearLiveMetricsTimer();
  };

  publish();

  const controller = {
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

  if (process.env.NODE_ENV === 'test') {
    return {
      ...controller,
      __testSetSamples: (samples: number[], elapsedSec: number) => {
        motionSamples = [...samples];
        peakBreathCount = 0;
        lastCountedPeakSampleIndex = Number.NEGATIVE_INFINITY;
        finalMetrics = null;
        state.elapsedSec = elapsedSec;
        state.recordingState = 'recording';
      },
      __testAppendSamples: (samples: number[], elapsedSec: number) => {
        motionSamples.push(...samples);
        state.elapsedSec = elapsedSec;
      },
      __testTickLiveMetrics: () => {
        updateLiveMetrics();
      },
      __testSetPeakBreathCount: (count: number) => {
        peakBreathCount = count;
        const filtered = filterBreathingMotionSamples(motionSamples);
        lastCountedPeakSampleIndex =
          filtered.length > 0 ? filtered.length - 1 : Number.NEGATIVE_INFINITY;
        state.breathCount = count;
        state.breathsPerMinute = computeBreathsPerMinute(count, Math.max(1, state.elapsedSec));
      },
      __testGetPeakBreathCount: () => peakBreathCount,
    };
  }

  return controller;
}
