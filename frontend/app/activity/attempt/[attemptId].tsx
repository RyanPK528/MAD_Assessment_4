import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';

import { AttemptDetailsScreen } from '@/components/activity/AttemptDetailsScreen';
import { ActivityId } from '@/constants/activities';
import { getActivityAttempt } from '@/services/activityResultService';
import { ActivityAttemptRecord } from '@/types/activityAttempt';

export default function AttemptDetailsRoute() {
  const { attemptId, activityId } = useLocalSearchParams<{
    attemptId: string;
    activityId?: string;
  }>();

  const [attempt, setAttempt] = useState<ActivityAttemptRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAttempt = useCallback(async () => {
    if (!attemptId) {
      setError('Missing attempt ID.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const record = await getActivityAttempt(attemptId);
      if (!record) {
        setError('Attempt not found.');
        setAttempt(null);
      } else if (activityId && record.activityId !== activityId) {
        setError('Attempt does not match this activity.');
        setAttempt(null);
      } else {
        setAttempt(record);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attempt.');
    } finally {
      setLoading(false);
    }
  }, [activityId, attemptId]);

  useEffect(() => {
    void loadAttempt();
  }, [loadAttempt]);

  return (
    <AttemptDetailsScreen
      attempt={attempt}
      loading={loading}
      error={error}
      onRetry={() => void loadAttempt()}
    />
  );
}
