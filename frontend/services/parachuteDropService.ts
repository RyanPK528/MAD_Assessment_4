export const GRAVITY = 9.8;
export const MAX_TRIALS = 3;
export const SESSION_MAX_SEC = 20 * 60;

export interface ParachuteTrial {
  label: string;
  fallTimeSec: number | null;
  contactTimeSec: number | null;
  videoUri: string | null;
  prediction: string;
  hasBounce: boolean;
  reboundSpeedMs: number | null;
  impactSpeedMs: number | null;
  accelerationMs2: number | null;
  netForceN: number | null;
  dragForceN: number | null;
  gForce: number | null;
}

export interface ParachuteDropState {
  phase: 'setup' | 'recording' | 'review';
  dropHeightM: number;
  toyMassKg: number;
  trials: ParachuteTrial[];
  activeTrialIndex: number;
  sessionTimerSec: number;
  sessionRunning: boolean;
  dropTimerSec: number;
  dropTimerRunning: boolean;
  reflection: string;
  message: string;
}

export function computeAverageVelocity(dropHeightM: number, fallTimeSec: number): number {
  if (fallTimeSec <= 0) return 0;
  return (2 * dropHeightM) / fallTimeSec;
}

export function computeAcceleration(dropHeightM: number, fallTimeSec: number): number {
  if (fallTimeSec <= 0) return 0;
  return (2 * dropHeightM) / (fallTimeSec * fallTimeSec);
}

export function computePhysics(
  dropHeightM: number,
  toyMassKg: number,
  fallTimeSec: number | null,
  contactTimeSec: number | null,
  hasBounce: boolean,
  reboundSpeedMs: number | null,
): Pick<
  ParachuteTrial,
  'impactSpeedMs' | 'accelerationMs2' | 'netForceN' | 'dragForceN' | 'gForce'
> {
  if (!fallTimeSec || fallTimeSec <= 0) {
    return {
      impactSpeedMs: null,
      accelerationMs2: null,
      netForceN: null,
      dragForceN: null,
      gForce: null,
    };
  }

  const impactSpeedMs = computeAverageVelocity(dropHeightM, fallTimeSec);
  const accelerationMs2 = computeAcceleration(dropHeightM, fallTimeSec);
  const netForceN = toyMassKg * accelerationMs2;
  const weight = toyMassKg * GRAVITY;
  const dragForceN = Math.max(0, weight - netForceN);

  let gForce: number | null = null;
  if (contactTimeSec && contactTimeSec > 0) {
    if (hasBounce && reboundSpeedMs !== null) {
      const deltaV = impactSpeedMs + reboundSpeedMs;
      gForce = deltaV / contactTimeSec / GRAVITY;
    } else {
      gForce = impactSpeedMs / contactTimeSec / GRAVITY;
    }
  }

  return {
    impactSpeedMs: Math.round(impactSpeedMs * 100) / 100,
    accelerationMs2: Math.round(accelerationMs2 * 100) / 100,
    netForceN: Math.round(netForceN * 100) / 100,
    dragForceN: Math.round(dragForceN * 100) / 100,
    gForce: gForce !== null ? Math.round(gForce * 100) / 100 : null,
  };
}

export function createEmptyTrial(index: number): ParachuteTrial {
  return {
    label: index === 0 ? 'No parachute (baseline)' : `Design ${index}`,
    fallTimeSec: null,
    contactTimeSec: null,
    videoUri: null,
    prediction: '',
    hasBounce: false,
    reboundSpeedMs: null,
    impactSpeedMs: null,
    accelerationMs2: null,
    netForceN: null,
    dragForceN: null,
    gForce: null,
  };
}

export function createParachuteDropController(onUpdate: (state: ParachuteDropState) => void) {
  let state: ParachuteDropState = {
    phase: 'setup',
    dropHeightM: 1.0,
    toyMassKg: 0.2,
    trials: [createEmptyTrial(0), createEmptyTrial(1), createEmptyTrial(2)],
    activeTrialIndex: 0,
    sessionTimerSec: 0,
    sessionRunning: false,
    dropTimerSec: 0,
    dropTimerRunning: false,
    reflection: '',
    message: 'Enter drop height and toy mass, then run up to 3 prototype tests.',
  };

  let sessionInterval: ReturnType<typeof setInterval> | null = null;
  let dropInterval: ReturnType<typeof setInterval> | null = null;
  let dropStartTime = 0;

  const publish = () => onUpdate({ ...state });

  const recomputeActiveTrial = () => {
    const trial = state.trials[state.activeTrialIndex];
    const physics = computePhysics(
      state.dropHeightM,
      state.toyMassKg,
      trial.fallTimeSec,
      trial.contactTimeSec,
      trial.hasBounce,
      trial.reboundSpeedMs,
    );
    const trials = [...state.trials];
    trials[state.activeTrialIndex] = { ...trial, ...physics };
    state = { ...state, trials };
  };

  const setDropHeight = (m: number) => {
    state = { ...state, dropHeightM: Math.max(0.1, m) };
    recomputeActiveTrial();
    publish();
  };

  const setMass = (kg: number) => {
    state = { ...state, toyMassKg: Math.max(0.01, kg) };
    recomputeActiveTrial();
    publish();
  };

  const setPhase = (phase: ParachuteDropState['phase']) => {
    state = { ...state, phase };
    publish();
  };

  const setActiveTrial = (index: number) => {
    state = { ...state, activeTrialIndex: Math.max(0, Math.min(MAX_TRIALS - 1, index)) };
    publish();
  };

  const updateActiveTrial = (patch: Partial<ParachuteTrial>) => {
    const trials = [...state.trials];
    trials[state.activeTrialIndex] = { ...trials[state.activeTrialIndex], ...patch };
    state = { ...state, trials };
    recomputeActiveTrial();
    publish();
  };

  const startSessionTimer = () => {
    if (sessionInterval) return;
    state = { ...state, sessionRunning: true };
    publish();
    sessionInterval = setInterval(() => {
      state = { ...state, sessionTimerSec: state.sessionTimerSec + 1 };
      if (state.sessionTimerSec >= SESSION_MAX_SEC) {
        stopSessionTimer();
        state = { ...state, message: '20-minute session limit reached.' };
      }
      publish();
    }, 1000);
  };

  const stopSessionTimer = () => {
    if (sessionInterval) {
      clearInterval(sessionInterval);
      sessionInterval = null;
    }
    state = { ...state, sessionRunning: false };
    publish();
  };

  const resetSessionTimer = () => {
    stopSessionTimer();
    state = { ...state, sessionTimerSec: 0 };
    publish();
  };

  const startDropTimer = () => {
    // Clear any existing drop timer so it can be restarted (e.g., from camera recording)
    if (dropInterval) {
      clearInterval(dropInterval);
      dropInterval = null;
    }
    dropStartTime = Date.now();
    state = { ...state, dropTimerRunning: true, dropTimerSec: 0, phase: 'recording' };
    publish();
    dropInterval = setInterval(() => {
      state = { ...state, dropTimerSec: (Date.now() - dropStartTime) / 1000 };
      publish();
    }, 50);
  };

  const stopDropTimer = () => {
    if (dropInterval) {
      clearInterval(dropInterval);
      dropInterval = null;
    }
    const elapsed = dropStartTime > 0 ? (Date.now() - dropStartTime) / 1000 : state.dropTimerSec;
    updateActiveTrial({ fallTimeSec: Math.round(elapsed * 1000) / 1000 });
    state = {
      ...state,
      dropTimerRunning: false,
      dropTimerSec: elapsed,
      phase: 'review',
      message: `Fall time recorded: ${elapsed.toFixed(3)} s. Enter contact time from slow-motion video.`,
    };
    publish();
    return elapsed;
  };

  const setContactTime = (sec: number) => {
    updateActiveTrial({ contactTimeSec: sec });
  };

  const setVideoUri = (uri: string | null) => {
    updateActiveTrial({ videoUri: uri });
  };

  const setReflection = (text: string) => {
    state = { ...state, reflection: text };
    publish();
  };

  const stop = () => {
    stopSessionTimer();
    if (dropInterval) {
      clearInterval(dropInterval);
      dropInterval = null;
    }
  };

  return {
    setDropHeight,
    setMass,
    setPhase,
    setActiveTrial,
    updateActiveTrial,
    startSessionTimer,
    stopSessionTimer,
    resetSessionTimer,
    startDropTimer,
    stopDropTimer,
    setContactTime,
    setVideoUri,
    setReflection,
    stop,
    getState: () => state,
  };
}
