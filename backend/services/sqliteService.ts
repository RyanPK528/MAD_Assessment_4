import * as SQLite from 'expo-sqlite';

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

const db = SQLite.openDatabase('stemm_lab_offline.db');

const executeSql = <T>(sql: string, params: (string | number | null)[] = []): Promise<T> =>
  new Promise((resolve, reject) => {
    db.transaction((transaction) => {
      transaction.executeSql(
        sql,
        params,
        (_, result) => resolve(result as unknown as T),
        (_, error) => {
          reject(error);
          return false;
        },
      );
    });
  });

export function initializeSyncQueue(): Promise<void> {
  return executeSql<void>(
    `CREATE TABLE IF NOT EXISTS offline_sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payload TEXT NOT NULL,
      status TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      latitude REAL,
      longitude REAL,
      dueTimestamp INTEGER
    );`,
  );
}

export async function addSyncRecord(payload: object, dueTimestamp: number | null = null, location: { latitude: number; longitude: number } | null = null): Promise<void> {
  const now = Date.now();
  await executeSql<void>(
    `INSERT INTO offline_sync_queue (payload, status, createdAt, updatedAt, latitude, longitude, dueTimestamp) VALUES (?, 'pending', ?, ?, ?, ?, ?);`,
    [JSON.stringify(payload), now, now, location?.latitude ?? null, location?.longitude ?? null, dueTimestamp],
  );
}

export async function getPendingSyncRecords(): Promise<SyncRecord[]> {
  const result = await executeSql<{ rows: { _array: SyncRecord[] } }>(
    `SELECT * FROM offline_sync_queue WHERE status = 'pending' ORDER BY createdAt ASC;`,
  );

  return result.rows._array;
}

export async function markRecordSynced(id: number): Promise<void> {
  const now = Date.now();
  await executeSql<void>(
    `UPDATE offline_sync_queue SET status = 'synced', updatedAt = ? WHERE id = ?;`,
    [now, id],
  );
}

export async function markRecordFailed(id: number): Promise<void> {
  const now = Date.now();
  await executeSql<void>(
    `UPDATE offline_sync_queue SET status = 'failed', updatedAt = ? WHERE id = ?;`,
    [now, id],
  );
}

export async function getDueSyncRecords(): Promise<SyncRecord[]> {
  const now = Date.now();
  const result = await executeSql<{ rows: { _array: SyncRecord[] } }>(
    `SELECT * FROM offline_sync_queue WHERE status = 'pending' AND (dueTimestamp IS NULL OR dueTimestamp <= ?) ORDER BY dueTimestamp IS NULL, dueTimestamp ASC;`,
    [now],
  );

  return result.rows._array;
}
