import type { Timestamp } from 'firebase/firestore';

export interface GroupDocument {
  id: string;
  name: string;
  grade: number;
  teamDiscriminatorId: string;
  memberIds: string[];
  createdAt: Timestamp;
  completedActivitiesCount: number;
  lastProgressUpdatedAt: Timestamp;
}

export interface GroupCreatePayload {
  name: string;
  grade: number;
  creatorUid: string;
}
