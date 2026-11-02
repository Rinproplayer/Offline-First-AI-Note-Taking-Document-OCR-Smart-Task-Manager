import { MMKV } from 'react-native-mmkv';

class MMKVStorageService {
  private storage: MMKV | null = null;
  private memoryFallback: Map<string, string> = new Map();

  constructor() {
    try {
      this.storage = new MMKV({
        id: 'mindvault_cache',
        encryptionKey: 'mindvault_secure_key'
      });
    } catch (e) {
      console.warn('[MMKV] Native module not available, using in-memory fallback:', e);
    }
  }

  getString(key: string): string | null {
    if (this.storage) {
      return this.storage.getString(key) ?? null;
    }
    return this.memoryFallback.get(key) ?? null;
  }

  setString(key: string, value: string): void {
    if (this.storage) {
      this.storage.set(key, value);
    } else {
      this.memoryFallback.set(key, value);
    }
  }

  getNumber(key: string): number | null {
    if (this.storage) {
      const val = this.storage.getNumber(key);
      return val !== undefined ? val : null;
    }
    const val = this.memoryFallback.get(key);
    return val ? Number(val) : null;
  }

  setNumber(key: string, value: number): void {
    if (this.storage) {
      this.storage.set(key, value);
    } else {
      this.memoryFallback.set(key, String(value));
    }
  }

  delete(key: string): void {
    if (this.storage) {
      this.storage.delete(key);
    } else {
      this.memoryFallback.delete(key);
    }
  }

  // Domain specific sync timestamps
  getLastSyncTimestamp(): number | null {
    return this.getNumber('sync_last_timestamp');
  }

  setLastSyncTimestamp(timestamp: number): void {
    this.setNumber('sync_last_timestamp', timestamp);
  }

  getLastSyncStatus(): string {
    return this.getString('sync_last_status') || 'synced';
  }

  setLastSyncStatus(status: string): void {
    this.setString('sync_last_status', status);
  }
}

export const mmkvStorage = new MMKVStorageService();
