import { Accelerometer } from 'expo-sensors';
import type { Subscription } from 'expo-sensors';

export type ReactionStage = 'tap' | 'swap' | 'trace' | 'complete';

export interface TracePoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface ReactionBoardState {
  stage: ReactionStage;
  reactionTimeMs: number | null;
  swapDetected: boolean;
  traceCompletion: number;
  message: string;
}

const computeTraceCompletion = (tracePoints: TracePoint[]): number => {
  if (tracePoints.length < 8) {
    return 0;
  }

  const uniquePoints = new Set(tracePoints.map((point) => `${Math.round(point.x)}:${Math.round(point.y)}`));
  return Math.min(100, Math.round((uniquePoints.size / 40) * 100));
};

export function createReactionBoardController(onState: (state: ReactionBoardState) => void) {
  let stage: ReactionStage = 'tap';
  let reactionStart: number | null = null;
  let swapSubscription: Subscription | null = null;
  let lastAccelerationX = 0;
  let tracePoints: TracePoint[] = [];

  const publish = () => {
    onState({
      stage,
      reactionTimeMs: reactionStart === null ? null : Date.now() - reactionStart,
      swapDetected: stage !== 'swap',
      traceCompletion: computeTraceCompletion(tracePoints),
      message:
        stage === 'tap'
          ? 'Tap the hidden button as soon as it appears.'
          : stage === 'swap'
          ? 'Swap hand position to complete the challenge.'
          : stage === 'trace'
          ? 'Trace the hidden shape with your fingertip as smoothly as possible.'
          : 'Challenge complete. Great work!',
    });
  };

  const startTapStage = () => {
    stage = 'tap';
    reactionStart = Date.now();
    tracePoints = [];
    publish();
  };

  const submitTap = (): number => {
    if (reactionStart === null) {
      throw new Error('Tap stage has not started.');
    }
    const reactionTime = Date.now() - reactionStart;
    stage = 'swap';
    reactionStart = null;
    publish();
    return reactionTime;
  };

  const startSwapDetection = () => {
    swapSubscription?.remove();
    lastAccelerationX = 0;
    stage = 'swap';

    Accelerometer.setUpdateInterval(80);
    swapSubscription = Accelerometer.addListener((acceleration) => {
      if (Math.abs(lastAccelerationX) > 0.9 && Math.sign(lastAccelerationX) !== Math.sign(acceleration.x)) {
        stage = 'trace';
        swapSubscription?.remove();
        swapSubscription = null;
      }
      lastAccelerationX = acceleration.x;
      publish();
    });
  };

  const addTracePoint = (point: TracePoint) => {
    if (stage !== 'trace') {
      return;
    }
    tracePoints = [...tracePoints, point];
    publish();
  };

  const finalizeTrace = () => {
    if (stage !== 'trace') {
      throw new Error('Trace stage is not active.');
    }

    const completion = computeTraceCompletion(tracePoints);
    if (completion >= 85) {
      stage = 'complete';
      publish();
    } else {
      throw new Error('Shape tracing incomplete. Try to follow the outline more closely.');
    }
  };

  const stop = () => {
    swapSubscription?.remove();
    swapSubscription = null;
    Accelerometer.setUpdateInterval(1000);
  };

  publish();

  return {
    startTapStage,
    submitTap,
    startSwapDetection,
    addTracePoint,
    finalizeTrace,
    stop,
  };
}
