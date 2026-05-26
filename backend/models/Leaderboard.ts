export interface LeaderboardEntry {
  rank: number;
  groupId: string;
  name: string;
  grade: number;
  completedActivitiesCount: number;
  lastProgressUpdatedAt: string;
  completionPercent: number;
}
