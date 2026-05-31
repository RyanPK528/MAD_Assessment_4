import { doc, setDoc, getDoc, query, collection, where, getDocs, getDocFromServer, updateDoc } from 'firebase/firestore';
import { firebaseFirestore } from '../config/firebaseNative';

const GROUPS_COLLECTION = 'groups';
const USERS_COLLECTION = 'users';

export interface GroupDocument {
  id: string;
  name: string;
  gradeLevel: number;
  grade?: number;
  createdBy: string;
  createdAt: string;
  memberCount: number;
  completedActivitiesCount?: number;
  activityResults?: unknown[];
}

export async function createGroup(groupName: string, gradeLevel: number, userId: string): Promise<GroupDocument> {
  // eslint-disable-next-line no-console
  console.log('[GroupService] Creating new group:', groupName, 'grade:', gradeLevel);

  const groupRef = doc(collection(firebaseFirestore, GROUPS_COLLECTION));
  const groupDocument = {
    id: groupRef.id,
    name: groupName,
    gradeLevel,
    grade: gradeLevel,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    memberCount: 1,
    completedActivitiesCount: 0,
    activityResults: [],
  };

  try {
    await setDoc(groupRef, groupDocument);
    
    // Update user's groupId
    const userRef = doc(firebaseFirestore, USERS_COLLECTION, userId);
    await updateDoc(userRef, { groupId: groupRef.id });
    
    // eslint-disable-next-line no-console
    console.log('[GroupService] Group created successfully:', groupRef.id);
    return groupDocument;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[GroupService] Error creating group:', error instanceof Error ? error.message : error);
    throw error;
  }
}

export async function joinGroup(groupId: string, userId: string): Promise<GroupDocument> {
  // eslint-disable-next-line no-console
  console.log('[GroupService] Joining group:', groupId);

  try {
    const groupRef = doc(firebaseFirestore, GROUPS_COLLECTION, groupId);
    let groupSnapshot;

    try {
      groupSnapshot = await getDocFromServer(groupRef);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[GroupService] getDocFromServer failed, falling back to cache');
      groupSnapshot = await getDoc(groupRef);
    }

    if (!groupSnapshot.exists()) {
      throw new Error('Group not found.');
    }

    const groupData = groupSnapshot.data() as GroupDocument;

    // Update user's groupId
    const userRef = doc(firebaseFirestore, USERS_COLLECTION, userId);
    await updateDoc(userRef, { groupId: groupId });

    // Increment member count
    await updateDoc(groupRef, { memberCount: (groupData.memberCount || 0) + 1 });

    // eslint-disable-next-line no-console
    console.log('[GroupService] Successfully joined group:', groupId);
    return groupData;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[GroupService] Error joining group:', error instanceof Error ? error.message : error);
    throw error;
  }
}

export async function fetchAvailableGroups(gradeLevel: number): Promise<GroupDocument[]> {
  // eslint-disable-next-line no-console
  console.log('[GroupService] Fetching available groups for grade:', gradeLevel);

  try {
    const q = query(
      collection(firebaseFirestore, GROUPS_COLLECTION),
      where('gradeLevel', '==', gradeLevel),
    );

    let snapshot;
    try {
      snapshot = await getDocs(q);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[GroupService] Query failed:', e instanceof Error ? e.message : e);
      snapshot = await getDocs(q);
    }

    const groups: GroupDocument[] = [];
    snapshot.forEach((doc) => {
      groups.push(doc.data() as GroupDocument);
    });

    // eslint-disable-next-line no-console
    console.log('[GroupService] Found', groups.length, 'groups');
    return groups;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[GroupService] Error fetching groups:', error instanceof Error ? error.message : error);
    throw error;
  }
}
