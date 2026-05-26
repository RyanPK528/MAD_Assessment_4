import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

/**
 * Register a new user with email/password and update their display name.
 * Does NOT save team data yet — that happens in TeamSetupScreen.
 */
export const registerUser = async ({ email, password, displayName }) => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName });
  return user;
};

/**
 * Sign in an existing user.
 */
export const loginUser = async ({ email, password }) => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
};

/**
 * Sign out the current user.
 */
export const logoutUser = async () => {
  await signOut(auth);
};

/**
 * Send a password reset email.
 */
export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

/**
 * Save team setup data to Firestore under the user's UID.
 * Called after registration from TeamSetupScreen.
 */
export const saveTeamData = async (userId, teamData) => {
  await setDoc(doc(db, 'teams', userId), {
    ...teamData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};

/**
 * Fetch team data for a given user ID from Firestore.
 */
export const fetchTeamData = async (userId) => {
  const snap = await getDoc(doc(db, 'teams', userId));
  return snap.exists() ? snap.data() : null;
};
