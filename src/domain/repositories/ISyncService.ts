export interface SyncResult {
  success: boolean;
  timestamp: number;
  pulledNotesCount: number;
  pushedNotesCount: number;
  pulledTasksCount: number;
  pushedTasksCount: number;
  error?: string;
}

export interface ISyncService {
  synchronize(): Promise<SyncResult>;
  getLastSyncTimestamp(): Promise<number | null>;
  setLastSyncTimestamp(timestamp: number): Promise<void>;
}
