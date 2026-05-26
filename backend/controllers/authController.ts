import { createUserWithEmailAndPassword, signInWithEmailAndPassword, User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../config/firebase';
import { USERS_COLLECTION } from '../config/constants';
import { UserCredentials, UserProfile, UserRegistrationPayload } from '../models/User';

export async function registerUser(payload: UserRegistrationPayload): Promise<UserProfile> {
  const { email, password, firstName, grade } = payload;

  if (!email || !password || !firstName || grade <= 0) {
    throw new Error('Please complete all registration fields and provide a valid grade level.');
  }

  try {
    const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const firebaseUser: User = credential.user;
    const userProfile: UserProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? email.trim(),
      firstName: firstName.trim(),
      grade,
      groupId: null,
      createdAt: new Date().toISOString(),
    };

    const userRef = doc(firestore, USERS_COLLECTION, firebaseUser.uid);
    await setDoc(userRef, {
      ...userProfile,
      createdAt: serverTimestamp(),
    });

    return userProfile;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to register user.';
    throw new Error(`Registration failed: ${message}`);
  }
}

export async function loginUser(credentials: UserCredentials): Promise<UserProfile> {
  const { email, password } = credentials;

  if (!email || !password) {
    throw new Error('Both email and password are required to log in.');
  }

  try {
    const signInResult = await signInWithEmailAndPassword(auth, email.trim(), password);
    const uid = signInResult.user.uid;
    const profile = await getUserProfile(uid);

    if (!profile) {
      throw new Error('User profile not found after authentication. Please contact support.');
    }

    return profile;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to sign in.';
    throw new Error(`Login failed: ${message}`);
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!uid) {
    return null;
  }

  try {
    const userRef = doc(firestore, USERS_COLLECTION, uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();

    return {
      uid,
      email: String(data.email ?? ''),
      firstName: String(data.firstName ?? ''),
      grade: Number(data.grade ?? 0),
      groupId: data.groupId === null ? null : String(data.groupId),
      createdAt: String(data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? new Date().toISOString()),
    };
  } catch (error: unknown) {
    throw new Error('Failed to retrieve user profile.');
  }
}
