import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getApp, getApps, initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, Auth, Firestore, getReactNativePersistence } from 'firebase/auth';
// @ts-ignore: getReactNativePersistence is available in the native SDK but not always in the web types used by TS
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Load Firebase config from environment with proper fallbacks
const getConfigValue = (key: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    const value = process.env[key];
    if (value) return value;
  }

  let extra: Record<string, string | undefined> = {};
  try {
    extra = (Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {}) as Record<string, string | undefined>;
    if (extra[key]) return extra[key];
  } catch {
    // Constants may not be available in all contexts.
  }

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
if (__DEV__) {
  // eslint-disable-next-line no-console
  console.log(`[Firebase] Initializing for ${Platform.OS} (Project: ${firebaseConfig.projectId || 'Unknown'})`);
}

if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
  const errorMsg = '[Firebase] Missing critical configuration. Ensure EXPO_PUBLIC_FIREBASE_* variables are set.';
  // eslint-disable-next-line no-console
  console.error(errorMsg);
}

// Internal singletons
let firebaseApp: FirebaseApp | undefined;
let firebaseAuth: Auth | undefined;
let firebaseFirestore: Firestore | undefined;

export const getFirebaseApp = (): FirebaseApp => {
  if (!firebaseApp) {
    firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return firebaseApp;
};

export const getFirebaseAuth = (): Auth => {
  if (firebaseAuth) return firebaseAuth;

  const app = getFirebaseApp();
  if (Platform.OS === 'web') {
    firebaseAuth = getAuth(app);
  } else {
    try {
      // Attempt to get existing instance to prevent "already registered" errors during Fast Refresh
      firebaseAuth = getAuth(app);
    } catch (e) {
      // Initialize with Persistence if not already registered
      firebaseAuth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    }
  }
  return firebaseAuth;
};

export const getFirebaseFirestore = (): Firestore => {
  if (!firebaseFirestore) {
    firebaseFirestore = getFirestore(getFirebaseApp());
  }
  return firebaseFirestore;
};