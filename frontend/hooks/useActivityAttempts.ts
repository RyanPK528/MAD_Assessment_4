import { useCallback, useEffect, useState } from 'react';

import { ActivityId } from '@/constants/activities';
import { fetchActivityAttempts } from '@/services/activityResultService';
import { ActivityAttemptRecord } from '@/types/activityAttempt';

export function useActivityAttempts(activityId: ActivityId) {
  const [attempts, setAttempts] = useState<ActivityAttemptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await fetchActivityAttempts(activityId);
      setAttempts(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attempts.');
    } finally {
      setLoading(false);
    }
  }, [activityId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { attempts, loading, error, refresh };
}
