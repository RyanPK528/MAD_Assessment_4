import { TapChallengeStage, TapChallengeState } from './reactionBoardTypes';

export function createTapReactionController(onState: (state: TapChallengeState) => void) {
  let stage: TapChallengeStage = 'idle';
  let reactionTimeMs: number | null = null;
  let readyAtMs: number | null = null;
  let delayTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let tooSoonTimeoutId: ReturnType<typeof setTimeout> | null = null;

  const messageForStage = (): string => {
    switch (stage) {
      case 'idle':
        return 'Tap Start challenge to begin.';
      case 'waiting':
        return 'Wait for the target…';
      case 'ready':
        return 'TAP!';
      case 'tooSoon':
        return 'Too soon! Wait for the target.';
      case 'complete':
        return reactionTimeMs !== null ? `Reaction time: ${reactionTimeMs} ms` : 'Phase complete.';
      default:
        return '';
    }
  };

  const publish = () => {
    onState({
      stage,
      reactionTimeMs,
      message: messageForStage(),
    });
  };

  const clearTimers = () => {
    if (delayTimeoutId) {
      clearTimeout(delayTimeoutId);
      delayTimeoutId = null;
    }
    if (tooSoonTimeoutId) {
      clearTimeout(tooSoonTimeoutId);
      tooSoonTimeoutId = null;
    }
  };

  const resetToIdle = () => {
    clearTimers();
    stage = 'idle';
    reactionTimeMs = null;
    readyAtMs = null;
    publish();
  };

  const beginWaiting = () => {
    clearTimers();
    stage = 'waiting';
    reactionTimeMs = null;
    readyAtMs = null;
    publish();

    const delay = 1000 + Math.random() * 2000;
    delayTimeoutId = setTimeout(() => {
      stage = 'ready';
      readyAtMs = Date.now();
      publish();
    }, delay);
  };

  const handleZonePress = (): number | null => {
    if (stage === 'waiting') {
      clearTimers();
      stage = 'tooSoon';
      publish();
      tooSoonTimeoutId = setTimeout(() => {
        resetToIdle();
      }, 1200);
      return null;
    }

    if (stage === 'ready' && readyAtMs !== null) {
      reactionTimeMs = Math.round((Date.now() - readyAtMs) * 10) / 10;
      stage = 'complete';
      readyAtMs = null;
      publish();
      return reactionTimeMs;
    }

    return null;
  };

  const dispose = () => {
    clearTimers();
  };

  publish();

  return {
    beginWaiting,
    handleZonePress,
    resetToIdle,
    dispose,
    getState: (): TapChallengeState => ({
      stage,
      reactionTimeMs,
      message: messageForStage(),
    }),
  };
}
