import { create } from 'zustand';
import { SyncDataUseCase } from '../../domain/usecases/SyncDataUseCase';
import { syncServiceImpl } from '../../data/repositories/SyncServiceImpl';

export type SyncStateStatus = 'idle' | 'syncing' | 'synced' | 'offline' | 'error';

interface SyncStoreState {
  status: SyncStateStatus;
  lastSyncTime: Date | null;
  statusLabel: string;
  error: string | null;
  triggerSync: () => Promise<void>;
  checkLastSync: () => Promise<void>;
}

const syncUseCase = new SyncDataUseCase(syncServiceImpl);

export const useSyncStore = create<SyncStoreState>((set, get) => ({
  status: 'synced',
  lastSyncTime: new Date(),
  statusLabel: 'Offline-First • Đã đồng bộ',
  error: null,

  checkLastSync: async () => {
    try {
      const last = await syncUseCase.getLastSyncTime();
      set({
        lastSyncTime: last || new Date(),
        statusLabel: 'Offline-First • Đã đồng bộ'
      });
    } catch {
      set({ status: 'offline', statusLabel: 'Offline-First • Lưu cục bộ' });
    }
  },

  triggerSync: async () => {
    set({ status: 'syncing', statusLabel: 'Đang đồng bộ WatermelonDB...' });
    try {
      const res = await syncUseCase.execute();
      if (res.success) {
        set({
          status: 'synced',
          lastSyncTime: new Date(res.timestamp),
          statusLabel: 'Offline-First • Đã đồng bộ',
          error: null
        });
      } else {
        set({
          status: 'offline',
          statusLabel: 'Offline-First • Lưu cục bộ',
          error: res.error || 'Mất kết nối máy chủ'
        });
      }
    } catch (e: any) {
      set({
        status: 'offline',
        statusLabel: 'Offline-First • Lưu cục bộ',
        error: e.message
      });
    }
  }
}));
