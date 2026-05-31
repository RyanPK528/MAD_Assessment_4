import { Audio } from 'expo-av';
import { Platform } from 'react-native';

// ── Types ───────────────────────────────────────────────────────────────────

export type SoundLevel = 'quiet' | 'moderate' | 'loud' | 'very_loud';

export interface SoundSample {
  decibelDb: number;
  level: SoundLevel;
  timestamp: number;
}

export interface SoundPollutionState {
  isRecording: boolean;
  hasPermission: boolean;
  /** Current instantaneous dB reading (metering value mapped to 0-120 dB range) */
  currentDb: number;
  /** Rolling average over last 5 seconds */
  averageDb: number;
  /** Peak reading since session started */
  peakDb: number;
  /** Qualitative noise level */
  level: SoundLevel;
  /** Number of times the sound exceeded LOUD threshold */
  loudEventCount: number;
  /** Elapsed recording seconds */
  secondsElapsed: number;
  /** Chronological samples for mini chart display */
  samples: SoundSample[];
  message: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

/** expo-av metering gives values roughly in the range [-160, 0] (dBFS).
 *  We map that to a human-friendly 0–120 dB scale. */
const METERING_MIN = -60; // dBFS floor we treat as 0 dB
const METERING_MAX = 0;   // dBFS ceiling we treat as 120 dB
const HUMAN_MAX_DB = 120;

const LEVEL_THRESHOLDS: Record<SoundLevel, number> = {
  quiet: 0,
  moderate: 40,
  loud: 70,
  very_loud: 90,
};

const MAX_SAMPLES = 30; // keep last 30 one-second readings for chart

// ── Helpers ──────────────────────────────────────────────────────────────────

const dbFsToHuman = (dbFs: number): number => {
  const clamped = Math.max(METERING_MIN, Math.min(METERING_MAX, dbFs));
  return Math.round(((clamped - METERING_MIN) / (METERING_MAX - METERING_MIN)) * HUMAN_MAX_DB);
};

const classifyLevel = (db: number): SoundLevel => {
  if (db >= LEVEL_THRESHOLDS.very_loud) return 'very_loud';
  if (db >= LEVEL_THRESHOLDS.loud) return 'loud';
  if (db >= LEVEL_THRESHOLDS.moderate) return 'moderate';
  return 'quiet';
};

const levelMessage = (level: SoundLevel, db: number): string => {
  switch (level) {
    case 'quiet':
      return `Quiet environment – ${db} dB. Good for study areas!`;
    case 'moderate':
      return `Moderate noise – ${db} dB. Typical classroom level.`;
    case 'loud':
      return `Loud! ${db} dB. Prolonged exposure not recommended.`;
    case 'very_loud':
      return `Very loud! ${db} dB. Protect your ears.`;
  }
};

// ── Factory ──────────────────────────────────────────────────────────────────

export function createSoundPollutionController(
  onUpdate: (state: SoundPollutionState) => void,
) {
  let recording: Audio.Recording | null = null;
  let tickHandle: ReturnType<typeof setInterval> | null = null;

  let hasPermission = false;
  let currentDb = 0;
  let peakDb = 0;
  let loudEventCount = 0;
  let secondsElapsed = 0;
  let samples: SoundSample[] = [];
  let recentReadings: number[] = [];

  // ── Publish ────────────────────────────────────────────────────────────────

  const publish = (isRecording: boolean): void => {
    const averageDb =
      recentReadings.length > 0
        ? Math.round(recentReadings.reduce((s, v) => s + v, 0) / recentReadings.length)
        : 0;

    const level = classifyLevel(currentDb);

    onUpdate({
      isRecording,
      hasPermission,
      currentDb,
      averageDb,
      peakDb,
      level,
      loudEventCount,
      secondsElapsed,
      samples: [...samples],
      message: isRecording ? levelMessage(level, currentDb) : 'Press Start to begin measuring noise levels.',
    });
  };

  // ── Tick: sample metering data every second ────────────────────────────────

  const tick = async (): Promise<void> => {
    if (!recording) return;

    const status = await recording.getStatusAsync();
    if (!status.isRecording) return;

    secondsElapsed += 1;

    const meteringValue = (status as any).metering ?? METERING_MIN;
    currentDb = dbFsToHuman(meteringValue);

    if (currentDb > peakDb) peakDb = currentDb;

    recentReadings.push(currentDb);
    if (recentReadings.length > 5) recentReadings.shift();

    if (currentDb >= LEVEL_THRESHOLDS.loud) loudEventCount += 1;

    const sample: SoundSample = {
      decibelDb: currentDb,
      level: classifyLevel(currentDb),
      timestamp: Date.now(),
    };
    samples = [...samples, sample].slice(-MAX_SAMPLES);

    publish(true);
  };

  // ── Public API ─────────────────────────────────────────────────────────────

  const requestPermission = async (): Promise<boolean> => {
    const { status } = await Audio.requestPermissionsAsync();
    hasPermission = status === 'granted';
    publish(false);
    return hasPermission;
  };

  const start = async (): Promise<void> => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        publish(false);
        return;
      }
    }

    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

    const { recording: rec } = await Audio.Recording.createAsync(
      {
        ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      },
    );

    recording = rec;

    currentDb = 0;
    peakDb = 0;
    loudEventCount = 0;
    secondsElapsed = 0;
    samples = [];
    recentReadings = [];

    tickHandle = setInterval(tick, 1000);
    publish(true);
  };

  const stop = async (): Promise<void> => {
    if (tickHandle) {
      clearInterval(tickHandle);
      tickHandle = null;
    }
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch {
        // Already stopped; safe to ignore
      }
      recording = null;
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    publish(false);
  };

  const reset = async (): Promise<void> => {
    await stop();
    currentDb = 0;
    peakDb = 0;
    loudEventCount = 0;
    secondsElapsed = 0;
    samples = [];
    recentReadings = [];
    publish(false);
  };

  publish(false);

  return { requestPermission, start, stop, reset };
}