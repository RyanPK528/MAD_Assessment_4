export type ReactionStage = 'idle' | 'waiting' | 'active' | 'tooSoon' | 'complete';

export interface ReactionBoardState {
  stage: ReactionStage;
  reactionTimeMs: number | null;
  message: string;
}

export function createReactionBoardController(onState: (state: ReactionBoardState) => void) {
  let stage: ReactionStage = 'idle';
  let reactionStartTime: number | null = null;
  let delayTimeoutId: ReturnType<typeof setTimeout> | null = null;

  const publish = () => {
    const message =
      stage === 'idle'
        ? 'Tap to Start Challenge'
        : stage === 'waiting'
        ? 'Wait for green...'
        : stage === 'active'
        ? 'TAP!'
        : stage === 'tooSoon'
        ? 'Too Soon!'
        : 'Challenge Complete!';

    onState({
      stage,
      reactionTimeMs: reactionStartTime === null ? null : Date.now() - reactionStartTime,
      message,
    });
  };

  const startChallenge = () => {
    stage = 'idle';
    reactionStartTime = null;
    publish();
  };

  const handleTap = (): number | null => {
    if (stage === 'idle') {
      // User tapped to start
      stage = 'waiting';
      publish();

      // Random delay 1-3 seconds
      const delay = Math.random() * 2000 + 1000;
      delayTimeoutId = setTimeout(() => {
        stage = 'active';
        reactionStartTime = Date.now();
        publish();
      }, delay);

      return null;
    }

    if (stage === 'waiting') {
      // User tapped too soon
      if (delayTimeoutId) clearTimeout(delayTimeoutId);
      stage = 'tooSoon';
      publish();

      // Reset after 1 second
      setTimeout(() => {
        startChallenge();
      }, 1000);

      return null;
    }

    if (stage === 'active') {
      // Valid tap - record reaction time
      const reactionTime = Date.now() - (reactionStartTime ?? Date.now());
      stage = 'complete';
      reactionStartTime = null;
      publish();

      // Reset after 1 second
      setTimeout(() => {
        startChallenge();
      }, 1000);

      return reactionTime;
    }

    return null;
  };

  const stop = () => {
    if (delayTimeoutId) clearTimeout(delayTimeoutId);
    delayTimeoutId = null;
  };

  publish();

  return {
    startChallenge,
    handleTap,
    stop,
  };
}
