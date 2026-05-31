import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, initializeAuth, type Persistence } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getConfigValue = (key: string): string => {
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key] as string;
  }

  try {
    const extra = (Constants.expoConfig?.extra ?? Constants.manifest?.extra ?? {}) as Record<
      string,
      string | undefined
    >;
    if (extra[key]) {
      return extra[key] as string;
    }
  } catch {
    // Constants may not be available in all contexts.
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

let firebaseApp: FirebaseApp | null | undefined;
let firebaseAuthInstance: Auth | null | undefined;
let firebaseFirestoreInstance: Firestore | null | undefined;

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);
}

function logFirebaseStatus(): void {
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[Firebase] Configuration loaded:');
    // eslint-disable-next-line no-console
    console.log('[Firebase]   projectId:', firebaseConfig.projectId ? '✓' : '✗ MISSING');
    // eslint-disable-next-line no-console
    console.log('[Firebase]   apiKey:', firebaseConfig.apiKey ? '✓' : '✗ MISSING');
    // eslint-disable-next-line no-console
    console.log('[Firebase]   Platform:', Platform.OS);
    if (!isFirebaseConfigured()) {
      // eslint-disable-next-line no-console
      console.warn(
        '[Firebase] Running without Firebase — auth, groups, and cloud sync are disabled. Activity sensors still work.',
      );
    }
  }
}

logFirebaseStatus();

export function getFirebaseApp(): FirebaseApp | null {
  if (firebaseApp !== undefined) {
    return firebaseApp;
  }

  if (!isFirebaseConfigured()) {
    firebaseApp = null;
    return null;
  }

  try {
    firebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[Firebase] App initialization failed:', error);
    firebaseApp = null;
  }

  return firebaseApp;
}

export function getFirebaseAuth(): Auth | null {
  if (firebaseAuthInstance !== undefined) {
    return firebaseAuthInstance;
  }

  const app = getFirebaseApp();
  if (!app) {
    firebaseAuthInstance = null;
    return null;
  }

  if (Platform.OS !== 'web') {
    try {
      const authModule = require('firebase/auth') as typeof import('firebase/auth');
      const persistence = authModule.getReactNativePersistence(AsyncStorage) as Persistence;
      firebaseAuthInstance = initializeAuth(app, { persistence });
      return firebaseAuthInstance;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('already initialized')) {
        // eslint-disable-next-line no-console
        console.warn('[Firebase] initializeAuth failed, trying getAuth():', message);
      }
    }
  }

  try {
    firebaseAuthInstance = getAuth(app);
    return firebaseAuthInstance;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[Firebase] Auth unavailable:', error);
    firebaseAuthInstance = null;
    return null;
  }
}

export function getFirebaseFirestore(): Firestore | null {
  if (firebaseFirestoreInstance !== undefined) {
    return firebaseFirestoreInstance;
  }

  const app = getFirebaseApp();
  if (!app) {
    firebaseFirestoreInstance = null;
    return null;
  }

  try {
    firebaseFirestoreInstance = getFirestore(app);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[Firebase] Firestore unavailable:', error);
    firebaseFirestoreInstance = null;
  }

  return firebaseFirestoreInstance;
}

/** @deprecated Prefer getFirebaseAuth() — returns null when Firebase is not configured. */
export const firebaseAuth = {
  get currentUser() {
    return getFirebaseAuth()?.currentUser ?? null;
  },
} as Auth;

/** @deprecated Prefer getFirebaseFirestore() — returns null when Firebase is not configured. */
export const firebaseFirestore = new Proxy({} as Firestore, {
  get(_target, prop) {
    const db = getFirebaseFirestore();
    if (!db) {
      throw new Error('Firebase Firestore is not configured. Add EXPO_PUBLIC_FIREBASE_* to .env');
    }
    return Reflect.get(db, prop);
  },
});
