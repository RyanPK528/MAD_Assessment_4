/**
 * Background Task Service
 * Uses expo-task-manager + expo-background-fetch for periodic background work.
 * Syncs pending activity results when the app is backgrounded or the OS wakes the app.
 */
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { AppState, type AppStateStatus } from 'react-native';

export const BACKGROUND_SYNC_TASK = 'STEMM_LAB_BACKGROUND_SYNC';

async function runBackgroundSync(): Promise<number> {
  const { syncPendingResults } = await import('@/services/activityResultService');
  return syncPendingResults();
}

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    const synced = await runBackgroundSync();

    if (synced > 0) {
      try {
        const { scheduleLocalNotification } = await import('@/services/notificationService');
        await scheduleLocalNotification(
          'STEMM Lab',
          synced === 1 ? '1 attempt synced to the cloud.' : `${synced} attempts synced to the cloud.`,
        );
      } catch {
        // Notification optional
      }
    }

    return synced > 0
      ? BackgroundFetch.BackgroundFetchResult.NewData
      : BackgroundFetch.BackgroundFetchResult.NoData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundSync(minimumIntervalSec = 900): Promise<void> {
  const status = await BackgroundFetch.getStatusAsync();
  if (status !== BackgroundFetch.BackgroundFetchStatus.Available) {
    return;
  }

  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
  if (isRegistered) return;

  await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
    minimumInterval: minimumIntervalSec,
    stopOnTerminate: false,
    startOnBoot: true,
  });
}

export async function unregisterBackgroundSync(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
  if (isRegistered) {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
  }
}

export async function getBackgroundFetchStatus(): Promise<string> {
  const status = await BackgroundFetch.getStatusAsync();
  switch (status) {
    case BackgroundFetch.BackgroundFetchStatus.Restricted:
      return 'restricted';
    case BackgroundFetch.BackgroundFetchStatus.Denied:
      return 'denied';
    case BackgroundFetch.BackgroundFetchStatus.Available:
      return 'available';
    default:
      return 'unknown';
  }
}

let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null = null;

/** Sync pending results whenever the app returns to the foreground. */
export function registerForegroundSyncListener(): () => void {
  if (appStateSubscription) {
    appStateSubscription.remove();
  }

  appStateSubscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
    if (nextState === 'active') {
      void runBackgroundSync();
    }
  });

  return () => {
    appStateSubscription?.remove();
    appStateSubscription = null;
  };
}

export async function initializeBackgroundSync(): Promise<() => void> {
  await registerBackgroundSync();
  return registerForegroundSyncListener();
}
