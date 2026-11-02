import { ISyncService, SyncResult } from '../repositories/ISyncService';

export class SyncDataUseCase {
  constructor(private readonly syncService: ISyncService) {}

  async execute(): Promise<SyncResult> {
    const result = await this.syncService.synchronize();
    if (result.success) {
      await this.syncService.setLastSyncTimestamp(result.timestamp);
    }
    return result;
  }

  async getLastSyncTime(): Promise<Date | null> {
    const ts = await this.syncService.getLastSyncTimestamp();
    return ts ? new Date(ts) : null;
  }
}
