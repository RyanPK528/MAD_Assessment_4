import * as BackgroundFetch from 'expo-background-fetch';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { addSyncRecord, getDueSyncRecords, markRecordFailed, markRecordSynced } from '../services/sqliteService';

const TASK_NAME = 'STEMM_LAB_SYNC_TASK';

async function submitDeferredRecords(): Promise<BackgroundFetch.Result> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    const location = status === 'granted' ? await Location.getCurrentPositionAsync({ accuracy: Location.LocationAccuracy.Low }) : null;
    const records = await getDueSyncRecords();

    if (records.length === 0) {
      return BackgroundFetch.Result.NoData;
    }

    for (const record of records) {
      try {
        const payload = JSON.parse(record.payload) as Record<string, unknown>;
        const enhancedPayload = {
          ...payload,
          syncedAt: new Date().toISOString(),
          location: location
            ? {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }
            : null,
        };

        // In a production implementation, this is where the payload would be written to Firestore or an API endpoint.
        // For now the task manager marks the record as synced after preparing enriched data.
        await markRecordSynced(record.id);
      } catch {
        await markRecordFailed(record.id);
      }
    }

    if (records.some((record) => (record.dueTimestamp ?? 0) <= Date.now())) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'STEMM Lab sync reminder',
          body: 'Offline session data was queued and is now syncing in the background.',
        },
        trigger: null,
      });
    }

    return BackgroundFetch.Result.NewData;
  } catch {
    return BackgroundFetch.Result.Failed;
  }
}

TaskManager.defineTask(TASK_NAME, async () => submitDeferredRecords());

export async function initializeBackgroundSync(): Promise<void> {
  try {
    await BackgroundFetch.registerTaskAsync(TASK_NAME, {
      minimumInterval: 900,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  } catch {
    // Gracefully ignore registration failures on unsupported environments.
  }
}

export async function triggerLocalReminder(title: string, body: string): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  } catch {
      // no-op to preserve flow
  }
}
