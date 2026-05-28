import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getApps, initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Load Firebase config from environment with proper fallbacks
const getConfigValue = (key: string): string => {
  // First: check if it's available in process.env (set by build system)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    const value = process.env[key];
    if (value) return value;
  }
  
  // Second: try Constants.expoConfig?.extra (native/Expo Go)
  let extra: Record<string, string | undefined> = {};
  try {
    extra = (Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {}) as Record<string, string | undefined>;
    if (extra[key]) return extra[key];
  } catch (e) {
    // Constants might not be available in all contexts
  }
  
  // Third: try globalThis (web fallback)
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

let firebaseAuth: Auth;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line no-console
    console.log('[Firebase] Initializing Auth on native platform with AsyncStorage persistence...');
    firebaseAuth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
    // eslint-disable-next-line no-console
    console.log('[Firebase] Native Auth initialized');
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    // eslint-disable-next-line no-console
    console.warn('[Firebase] Native auth initialization failed; falling back to getAuth().', message);
    firebaseAuth = getAuth(app);
  }
} else {
  // eslint-disable-next-line no-console
  console.log('[Firebase] Web platform detected, using getAuth()');
  firebaseAuth = getAuth(app);
}

export { firebaseAuth };
export const firebaseFirestore = getFirestore(app);
