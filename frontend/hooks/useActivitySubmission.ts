import { useCallback, useState } from 'react';

import { ActivityId } from '@/constants/activities';
import { getMaxAttempts } from '@/constants/activityAttemptConfig';
import { saveActivityAttempt } from '@/services/activityResultService';
import { requestLocationPermission } from '@/services/locationService';
import { ActivityAttemptRecord } from '@/types/activityAttempt';
import * as Location from 'expo-location';

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

  /**
   * Automatically capture GPS when the user initiates submission.
   * Falls back gracefully if permission is denied.
   */
  const captureGps = useCallback(async (): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      const granted = await requestLocationPermission();
      if (!granted) return null;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    } catch {
      return null;
    }
  }, []);

  const requestSubmit = useCallback(
    async (
      data: Record<string, unknown>,
      options?: { location?: { latitude: number; longitude: number } | null },
    ) => {
      if (!canSubmit) {
        setSubmitError(`Maximum of ${maxAttempts} attempts reached.`);
        return;
      }
      setSubmitError(null);
      setPendingData(data);

      // Auto-capture GPS if not explicitly provided
      if (options?.location !== undefined) {
        setPendingLocation(options.location);
      } else {
        const gps = await captureGps();
        setPendingLocation(gps);
      }

      setModalVisible(true);
    },
    [canSubmit, maxAttempts, captureGps],
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

        // Send a local notification confirming submission (safe for Expo Go — falls back to Alert)
        import('@/services/notificationService').then(({ scheduleLocalNotification }) => {
          void scheduleLocalNotification(
            '✅ Activity Submitted!',
            `Your ${activityId.replace(/-/g, ' ')} attempt #${record.attemptNumber} was saved successfully.`,
            1,
          );
        }).catch(() => {
          // Notifications unavailable — silent fail
        });

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
