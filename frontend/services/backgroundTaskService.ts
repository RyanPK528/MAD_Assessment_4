/**
 * Background Task Service
 * Uses expo-task-manager + expo-background-fetch for periodic background work.
 * Example: syncing pending activity results when the app is backgrounded.
 */
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

// ─── Task name constant (must be unique across your app) ─────────────────────
export const BACKGROUND_SYNC_TASK = 'STEMM_LAB_BACKGROUND_SYNC';

/**
 * Define the background task.
 * This MUST be called at module-level (outside any component) so it's
 * registered before the app mounts. Place the import of this file in
 * your app/_layout.tsx or app entry.
 */
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    // Perform lightweight background work here (e.g. sync pending results)
    const { syncPendingResults } = await import('@/services/activityResultService');
    await syncPendingResults();

    // Return success so the OS knows the task completed
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

/**
 * Register the background fetch schedule.
 * Call this once during app initialization (e.g. in RootLayout useEffect).
 *
 * @param minimumIntervalSec - Minimum interval between fetches (default 15 min)
 */
export async function registerBackgroundSync(minimumIntervalSec = 900): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
  if (isRegistered) return;

  await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
    minimumInterval: minimumIntervalSec,
    stopOnTerminate: false,
    startOnBoot: true,
  });
}

/**
 * Unregister the background task (e.g. on logout).
 */
export async function unregisterBackgroundSync(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
  if (isRegistered) {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_SYNC_TASK);
  }
}

/**
 * Check current background fetch status for debugging.
 */
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
