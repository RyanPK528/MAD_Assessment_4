import { collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { GROUPS_COLLECTION, TOTAL_CHALLENGES } from '../config/constants';
import { LeaderboardEntry } from '../models/Leaderboard';

export async function fetchLeaderboardEntries(): Promise<LeaderboardEntry[]> {
  const groupQuery = query(
    collection(firestore, GROUPS_COLLECTION),
    orderBy('completedActivitiesCount', 'desc'),
    orderBy('lastProgressUpdatedAt', 'asc'),
  );

  const snapshot = await getDocs(groupQuery);

  const entries: LeaderboardEntry[] = snapshot.docs.map((docSnapshot, index) => {
    const data = docSnapshot.data();
    const completedActivitiesCount = Number(data.completedActivitiesCount ?? 0);
    const completionPercent = Math.round((completedActivitiesCount / TOTAL_CHALLENGES) * 1000) / 10;
    const lastProgressUpdatedAt = data.lastProgressUpdatedAt as Timestamp | undefined;

    return {
      rank: index + 1,
      groupId: docSnapshot.id,
      name: String(data.name ?? 'Unnamed Group'),
      grade: Number(data.grade ?? 0),
      completedActivitiesCount,
      lastProgressUpdatedAt:
        lastProgressUpdatedAt?.toDate?.()?.toISOString?.() ?? new Date().toISOString(),
      completionPercent,
    };
  });

  return entries;
}
