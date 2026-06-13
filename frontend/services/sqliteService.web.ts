/**
 * Web fallback — expo-sqlite WASM is not bundled for web in this project.
 * Uses an in-memory queue so activity saves and sync logic still run in the browser.
 */

export interface SyncRecord {
  id: number;
  payload: string;
  status: 'pending' | 'synced' | 'failed';
  createdAt: number;
  updatedAt: number;
  latitude: number | null;
  longitude: number | null;
  dueTimestamp: number | null;
}

const memoryQueue: SyncRecord[] = [];
let nextId = 1;
let queueInitialized = false;

export async function initializeSyncQueue(): Promise<void> {
  queueInitialized = true;
}

export async function ensureSyncQueueInitialized(): Promise<void> {
  if (!queueInitialized) {
    await initializeSyncQueue();
  }
}

export async function addSyncRecord(
  payload: object,
  dueTimestamp: number | null = null,
  location: { latitude: number; longitude: number } | null = null,
): Promise<void> {
  const now = Date.now();
  memoryQueue.push({
    id: nextId++,
    payload: JSON.stringify(payload),
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    latitude: location?.latitude ?? null,
    longitude: location?.longitude ?? null,
    dueTimestamp,
  });
}

export async function getPendingSyncRecords(): Promise<SyncRecord[]> {
  return memoryQueue
    .filter((record) => record.status === 'pending')
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function getDueSyncRecords(): Promise<SyncRecord[]> {
  const now = Date.now();
  return memoryQueue
    .filter(
      (record) =>
        record.status === 'pending' &&
        (record.dueTimestamp === null || record.dueTimestamp <= now),
    )
    .sort((a, b) => {
      if (a.dueTimestamp === null && b.dueTimestamp === null) return 0;
      if (a.dueTimestamp === null) return 1;
      if (b.dueTimestamp === null) return -1;
      return a.dueTimestamp - b.dueTimestamp;
    });
}

export async function markRecordSynced(id: number): Promise<void> {
  const record = memoryQueue.find((entry) => entry.id === id);
  if (record) {
    record.status = 'synced';
    record.updatedAt = Date.now();
  }
}

export async function markRecordFailed(id: number): Promise<void> {
  const record = memoryQueue.find((entry) => entry.id === id);
  if (record) {
    record.status = 'failed';
    record.updatedAt = Date.now();
  }
}

export async function markRecordRetry(id: number, backoffMs: number): Promise<void> {
  const record = memoryQueue.find((entry) => entry.id === id);
  if (record) {
    const now = Date.now();
    record.status = 'pending';
    record.updatedAt = now;
    record.dueTimestamp = now + backoffMs;
  }
}

export async function getPendingSyncCount(): Promise<number> {
  return memoryQueue.filter((record) => record.status === 'pending').length;
}
