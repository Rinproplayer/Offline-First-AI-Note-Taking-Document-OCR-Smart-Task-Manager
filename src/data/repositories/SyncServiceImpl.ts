import { ISyncService, SyncResult } from '../../domain/repositories/ISyncService';
import { performTwoWaySync } from '../sync/supabaseSync';
import { mmkvStorage } from '../cache/mmkvStorage';

export class SyncServiceImpl implements ISyncService {
  async synchronize(): Promise<SyncResult> {
    return performTwoWaySync();
  }

  async getLastSyncTimestamp(): Promise<number | null> {
    return mmkvStorage.getLastSyncTimestamp();
  }

  async setLastSyncTimestamp(timestamp: number): Promise<void> {
    mmkvStorage.setLastSyncTimestamp(timestamp);
  }
}

export const syncServiceImpl = new SyncServiceImpl();
