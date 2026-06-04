import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, getDoc, getDocFromServer, runTransaction, serverTimestamp } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore } from '../config/firebaseNative';
import { createUniqueTeamDiscriminatorId } from '../utils/groupDiscriminator';

export type TeamGradeLevel = 'Year 5' | 'Year 6' | 'Year 7' | 'Year 8' | 'Year 9' | 'Year 10';

export interface TeamAccountProfile {
  uid: string;
  email: string;
  teamName: string;
  memberFirstNames: string[];
  gradeLevel: TeamGradeLevel;
  grade: number;
  groupId: string;
  createdAt: string;
}

export interface TeamRegistrationPayload {
  email: string;
  password: string;
  teamName: string;
  memberFirstNames: string[];
  gradeLevel: TeamGradeLevel;
}

export interface TeamCredentials {
  email: string;
  password: string;
}

const USERS_COLLECTION = 'users';
const GROUPS_COLLECTION = 'groups';
const ALLOWED_GRADE_LEVELS: TeamGradeLevel[] = ['Year 5', 'Year 6', 'Year 7', 'Year 8', 'Year 9', 'Year 10'];

const parseGradeNumber = (gradeLevel: TeamGradeLevel): number => Number(gradeLevel.replace('Year ', ''));

const parseMemberNames = (names: string[]): string[] => {
  return names.map((name) => name.trim()).filter((name) => name.length > 0);
};

export async function registerUser(payload: TeamRegistrationPayload): Promise<TeamAccountProfile> {
  const { email, password, teamName, memberFirstNames, gradeLevel } = payload;
  
   
  console.log('[Auth] Starting registration for:', email);
  
  const parsedMembers = parseMemberNames(memberFirstNames);
  if (!email || !password || !teamName.trim() || parsedMembers.length === 0 || !ALLOWED_GRADE_LEVELS.includes(gradeLevel)) {
    const validationError = 'Please provide a team name, at least one member name, and a valid grade level.';
     
    console.error('[Auth] Validation failed:', validationError);
    throw new Error(validationError);
  }

  try {
     
    console.log('[Auth] Creating Firebase user...');
    const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    const firebaseUser = credential.user;
     
    console.log('[Auth] Firebase user created:', firebaseUser.uid);
    
    const grade = parseGradeNumber(gradeLevel);
    const profile: TeamAccountProfile = {
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? email.trim(),
      teamName: teamName.trim(),
      memberFirstNames: parsedMembers,
      gradeLevel,
      grade,
      groupId: '',
      createdAt: new Date().toISOString(),
    };

    const firestore = getFirebaseFirestore();
    const groupRef = doc(collection(firestore, GROUPS_COLLECTION));
    const teamDiscriminatorId = await createUniqueTeamDiscriminatorId();

    await runTransaction(firestore, async (transaction) => {
      transaction.set(groupRef, {
        name: profile.teamName,
        grade,
        gradeLevel: profile.gradeLevel,
        memberNames: profile.memberFirstNames,
        memberCount: profile.memberFirstNames.length,
        memberIds: [profile.uid],
        teamDiscriminatorId,
        completedActivitiesCount: 0,
        activityResults: [],
        createdAt: serverTimestamp(),
        lastProgressUpdatedAt: serverTimestamp(),
      });

      transaction.set(doc(firestore, USERS_COLLECTION, firebaseUser.uid), {
        ...profile,
        groupId: groupRef.id,
        createdAt: serverTimestamp(),
      });
    });
    
     
    console.log('[Auth] Registration completed successfully');
    return { ...profile, groupId: groupRef.id };
  } catch (error) {
     
    console.error('[Auth] Registration error:', error instanceof Error ? error.message : error);
    throw error;
  }
}

export async function loginUser(credentials: TeamCredentials): Promise<TeamAccountProfile> {
  const { email, password } = credentials;
  
   
  console.log('[Auth] Starting login for:', email);
  
  if (!email || !password) {
    const validationError = 'Both email and password are required to log in.';
     
    console.error('[Auth] Validation failed:', validationError);
    throw new Error(validationError);
  }

  try {
     
    console.log('[Auth] Authenticating with Firebase...');
    const signInResult = await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
    const uid = signInResult.user.uid;
     
    console.log('[Auth] User authenticated:', uid);
    
     
    console.log('[Auth] Fetching user profile from Firestore...');
    const userRef = doc(getFirebaseFirestore(), USERS_COLLECTION, uid);

    // Prefer a server read for the user profile; fallback to cache if necessary.
    let snapshot;
    try {
       
      console.log('[Auth] Reading user profile from server...');
      snapshot = await getDocFromServer(userRef);
    } catch (serverError) {
       
      console.warn('[Auth] getDocFromServer failed, falling back to local cache:', serverError instanceof Error ? serverError.message : serverError);
      snapshot = await getDoc(userRef);
    }

    if (!snapshot.exists()) {
      const notFoundError = 'User profile not found after authentication.';
       
      console.error('[Auth] Profile error:', notFoundError);
      throw new Error(notFoundError);
    }

    const data = snapshot.data();
    const gradeLevel = String(data.gradeLevel ?? `Year ${Number(data.grade ?? 5)}`) as TeamGradeLevel;
    const result: TeamAccountProfile = {
      uid,
      email: String(data.email ?? ''),
      teamName: String(data.teamName ?? 'Unnamed Team'),
      memberFirstNames: Array.isArray(data.memberFirstNames)
        ? data.memberFirstNames.map((item: unknown) => String(item))
        : [],
      gradeLevel,
      grade: Number(data.grade ?? 0),
      groupId: String(data.groupId ?? ''),
      createdAt: String(data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? new Date().toISOString()),
    };
    
     
    console.log('[Auth] Login completed successfully');
    return result;
  } catch (error) {
     
    console.error('[Auth] Login error:', error instanceof Error ? error.message : error);
    throw error;
  }
}

export async function getUserProfile(uid: string): Promise<TeamAccountProfile | null> {
  if (!uid) return null;

  try {
    const userRef = doc(getFirebaseFirestore(), USERS_COLLECTION, uid);
    
    let snapshot;
    try {
      snapshot = await getDocFromServer(userRef);
    } catch {
      snapshot = await getDoc(userRef);
    }

    if (!snapshot.exists()) return null;

    const data = snapshot.data();
    const gradeLevel = String(data.gradeLevel ?? `Year ${Number(data.grade ?? 5)}`) as TeamGradeLevel;
    return {
      uid,
      email: String(data.email ?? ''),
      teamName: String(data.teamName ?? 'Unnamed Team'),
      memberFirstNames: Array.isArray(data.memberFirstNames)
        ? data.memberFirstNames.map((item: unknown) => String(item))
        : [],
      gradeLevel,
      grade: Number(data.grade ?? 0),
      groupId: String(data.groupId ?? ''),
      createdAt: String(data.createdAt?.toDate?.()?.toISOString?.() ?? data.createdAt ?? new Date().toISOString()),
    };
  } catch (error) {
     
    console.error('[Auth] Get profile error:', error);
    throw new Error('Failed to retrieve user profile.');
  }
}

export async function updateTeamProfile(uid: string, updates: Partial<Pick<TeamAccountProfile, 'teamName' | 'memberFirstNames' | 'gradeLevel'>>): Promise<void> {
  const firestore = getFirebaseFirestore();
  const userRef = doc(firestore, USERS_COLLECTION, uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    throw new Error('Team account not found.');
  }

  const userData = userSnap.data();
  const groupId = String(userData.groupId ?? '');
  if (!groupId) {
    throw new Error('Team group is missing.');
  }

  const nextTeamName = updates.teamName?.trim() ?? String(userData.teamName ?? '');
  const nextMemberNames = updates.memberFirstNames ? parseMemberNames(updates.memberFirstNames) : (Array.isArray(userData.memberFirstNames) ? userData.memberFirstNames.map((item: unknown) => String(item)) : []);
  const nextGradeLevel = (updates.gradeLevel ?? String(userData.gradeLevel ?? 'Year 5')) as TeamGradeLevel;
  const nextGrade = parseGradeNumber(nextGradeLevel);

  if (!nextTeamName || nextMemberNames.length === 0 || !ALLOWED_GRADE_LEVELS.includes(nextGradeLevel)) {
    throw new Error('Invalid team details.');
  }

  await runTransaction(firestore, async (transaction) => {
    transaction.update(userRef, {
      teamName: nextTeamName,
      memberFirstNames: nextMemberNames,
      gradeLevel: nextGradeLevel,
      grade: nextGrade,
    });
    transaction.update(doc(firestore, GROUPS_COLLECTION, groupId), {
      name: nextTeamName,
      gradeLevel: nextGradeLevel,
      grade: nextGrade,
      memberNames: nextMemberNames,
      memberCount: nextMemberNames.length,
      lastProgressUpdatedAt: serverTimestamp(),
    });
  });
}