import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { getApp, getApps, initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, Auth, Firestore, getReactNativePersistence } from 'firebase/auth';
// @ts-ignore: getReactNativePersistence is available in the native SDK but not always in the web types used by TS
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  if (typeof globalThis !== 'undefined' && (globalThis as Record<string, string>)[key]) {
    return (globalThis as Record<string, string>)[key];
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

if (__DEV__) {
  console.log(`[Firebase] Initializing for ${Platform.OS} (Project: ${firebaseConfig.projectId || 'Unknown'})`);
}

if (!firebaseConfig.projectId || !firebaseConfig.apiKey) {
  console.error('[Firebase] Missing critical configuration. Ensure EXPO_PUBLIC_FIREBASE_* variables are set.');
}

let firebaseApp: FirebaseApp | undefined;
let firebaseAuth: Auth | undefined;
let firebaseFirestore: Firestore | undefined;

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);
}

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
      firebaseAuth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } catch {
      firebaseAuth = getAuth(app);
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
