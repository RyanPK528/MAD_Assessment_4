import * as Location from 'expo-location';
import { Platform } from 'react-native';

export type SoundPrediction = 'louder' | 'softer' | 'same';
export type SoundRiskLevel = 'safe' | 'fatigue' | 'damage' | 'pain' | 'severe';

export interface SoundAction {
  label: string;
  prediction: SoundPrediction;
  measuredDb: number;
  riskLevel: SoundRiskLevel;
  latitude: number | null;
  longitude: number | null;
}

export interface SoundPollutionState {
  permissionsGranted: boolean;
  isMetering: boolean;
  currentDb: number;
  peakDb: number;
  actions: SoundAction[];
  location: { latitude: number; longitude: number } | null;
  message: string;
}

type AvRecording = {
  getStatusAsync: () => Promise<{ isRecording?: boolean; metering?: number }>;
  stopAndUnloadAsync: () => Promise<void>;
};

type AvAudio = {
  requestPermissionsAsync: () => Promise<{ status: string }>;
  setAudioModeAsync: (mode: object) => Promise<void>;
  Recording: {
    createAsync: (
      options: object,
      onRecordingStatusUpdate?: unknown,
      progressUpdateIntervalMillis?: number,
    ) => Promise<{ recording: AvRecording }>;
    OptionsPresets: { HIGH_QUALITY: object };
  };
};

let cachedAudio: AvAudio | null | undefined;

async function loadAudioModule(): Promise<AvAudio | null> {
  if (cachedAudio !== undefined) {
    return cachedAudio;
  }
  try {
    const mod = await import('expo-av');
    cachedAudio = mod.Audio as AvAudio;
    return cachedAudio;
  } catch (error) {
    cachedAudio = null;
    console.warn('[SoundPollution] expo-av unavailable. Run: npx expo install expo-av', error);
    return null;
  }
}

export function classifyRisk(db: number): SoundRiskLevel {
  if (db < 60) return 'safe';
  if (db < 85) return 'fatigue';
  if (db < 100) return 'damage';
  if (db < 120) return 'pain';
  return 'severe';
}

export function getRiskLabel(level: SoundRiskLevel): string {
  const labels: Record<SoundRiskLevel, string> = {
    safe: 'Safe for long periods',
    fatigue: 'Long exposure may cause fatigue',
    damage: 'Hearing damage possible',
    pain: 'Serious damage in minutes',
    severe: 'Immediate severe damage risk',
  };
  return labels[level];
}

export function normalizeMeteringToDb(metering: number): number {
  const clamped = Math.max(-60, Math.min(0, metering));
  return Math.round(30 + (clamped + 60) * (90 / 60));
}

export function createSoundPollutionController(onUpdate: (state: SoundPollutionState) => void) {
  let state: SoundPollutionState = {
    permissionsGranted: false,
    isMetering: false,
    currentDb: 0,
    peakDb: 0,
    actions: [],
    location: null,
    message: 'Grant microphone and location permissions to begin.',
  };

  let recording: AvRecording | null = null;
  let meterInterval: ReturnType<typeof setInterval> | null = null;

  const publish = () => onUpdate({ ...state });

  const requestPermissions = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      state = { ...state, message: 'Microphone metering requires a physical device.' };
      publish();
      return false;
    }

    const Audio = await loadAudioModule();
    if (!Audio) {
      state = {
        ...state,
        message: 'Audio module unavailable. Rebuild the app after running: npx expo install expo-av',
      };
      publish();
      return false;
    }

    const audio = await Audio.requestPermissionsAsync();
    const location = await Location.requestForegroundPermissionsAsync();
    const granted = audio.status === 'granted' && location.status === 'granted';

    state = {
      ...state,
      permissionsGranted: granted,
      message: granted ? 'Ready to measure sound levels.' : 'Permissions required to continue.',
    };
    publish();
    return granted;
  };

  const captureLocation = async () => {
    try {
      const pos = await Location.getCurrentPositionAsync({});
      state = {
        ...state,
        location: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
      };
      publish();
    } catch {
      state = { ...state, message: 'Could not capture GPS location.' };
      publish();
    }
  };

  const startMetering = async () => {
    if (!state.permissionsGranted) {
      const ok = await requestPermissions();
      if (!ok) return;
    }

    const Audio = await loadAudioModule();
    if (!Audio) {
      state = { ...state, message: 'Audio module unavailable. Rebuild after installing expo-av.' };
      publish();
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });

    const { recording: rec } = await Audio.Recording.createAsync(
      {
        ...Audio.Recording.OptionsPresets.HIGH_QUALITY,
        isMeteringEnabled: true,
      },
      undefined,
      100,
    );

    recording = rec;
    state = { ...state, isMetering: true, peakDb: 0, message: 'Measuring — perform your action now.' };
    publish();

    meterInterval = setInterval(async () => {
      if (!recording) return;
      try {
        const status = await recording.getStatusAsync();
        if (status.isRecording && status.metering !== undefined) {
          const db = normalizeMeteringToDb(status.metering);
          state = {
            ...state,
            currentDb: db,
            peakDb: Math.max(state.peakDb, db),
          };
          publish();
        }
      } catch {
        // ignore polling errors
      }
    }, 100);
  };

  const stopMetering = async () => {
    if (meterInterval) {
      clearInterval(meterInterval);
      meterInterval = null;
    }
    if (recording) {
      try {
        await recording.stopAndUnloadAsync();
      } catch {
        // already stopped
      }
      recording = null;
    }
    state = { ...state, isMetering: false, message: `Peak level: ${state.peakDb} dB` };
    publish();
  };

  const logAction = async (label: string, prediction: SoundPrediction) => {
    await captureLocation();
    const action: SoundAction = {
      label,
      prediction,
      measuredDb: state.peakDb,
      riskLevel: classifyRisk(state.peakDb),
      latitude: state.location?.latitude ?? null,
      longitude: state.location?.longitude ?? null,
    };
    state = {
      ...state,
      actions: [...state.actions, action],
      peakDb: 0,
      currentDb: 0,
      message: `Logged "${label}" at ${action.measuredDb} dB (${getRiskLabel(action.riskLevel)})`,
    };
    publish();
    return action;
  };

  const stop = async () => {
    await stopMetering();
  };

  return {
    requestPermissions,
    startMetering,
    stopMetering,
    logAction,
    captureLocation,
    stop,
  };
}
