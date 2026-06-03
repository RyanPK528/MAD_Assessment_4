import { useCallback, useState } from 'react';

import { ActivityId } from '@/constants/activities';
import { getMaxAttempts } from '@/constants/activityAttemptConfig';
import { saveActivityAttempt } from '@/services/activityResultService';
import { ActivityAttemptRecord } from '@/types/activityAttempt';

interface UseActivitySubmissionOptions {
  activityId: ActivityId;
  onSuccess?: (record: ActivityAttemptRecord) => void;
}

export function useActivitySubmission({ activityId, onSuccess }: UseActivitySubmissionOptions) {
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingData, setPendingData] = useState<Record<string, unknown> | null>(null);
  const [pendingLocation, setPendingLocation] = useState<{ latitude: number; longitude: number } | null | undefined>(
    undefined,
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState(0);

  const maxAttempts = getMaxAttempts(activityId);
  const canSubmit = maxAttempts === undefined || attemptCount < maxAttempts;

  const requestSubmit = useCallback(
    (
      data: Record<string, unknown>,
      options?: { location?: { latitude: number; longitude: number } | null },
    ) => {
      if (!canSubmit) {
        setSubmitError(`Maximum of ${maxAttempts} attempts reached.`);
        return;
      }
      setSubmitError(null);
      setPendingData(data);
      setPendingLocation(options?.location);
      setModalVisible(true);
    },
    [canSubmit, maxAttempts],
  );

  const cancelSubmit = useCallback(() => {
    if (submitting) {
      return;
    }
    setModalVisible(false);
    setPendingData(null);
    setPendingLocation(undefined);
    setSubmitError(null);
  }, [submitting]);

  const confirmSubmit = useCallback(
    async (selfRating: number, reflection: string) => {
      if (!pendingData) {
        return;
      }

      setSubmitting(true);
      setSubmitError(null);
      try {
        const record = await saveActivityAttempt({
          activityId,
          data: pendingData,
          selfRating,
          reflection,
          location: pendingLocation,
        });
        setAttemptCount((count) => count + 1);
        setModalVisible(false);
        setPendingData(null);
        setPendingLocation(undefined);
        onSuccess?.(record);
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Failed to save attempt.');
        throw err;
      } finally {
        setSubmitting(false);
      }
    },
    [activityId, onSuccess, pendingData, pendingLocation],
  );

  return {
    modalVisible,
    submitting,
    submitError,
    canSubmit,
    requestSubmit,
    cancelSubmit,
    confirmSubmit,
  };
}
