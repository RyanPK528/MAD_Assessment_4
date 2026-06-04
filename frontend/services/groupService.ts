import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { getFirebaseFirestore } from '../config/firebaseNative';
import { createUniqueTeamDiscriminatorId } from '../utils/groupDiscriminator';
import { TeamAccountProfile } from './authService';

export interface GroupDocument {
  id: string;
  name: string;
  grade: number;
  teamDiscriminatorId: string;
  memberIds: string[];
  createdAt: any;
  completedActivitiesCount: number;
  lastProgressUpdatedAt: any;
}

const GROUPS_COLLECTION = 'groups';
const USERS_COLLECTION = 'users';

export async function fetchGroupForUser(uid: string): Promise<GroupDocument | null> {
  if (!uid) return null;

  const firestore = getFirebaseFirestore();
  const userSnap = await getDoc(doc(firestore, USERS_COLLECTION, uid));
  if (!userSnap.exists()) return null;

  const groupId = String(userSnap.data().groupId ?? '');
  if (!groupId) return null;

  const groupSnap = await getDoc(doc(firestore, GROUPS_COLLECTION, groupId));
  if (!groupSnap.exists()) return null;

  const data = groupSnap.data();
  return {
    id: groupSnap.id,
    name: String(data.name ?? 'Unnamed Group'),
    grade: Number(data.grade ?? 0),
    teamDiscriminatorId: String(data.teamDiscriminatorId ?? ''),
    memberIds: Array.isArray(data.memberIds) ? data.memberIds.map(String) : [],
    createdAt: data.createdAt,
    completedActivitiesCount: Number(data.completedActivitiesCount ?? 0),
    lastProgressUpdatedAt: data.lastProgressUpdatedAt,
  };
}

export async function createGroup(name: string, creator: TeamAccountProfile): Promise<GroupDocument> {
  if (!name.trim()) {
    throw new Error('Group name cannot be empty.');
  }

  try {
    const firestore = getFirebaseFirestore();
    const teamDiscriminatorId = await createUniqueTeamDiscriminatorId();
    const groupRef = doc(collection(firestore, GROUPS_COLLECTION));
    const newGroup: Omit<GroupDocument, 'id'> = {
      name: name.trim(),
      grade: creator.grade,
      teamDiscriminatorId,
      memberIds: [creator.uid],
      createdAt: serverTimestamp() as any,
      completedActivitiesCount: 0,
      lastProgressUpdatedAt: serverTimestamp() as any,
    };

    await runTransaction(firestore, async (transaction) => {
      transaction.set(groupRef, newGroup);
      const userRef = doc(firestore, USERS_COLLECTION, creator.uid);
      transaction.update(userRef, { groupId: groupRef.id });
    });

    return {
      id: groupRef.id,
      ...newGroup,
    } as GroupDocument;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to create group.';
    throw new Error(`Create group failed: ${message}`);
  }
}

export async function joinGroup(teamCode: string, user: TeamAccountProfile): Promise<GroupDocument> {
  const normalizedCode = teamCode.trim().toUpperCase();

  if (normalizedCode.length !== 6) {
    throw new Error('Please provide a valid 6-character group code.');
  }

  try {
    const firestore = getFirebaseFirestore();
    const groupsRef = collection(firestore, GROUPS_COLLECTION);
    const groupQuery = query(groupsRef, where('teamDiscriminatorId', '==', normalizedCode));
    const snapshot = await getDocs(groupQuery);

    if (snapshot.empty) {
      throw new Error('Group code not found. Please verify the code and try again.');
    }

    const groupDoc = snapshot.docs[0];
    const groupRef = doc(firestore, GROUPS_COLLECTION, groupDoc.id);

    await runTransaction(firestore, async (transaction) => {
      const currentGroup = await transaction.get(groupRef);
      if (!currentGroup.exists()) throw new Error('Group no longer exists.');

      const groupData = currentGroup.data() as GroupDocument;
      if (groupData.grade !== user.grade) {
        throw new Error(`Grade mismatch: this team is for grade ${groupData.grade}.`);
      }

      const memberIds = new Set<string>(groupData.memberIds);
      memberIds.add(user.uid);

      transaction.update(groupRef, { memberIds: Array.from(memberIds), lastProgressUpdatedAt: serverTimestamp() });
      transaction.update(doc(firestore, USERS_COLLECTION, user.uid), { groupId: groupRef.id });
    });

    return { id: groupRef.id, ...groupDoc.data() } as GroupDocument;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to join group.';
    throw new Error(`Join group failed: ${message}`);
  }
}