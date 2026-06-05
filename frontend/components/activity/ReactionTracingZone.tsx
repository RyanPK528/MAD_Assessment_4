import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { ThemedText } from '@/components/themed-text';
import {
  calculateTracingAccuracy,
  TRACING_DURATION_SEC,
  TRACING_START_COUNTDOWN_SEC,
  TracingSample,
} from '@/services/reactionBoardService';
import { Radii, SpacingScale } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const CIRCLE_RADIUS = 30;

type TracingPhase = 'idle' | 'countdown' | 'tracing' | 'finished';

interface ReactionTracingZoneProps {
  active: boolean;
  onComplete: (accuracyPercent: number, durationSec: number) => void;
}

export function ReactionTracingZone({ active, onComplete }: ReactionTracingZoneProps) {
  const theme = useTheme();
  const [layoutReady, setLayoutReady] = useState(false);
  const [phase, setPhase] = useState<TracingPhase>('idle');
  const [startCountdown, setStartCountdown] = useState<number | null>(null);
  const [timeRemainingSec, setTimeRemainingSec] = useState(TRACING_DURATION_SEC);
  const [circlePosition, setCirclePosition] = useState({ x: 0, y: 0 });
  const [accuracyPercent, setAccuracyPercent] = useState<number | null>(null);
  const [liveAccuracyPercent, setLiveAccuracyPercent] = useState<number | null>(null);

  const containerSizeRef = useRef({ width: 0, height: 0 });
  const fingerPosition = useRef({ x: 0, y: 0 });
  const isTouching = useRef(false);
  const trackingSamples = useRef<TracingSample[]>([]);
  const lastLiveAccuracyUpdateRef = useRef(0);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const movementIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tracingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);

  onCompleteRef.current = onComplete;

  const clearAllIntervals = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (movementIntervalRef.current) {
      clearInterval(movementIntervalRef.current);
      movementIntervalRef.current = null;
    }
    if (tracingIntervalRef.current) {
      clearInterval(tracingIntervalRef.current);
      tracingIntervalRef.current = null;
    }
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width <= 0 || height <= 0) {
      return;
    }

    containerSizeRef.current = { width, height };
    setCirclePosition({ x: width / 2, y: height / 2 });
    setLayoutReady(true);
  };

  const panGesture = Gesture.Pan()
    .runOnJS(true)
    .minDistance(0)
    .onBegin((event) => {
      isTouching.current = true;
      fingerPosition.current = { x: event.x, y: event.y };
    })
    .onUpdate((event) => {
      fingerPosition.current = { x: event.x, y: event.y };
    })
    .onEnd(() => {
      isTouching.current = false;
    });

  const beginTracing = () => {
    const { width, height } = containerSizeRef.current;
    if (width === 0 || height === 0) {
      return;
    }

    setPhase('tracing');
    setStartCountdown(null);
    setTimeRemainingSec(TRACING_DURATION_SEC);
    setLiveAccuracyPercent(null);
    trackingSamples.current = [];
    lastLiveAccuracyUpdateRef.current = 0;

    let x = width / 2;
    let y = height / 2;
    let directionX = 1;
    let directionY = 1;
    const speedX = 4;
    const speedY = 3;

    movementIntervalRef.current = setInterval(() => {
      x += speedX * directionX;
      y += speedY * directionY;

      const minX = CIRCLE_RADIUS;
      const maxX = width - CIRCLE_RADIUS;
      const minY = CIRCLE_RADIUS;
      const maxY = height - CIRCLE_RADIUS;

      if (x >= maxX || x <= minX) {
        directionX *= -1;
      }
      if (y >= maxY || y <= minY) {
        directionY *= -1;
      }

      setCirclePosition({ x, y });

      trackingSamples.current.push({
        fingerX: fingerPosition.current.x,
        fingerY: fingerPosition.current.y,
        circleX: x,
        circleY: y,
        touching: isTouching.current,
      });

      const now = Date.now();
      if (now - lastLiveAccuracyUpdateRef.current >= 250) {
        lastLiveAccuracyUpdateRef.current = now;
        setLiveAccuracyPercent(calculateTracingAccuracy(trackingSamples.current));
      }
    }, 16);

    tracingIntervalRef.current = setInterval(() => {
      setTimeRemainingSec((prev) => {
        if (prev <= 1) {
          if (tracingIntervalRef.current) {
            clearInterval(tracingIntervalRef.current);
            tracingIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const beginCountdown = () => {
    clearAllIntervals();
    trackingSamples.current = [];
    setAccuracyPercent(null);
    setLiveAccuracyPercent(null);
    setPhase('countdown');
    setStartCountdown(TRACING_START_COUNTDOWN_SEC);
    setTimeRemainingSec(TRACING_DURATION_SEC);

    let remaining = TRACING_START_COUNTDOWN_SEC;

    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;

      if (remaining > 0) {
        setStartCountdown(remaining);
        return;
      }

      if (remaining === 0) {
        setStartCountdown(0);
        remaining = -1;
        return;
      }

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      beginTracing();
    }, 1000);
  };

  useEffect(() => {
    if (!active) {
      clearAllIntervals();
      setPhase('idle');
      setStartCountdown(null);
      setAccuracyPercent(null);
      setLiveAccuracyPercent(null);
      setLayoutReady(false);
      return;
    }

    if (!layoutReady) {
      return;
    }

    beginCountdown();

    return () => {
      clearAllIntervals();
    };
  }, [active, layoutReady]);

  useEffect(() => {
    if (phase !== 'tracing' || timeRemainingSec !== 0) {
      return;
    }

    clearAllIntervals();
    const score = calculateTracingAccuracy(trackingSamples.current);
    setAccuracyPercent(score);
    setPhase('finished');
    onCompleteRef.current(score, TRACING_DURATION_SEC);
  }, [phase, timeRemainingSec]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const countdownLabel =
    startCountdown === null ? null : startCountdown === 0 ? 'Go!' : String(startCountdown);

  const showCircle = active && phase !== 'idle';
  const showCountdown = phase === 'countdown' && startCountdown !== null;
  const showTracingTimer = phase === 'countdown' || phase === 'tracing';
  const showFinished = phase === 'finished';

  return (
    <View style={styles.wrapper}>
      {showTracingTimer ? (
        <View style={styles.timerRow}>
          <ThemedText type="small" themeColor="textSecondary">
            Time remaining
          </ThemedText>
          <ThemedText type="title">{formatTime(timeRemainingSec)}</ThemedText>
          {phase === 'tracing' && liveAccuracyPercent !== null ? (
            <ThemedText type="body">
              Live accuracy: {liveAccuracyPercent}%
            </ThemedText>
          ) : null}
        </View>
      ) : null}

      <GestureDetector gesture={panGesture}>
        <View
          style={[styles.zone, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}
          onLayout={handleLayout}
        >
          {showCircle ? (
            <View
              style={[
                styles.circle,
                {
                  backgroundColor: theme.accent,
                  opacity: showCountdown ? 0.85 : 1,
                  left: circlePosition.x - CIRCLE_RADIUS,
                  top: circlePosition.y - CIRCLE_RADIUS,
                },
              ]}
            />
          ) : null}

          {showCountdown ? (
            <View style={styles.countdownContainer} pointerEvents="none">
              <ThemedText type="pageTitle" style={styles.countdownNumber}>
                {countdownLabel}
              </ThemedText>
            </View>
          ) : null}

          {!active ? (
            <ThemedText type="body" themeColor="textSecondary" style={styles.centerMessage}>
              Start the challenge to begin tracing.
            </ThemedText>
          ) : showFinished ? (
            <ThemedText type="body" style={styles.centerMessage}>
              Tracing complete: {accuracyPercent}% accuracy
            </ThemedText>
          ) : showCountdown ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.bottomHint}>
              Target will start moving after the countdown.
            </ThemedText>
          ) : showTracingTimer ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.bottomHint}>
              Keep your finger on the moving target.
            </ThemedText>
          ) : null}
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: SpacingScale.sm,
  },
  timerRow: {
    gap: SpacingScale.xxs,
  },
  zone: {
    minHeight: 280,
    borderRadius: Radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  countdownContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  countdownNumber: {
    fontSize: 72,
    lineHeight: 80,
    textAlign: 'center',
  },
  circle: {
    position: 'absolute',
    width: CIRCLE_RADIUS * 2,
    height: CIRCLE_RADIUS * 2,
    borderRadius: CIRCLE_RADIUS,
    zIndex: 1,
  },
  centerMessage: {
    ...StyleSheet.absoluteFillObject,
    textAlign: 'center',
    textAlignVertical: 'center',
    padding: SpacingScale.lg,
  },
  bottomHint: {
    position: 'absolute',
    bottom: SpacingScale.md,
    alignSelf: 'center',
    width: '100%',
    textAlign: 'center',
    zIndex: 3,
  },
});
