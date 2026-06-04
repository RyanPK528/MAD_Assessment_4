/**
 * TypeScript entry point. Metro resolves sqliteService.native.ts (iOS/Android)
 * or sqliteService.web.ts (web) instead of this file at bundle time.
 */
export type { SyncRecord } from './sqliteService.native';
export {
  initializeSyncQueue,
  ensureSyncQueueInitialized,
  addSyncRecord,
  getPendingSyncRecords,
  getDueSyncRecords,
  markRecordSynced,
  markRecordFailed,
} from './sqliteService.native';
