import { ActivityId } from '@/constants/activities';

export interface ActivityAttemptRecord {
  attemptId: string;
  activityId: ActivityId;
  attemptNumber: number;
  completedAt: string;
  selfRating: number;
  reflection: string;
  submittedBy: string;
  data: Record<string, unknown>;
  syncedAt?: string;
  latitude?: number | null;
  longitude?: number | null;
  instructorFeedback?: string;
  grade?: number;
  activityVersion?: string;
}

export interface SaveActivityAttemptInput {
  activityId: ActivityId;
  data: Record<string, unknown>;
  selfRating: number;
  reflection: string;
  location?: { latitude: number; longitude: number } | null;
}

export interface RawActivityResultEntry {
  activityId?: string;
  completedAt?: string;
  data?: Record<string, unknown>;
  reflection?: string;
  attemptId?: string;
  attemptNumber?: number;
  selfRating?: number;
  submittedBy?: string;
  syncedAt?: string;
  latitude?: number | null;
  longitude?: number | null;
}
