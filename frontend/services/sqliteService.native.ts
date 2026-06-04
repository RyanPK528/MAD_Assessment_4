import { openDatabaseSync, type SQLiteDatabase } from 'expo-sqlite';

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

let db: SQLiteDatabase | null = null;

function getDb(): SQLiteDatabase {
  if (!db) {
    db = openDatabaseSync('stemm_lab_offline.db');
  }
  return db;
}

export async function initializeSyncQueue(): Promise<void> {
  const database = getDb();
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS offline_sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payload TEXT NOT NULL,
      status TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      latitude REAL,
      longitude REAL,
      dueTimestamp INTEGER
    );
  `);
}

let queueInitialized = false;

/** Idempotent wrapper — safe to call from app startup and activity saves. */
export async function ensureSyncQueueInitialized(): Promise<void> {
  if (!queueInitialized) {
    await initializeSyncQueue();
    queueInitialized = true;
  }
}

export async function addSyncRecord(
  payload: object,
  dueTimestamp: number | null = null,
  location: { latitude: number; longitude: number } | null = null,
): Promise<void> {
  const now = Date.now();
  const database = getDb();
  await database.runAsync(
    `INSERT INTO offline_sync_queue (payload, status, createdAt, updatedAt, latitude, longitude, dueTimestamp)
     VALUES (?, 'pending', ?, ?, ?, ?, ?);`,
    JSON.stringify(payload),
    now,
    now,
    location?.latitude ?? null,
    location?.longitude ?? null,
    dueTimestamp,
  );
}

export async function getPendingSyncRecords(): Promise<SyncRecord[]> {
  const database = getDb();
  return database.getAllAsync<SyncRecord>(
    `SELECT * FROM offline_sync_queue WHERE status = 'pending' ORDER BY createdAt ASC;`,
  );
}

export async function getDueSyncRecords(): Promise<SyncRecord[]> {
  const now = Date.now();
  const database = getDb();
  return database.getAllAsync<SyncRecord>(
    `SELECT * FROM offline_sync_queue WHERE status = 'pending' AND (dueTimestamp IS NULL OR dueTimestamp <= ?)
     ORDER BY dueTimestamp IS NULL, dueTimestamp ASC;`,
    now,
  );
}

export async function markRecordSynced(id: number): Promise<void> {
  const database = getDb();
  await database.runAsync(
    `UPDATE offline_sync_queue SET status = 'synced', updatedAt = ? WHERE id = ?;`,
    Date.now(),
    id,
  );
}

export async function markRecordFailed(id: number): Promise<void> {
  const database = getDb();
  await database.runAsync(
    `UPDATE offline_sync_queue SET status = 'failed', updatedAt = ? WHERE id = ?;`,
    Date.now(),
    id,
  );
}
