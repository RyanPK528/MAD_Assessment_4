import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Try multiple sources for config values
const extra = (Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {}) as Record<string, string | undefined>;

// Fallback to process.env for web platform or if extra is not available
const getConfigValue = (key: string): string => {
  // First try extra from expoConfig
  if (extra[key]) return extra[key];
  // Then try process.env
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  // Last resort: try accessing from global scope (for web)
  if (typeof globalThis !== 'undefined' && (globalThis as any)[key]) {
    return (globalThis as any)[key];
  }
  return '';
};

const firebaseConfig = {
  apiKey: getConfigValue('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getConfigValue('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getConfigValue('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getConfigValue('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getConfigValue('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getConfigValue('EXPO_PUBLIC_FIREBASE_APP_ID'),
};

// eslint-disable-next-line no-console
console.log('[Firebase] Configuration loaded:');
// eslint-disable-next-line no-console
console.log('[Firebase]   projectId:', firebaseConfig.projectId ? '✓' : '✗ MISSING');
// eslint-disable-next-line no-console
console.log('[Firebase]   apiKey:', firebaseConfig.apiKey ? '✓' : '✗ MISSING');
// eslint-disable-next-line no-console
console.log('[Firebase]   authDomain:', firebaseConfig.authDomain ? '✓' : '✗ MISSING');
// eslint-disable-next-line no-console
console.log('[Firebase]   Platform:', Platform.OS);

if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
  // eslint-disable-next-line no-console
  console.error('[Firebase] Missing critical configuration. Check .env file and app.config.js');
}

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

let firebaseAuth;
try {
  if (Platform.OS !== 'web') {
    // Try to use react-native AsyncStorage for persistence if available
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    // eslint-disable-next-line no-console
    console.log('[Firebase] Initializing Auth with React Native persistence...');
    firebaseAuth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
    // eslint-disable-next-line no-console
    console.log('[Firebase] Auth initialized with persistence');
  } else {
    // eslint-disable-next-line no-console
    console.log('[Firebase] Web platform detected, using getAuth()');
    firebaseAuth = getAuth(app);
  }
} catch (e) {
  // Fallback to default getAuth if AsyncStorage is not installed or initialization fails
  // This will keep auth in memory only.
  // eslint-disable-next-line no-console
  console.warn('[Firebase] Auth React Native persistence not available, falling back to memory persistence.', e instanceof Error ? e.message : e);
  firebaseAuth = getAuth(app);
}

export { firebaseAuth };
export const firebaseFirestore = getFirestore(app);
