import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, getDocFromServer, serverTimestamp, setDoc } from 'firebase/firestore';
import { firebaseAuth, firebaseFirestore } from '../config/firebaseNative';

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  grade: number;
  groupId: string | null;
  createdAt: string;
}

export interface UserRegistrationPayload {
  email: string;
  password: string;
  firstName: string;
  grade: number;
}

export interface UserCredentials {
  email: string;
  password: string;
}

const USERS_COLLECTION = 'users';

export async function registerUser(payload: UserRegistrationPayload): Promise<UserProfile> {
  const { email, password, firstName, grade } = payload;
  
  // eslint-disable-next-line no-console
  console.log('[Auth] Starting registration for:', email);
  
  if (!email || !password || !firstName || grade <= 0) {
    const validationError = 'Please complete all registration fields and provide a valid grade level.';
    // eslint-disable-next-line no-console
    console.error('[Auth] Validation failed:', validationError);
    throw new Error(validationError);
  }

  try {
    // eslint-disable-next-line no-console
    console.log('[Auth] Creating Firebase user...');
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), password);
    const firebaseUser = credential.user;
    // eslint-disable-next-line no-console
    console.log('[Auth] Firebase user created:', firebaseUser.uid);
    
    const profile: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? email.trim(),
      firstName: firstName.trim(),
      grade,
      groupId: null,
      createdAt: new Date().toISOString(),
    };

    // eslint-disable-next-line no-console
    console.log('[Auth] Writing user profile to Firestore...');
    await setDoc(doc(firebaseFirestore, USERS_COLLECTION, firebaseUser.uid), {
      ...profile,
      createdAt: serverTimestamp(),
    });
    
    // eslint-disable-next-line no-console
    console.log('[Auth] Registration completed successfully');
    return profile;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Auth] Registration error:', error instanceof Error ? error.message : error);
    throw error;
  }
}

export async function loginUser(credentials: UserCredentials): Promise<UserProfile> {
  const { email, password } = credentials;
  
  // eslint-disable-next-line no-console
  console.log('[Auth] Starting login for:', email);
  
  if (!email || !password) {
    const validationError = 'Both email and password are required to log in.';
    // eslint-disable-next-line no-console
    console.error('[Auth] Validation failed:', validationError);
    throw new Error(validationError);
  }

  try {
    // eslint-disable-next-line no-console
    console.log('[Auth] Authenticating with Firebase...');
    const signInResult = await signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
    const uid = signInResult.user.uid;
    // eslint-disable-next-line no-console
    console.log('[Auth] User authenticated:', uid);
    
    // eslint-disable-next-line no-console
    console.log('[Auth] Fetching user profile from Firestore...');
    const userRef = doc(firebaseFirestore, USERS_COLLECTION, uid);

    // Prefer a server read for the user profile; fallback to cache if necessary.
    let snapshot;
    try {
      // eslint-disable-next-line no-console
      console.log('[Auth] Reading user profile from server...');
      snapshot = await getDocFromServer(userRef);
    } catch (serverError) {
      // eslint-disable-next-line no-console
      console.warn('[Auth] getDocFromServer failed, falling back to local cache:', serverError instanceof Error ? serverError.message : serverError);
      snapshot = await getDoc(userRef);
    }

    if (!snapshot.exists()) {
      const notFoundError = 'User profile not found after authentication.';
      // eslint-disable-next-line no-console
      console.error('[Auth] Profile error:', notFoundError);
      throw new Error(notFoundError);
    }

    const data = snapshot.data();
    const result: UserProfile = {
      uid,
      email: String(data.email ?? ''),
      firstName: String(data.firstName ?? ''),
      grade: Number(data.grade ?? 0),
      groupId: data.groupId === null ? null : String(data.groupId),
      createdAt: String(data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? new Date().toISOString()),
    };
    
    // eslint-disable-next-line no-console
    console.log('[Auth] Login completed successfully');
    return result;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Auth] Login error:', error instanceof Error ? error.message : error);
    throw error;
  }
}
