import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { GROUPS_COLLECTION, USERS_COLLECTION } from '../config/constants';
import { GroupDocument, GroupCreatePayload } from '../models/Group';
import { UserProfile } from '../models/User';

const generateDiscriminatorCode = (): string => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 })
    .map(() => alphabet[Math.floor(Math.random() * alphabet.length)])
    .join('');
};

const createUniqueTeamCode = async (): Promise<string> => {
  const groupsRef = collection(firestore, GROUPS_COLLECTION);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateDiscriminatorCode();
    const existing = await getDocs(query(groupsRef, where('teamDiscriminatorId', '==', candidate)));
    if (existing.empty) {
      return candidate;
    }
  }

  throw new Error('Unable to generate a unique team code at this time. Please try again.');
};

export async function createGroup(name: string, creator: UserProfile): Promise<GroupDocument> {
  if (!name.trim()) {
    throw new Error('Group name cannot be empty.');
  }

  try {
    const teamDiscriminatorId = await createUniqueTeamCode();
    const groupRef = doc(collection(firestore, GROUPS_COLLECTION));
    const newGroup: Omit<GroupDocument, 'id'> = {
      name: name.trim(),
      grade: creator.grade,
      teamDiscriminatorId,
      memberIds: [creator.uid],
      createdAt: serverTimestamp() as unknown as any,
      completedActivitiesCount: 0,
      lastProgressUpdatedAt: serverTimestamp() as unknown as any,
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

export async function joinGroup(teamCode: string, user: UserProfile): Promise<GroupDocument> {
  const normalizedCode = teamCode.trim().toUpperCase();

  if (normalizedCode.length !== 6) {
    throw new Error('Please provide a valid 6-character group code.');
  }

  try {
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
      if (!currentGroup.exists()) {
        throw new Error('Group no longer exists. Please try a different code.');
      }

      const groupData = currentGroup.data() as GroupDocument;

      if (groupData.grade !== user.grade) {
        throw new Error(
          `Grade level mismatch: this team is for grade ${groupData.grade}. You are registered for grade ${user.grade}.`,
        );
      }

      const memberIds = new Set<string>(groupData.memberIds);
      memberIds.add(user.uid);

      transaction.update(groupRef, {
        memberIds: Array.from(memberIds),
        lastProgressUpdatedAt: serverTimestamp(),
      });

      const userRef = doc(firestore, USERS_COLLECTION, user.uid);
      transaction.update(userRef, { groupId: groupRef.id });
    });

    return {
      id: groupRef.id,
      ...(groupDoc.data() as Omit<GroupDocument, 'id'>),
    } as GroupDocument;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to join group.';
    throw new Error(`Join group failed: ${message}`);
  }
}
