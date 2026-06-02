import { TOTAL_CHALLENGES } from '@/constants/activities';
import { getFirebaseAuth, getFirebaseFirestore, isFirebaseConfigured } from '@/config/firebaseNative';
import {
  addSyncRecord,
  ensureSyncQueueInitialized,
  getDueSyncRecords,
  markRecordFailed,
  markRecordSynced,
  type SyncRecord,
} from '@/services/sqliteService';

const GROUPS_COLLECTION = 'groups';
const USERS_COLLECTION = 'users';

export interface ActivityResultPayload {
  activityId: string;
  completedAt: string;
  data: Record<string, unknown>;
  reflection?: string;
}

export interface LeaderboardEntry {
  rank: number;
  groupId: string;
  name: string;
  grade: number;
  completedActivitiesCount: number;
  completionPercent: number;
  lastProgressUpdatedAt?: string;
}

export async function saveActivityResult(
  activityId: string,
  data: Record<string, unknown>,
  options?: {
    reflection?: string;
    location?: { latitude: number; longitude: number } | null;
    markComplete?: boolean;
  },
): Promise<void> {
  await ensureSyncQueueInitialized();

  const payload: ActivityResultPayload = {
    activityId,
    completedAt: new Date().toISOString(),
    data,
    reflection: options?.reflection,
  };

  await addSyncRecord(payload, null, options?.location ?? null);

  if (options?.markComplete !== false) {
    try {
      await syncPendingResults();
    } catch {
      // Queued offline; background sync will retry when Firebase is available.
    }
  }
}

export async function syncPendingResults(): Promise<number> {
  try {
    await ensureSyncQueueInitialized();

    if (typeof isFirebaseConfigured !== 'function' || !isFirebaseConfigured()) {
      return 0;
    }

    let auth;
    let db;
    try {
      auth = getFirebaseAuth();
      db = getFirebaseFirestore();
    } catch {
      return 0;
    }

    if (!auth?.currentUser || !db) {
      return 0;
    }

    const firestore = await import('firebase/firestore');
    const { arrayUnion, doc, getDoc, serverTimestamp, updateDoc } = firestore;

    if (typeof getDoc !== 'function' || typeof updateDoc !== 'function' || typeof arrayUnion !== 'function') {
      console.warn('[Sync] Firestore helpers unavailable.');
      return 0;
    }

    const userSnap = await getDoc(doc(db, USERS_COLLECTION, auth.currentUser.uid));
    if (!userSnap.exists()) {
      return 0;
    }

    const userData = userSnap.data();
    const groupId = typeof userData?.groupId === 'string' ? userData.groupId : null;
    if (!groupId) {
      return 0;
    }

    let records: SyncRecord[] = [];
    try {
      records = await getDueSyncRecords();
    } catch {
      return 0;
    }

    if (!Array.isArray(records) || records.length === 0) {
      return 0;
    }

    let synced = 0;

    for (const record of records) {
      if (!record?.payload || typeof record.id !== 'number') {
        continue;
      }

      try {
        const payload = JSON.parse(record.payload) as ActivityResultPayload;
        if (!payload?.activityId) {
          await markRecordFailed(record.id);
          continue;
        }

        const groupRef = doc(db, GROUPS_COLLECTION, groupId);
        const completedIds = await getGroupCompletedActivityIds(groupId);
        const safeCompletedIds = Array.isArray(completedIds) ? completedIds : [];
        const isNewActivity = !safeCompletedIds.includes(payload.activityId);

        await updateDoc(groupRef, {
          activityResults: arrayUnion({
            ...payload,
            syncedAt: new Date().toISOString(),
            latitude: record.latitude,
            longitude: record.longitude,
          }),
          ...(isNewActivity
            ? {
                completedActivitiesCount: safeCompletedIds.length + 1,
                lastProgressUpdatedAt: serverTimestamp(),
              }
            : {}),
        });

        await markRecordSynced(record.id);
        synced += 1;
      } catch {
        try {
          await markRecordFailed(record.id);
        } catch {
          // ignore mark failure
        }
      }
    }

    return synced;
  } catch (error) {
    console.warn('[Sync] syncPendingResults failed:', error);
    return 0;
  }
}

async function getGroupCompletedActivityIds(groupId: string): Promise<string[]> {
  const db = getFirebaseFirestore();
  if (!db || !groupId) {
    return [];
  }

  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const groupSnap = await getDoc(doc(db, GROUPS_COLLECTION, groupId));
    if (!groupSnap.exists()) {
      return [];
    }

    const results = groupSnap.data().activityResults;
    if (!Array.isArray(results)) {
      return [];
    }

    const ids = new Set<string>();
    for (const r of results) {
      if (r && typeof r === 'object' && typeof (r as ActivityResultPayload).activityId === 'string') {
        ids.add((r as ActivityResultPayload).activityId);
      }
    }
    return Array.from(ids);
  } catch {
    return [];
  }
}

export async function fetchLeaderboardEntries(): Promise<LeaderboardEntry[]> {
  const db = getFirebaseFirestore();
  if (!db) {
    return [];
  }

  try {
    const { collection, getDocs, orderBy, query } = await import('firebase/firestore');
    const groupQuery = query(
      collection(db, GROUPS_COLLECTION),
      orderBy('completedActivitiesCount', 'desc'),
    );

    const snapshot = await getDocs(groupQuery);

    const entries: LeaderboardEntry[] = snapshot.docs
      .map((docSnapshot) => {
        const data = docSnapshot.data();
        const completedActivitiesCount = Number(
          data.completedActivitiesCount ?? data.activitiesCompleted ?? 0,
        );
        const completionPercent =
          Math.round((completedActivitiesCount / TOTAL_CHALLENGES) * 1000) / 10;
        const grade = Number(data.grade ?? data.gradeLevel ?? 0);

        return {
          groupId: docSnapshot.id,
          name: String(data.name ?? 'Unnamed Group'),
          grade,
          completedActivitiesCount,
          completionPercent,
          lastProgressUpdatedAt: data.lastProgressUpdatedAt?.toDate?.()?.toISOString?.(),
        };
      })
      .sort((a, b) => {
        if (b.completedActivitiesCount !== a.completedActivitiesCount) {
          return b.completedActivitiesCount - a.completedActivitiesCount;
        }
        const aTime = a.lastProgressUpdatedAt ?? '';
        const bTime = b.lastProgressUpdatedAt ?? '';
        return aTime.localeCompare(bTime);
      })
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return entries;
  } catch {
    return [];
  }
}

export async function fetchCurrentGroupStats(): Promise<{
  groupId: string;
  name: string;
  grade: number;
  activitiesCompleted: number;
  activitiesTotal: number;
  memberCount: number;
  completionPercent: number;
} | null> {
  const auth = getFirebaseAuth();
  const db = getFirebaseFirestore();
  if (!auth?.currentUser || !db) {
    return null;
  }

  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const userSnap = await getDoc(doc(db, USERS_COLLECTION, auth.currentUser.uid));
    if (!userSnap.exists()) {
      return null;
    }

    const groupId = userSnap.data().groupId as string | null;
    if (!groupId) {
      return null;
    }

    const groupSnap = await getDoc(doc(db, GROUPS_COLLECTION, groupId));
    if (!groupSnap.exists()) {
      return null;
    }

    const data = groupSnap.data();
    const completed = Number(data.completedActivitiesCount ?? data.activitiesCompleted ?? 0);
    const completionPercent = Math.round((completed / TOTAL_CHALLENGES) * 1000) / 10;

    return {
      groupId,
      name: String(data.name ?? 'Your Group'),
      grade: Number(data.grade ?? data.gradeLevel ?? 0),
      activitiesCompleted: completed,
      activitiesTotal: TOTAL_CHALLENGES,
      memberCount: Number(data.memberCount ?? data.memberIds?.length ?? 1),
      completionPercent,
    };
  } catch {
    return null;
  }
}
