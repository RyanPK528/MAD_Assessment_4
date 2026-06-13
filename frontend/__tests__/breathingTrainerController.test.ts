import { createBreathingTrainerController } from '../../backend/services/breathingTrainerController';
import { analyzeBreathingSignal } from '../../backend/services/breathingTrainerLogic';
import type { BreathingLabState } from '../../backend/services/breathingTrainerTypes';

type TestBreathingController = ReturnType<typeof createBreathingTrainerController> & {
  __testSetSamples?: (samples: number[], elapsedSec: number) => void;
  __testAppendSamples?: (samples: number[], elapsedSec: number) => void;
  __testTickLiveMetrics?: () => void;
  __testSetPeakBreathCount?: (count: number) => void;
  __testGetPeakBreathCount?: () => number;
};

function buildSyntheticBreathSignal(breathCount: number, samplesPerBreath = 10): number[] {
  const values: number[] = [];

  for (let breath = 0; breath < breathCount; breath += 1) {
    for (let i = 0; i < samplesPerBreath; i += 1) {
      const phase = i / samplesPerBreath;
      values.push(Math.sin(phase * Math.PI) * 0.5 + 9.8);
    }
    for (let i = 0; i < samplesPerBreath; i += 1) {
      values.push(9.8);
    }
  }

  return values;
}

function buildSingleExpansionMotion(length = 30): number[] {
  return Array.from({ length }, (_, index) => {
    const phase = index / Math.max(1, length - 1);
    return 9.8 + Math.sin(phase * Math.PI) * 0.12;
  });
}

function buildSmoothUpDownMagnitude(cycleSamples = 35, amplitude = 0.15): number[] {
  return Array.from({ length: cycleSamples }, (_, index) => {
    const phase = index / Math.max(1, cycleSamples - 1);
    return 9.8 + Math.sin(phase * Math.PI) * amplitude;
  });
}

describe('breathingTrainerController', () => {
  it('caches final metrics so getRecordingMetrics matches labState after finishRecording', async () => {
    let latestState: BreathingLabState | null = null;
    const controller = createBreathingTrainerController((state) => {
      latestState = state;
    }) as TestBreathingController;

    const samples = buildSyntheticBreathSignal(5);
    expect(controller.__testSetSamples).toBeDefined();
    controller.__testSetSamples!(samples, 30);
    controller.__testTickLiveMetrics!();

    await controller.finishRecording();

    const state = controller.getState();
    const metrics = controller.getRecordingMetrics();

    expect(state.recordingState).toBe('completed');
    expect(metrics.breathCount).toBe(state.breathCount);
    expect(metrics.breathsPerMinute).toBe(state.breathsPerMinute);
    expect(latestState?.breathCount).toBe(state.breathCount);
  });

  it('keeps live breath count monotonic during recording', () => {
    const controller = createBreathingTrainerController(() => {}) as TestBreathingController;
    const shortSignal = buildSyntheticBreathSignal(5);
    const extension = Array.from({ length: 30 }, () => 9.8);

    controller.__testSetSamples!(shortSignal, 10);
    controller.__testTickLiveMetrics!();
    const firstCount = controller.getState().breathCount;

    controller.__testAppendSamples!(extension, 20);
    controller.__testTickLiveMetrics!();
    const secondCount = controller.getState().breathCount;

    expect(secondCount).toBeGreaterThanOrEqual(firstCount);
  });

  it('counts one breath for a single expansion across multiple live ticks', () => {
    const controller = createBreathingTrainerController(() => {}) as TestBreathingController;
    const expansion = buildSingleExpansionMotion(30);

    controller.__testSetSamples!([9.8], 1);
    controller.__testAppendSamples!(expansion.slice(0, 10), 2);
    controller.__testTickLiveMetrics!();

    controller.__testAppendSamples!(expansion.slice(10, 20), 3);
    controller.__testTickLiveMetrics!();

    controller.__testAppendSamples!(expansion.slice(20), 4);
    controller.__testTickLiveMetrics!();

    expect(controller.getState().breathCount).toBe(1);
  });

  it('counts one breath for a smooth up-down cycle across multiple live ticks', () => {
    const controller = createBreathingTrainerController(() => {}) as TestBreathingController;
    const cycle = buildSmoothUpDownMagnitude(35, 0.15);
    const chunkSize = 7;

    controller.__testSetSamples!([9.8], 1);

    for (let offset = 0; offset < cycle.length; offset += chunkSize) {
      controller.__testAppendSamples!(cycle.slice(offset, offset + chunkSize), 2 + offset / chunkSize);
      controller.__testTickLiveMetrics!();
    }

    expect(controller.getState().breathCount).toBe(1);
  });

  it('uses peak live breath count for final metrics even when full-window analysis is lower', async () => {
    const controller = createBreathingTrainerController(() => {}) as TestBreathingController;
    const samples = buildSyntheticBreathSignal(4);

    controller.__testSetSamples!(samples, 30);
    controller.__testSetPeakBreathCount!(7);

    await controller.finishRecording();

    const rawFinalCount = analyzeBreathingSignal(samples, 30).breathCount;
    const metrics = controller.getRecordingMetrics();
    const state = controller.getState();

    expect(rawFinalCount).toBeLessThan(7);
    expect(metrics.breathCount).toBe(7);
    expect(state.breathCount).toBe(7);
    expect(metrics.breathsPerMinute).toBe(Math.round((7 / 30) * 60));
    expect(controller.__testGetPeakBreathCount!()).toBe(7);
  });
});
