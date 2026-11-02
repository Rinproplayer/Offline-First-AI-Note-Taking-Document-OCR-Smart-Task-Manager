import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { NativeModules, Platform } from 'react-native';
import { schema } from './schema';
import { NoteModel } from './models/NoteModel';
import { TaskModel } from './models/TaskModel';

// Platform-aware adapter creation
function createAdapter() {
  // Check if native SQLite bridge exists (available in custom dev client / production build)
  const hasNativeBridge = Boolean(
    NativeModules && (NativeModules.WMDatabaseBridge || NativeModules.WatermelonDB)
  );

  if (hasNativeBridge) {
    try {
      return new SQLiteAdapter({
        schema,
        dbName: 'mindvault_offline',
        jsi: Platform.OS === 'ios',
        onSetUpError: (error) => {
          console.error('[WatermelonDB] SQLite setup error:', error);
        }
      });
    } catch (err) {
      console.warn('[WatermelonDB] Native SQLite adapter failed, switching to LokiJS:', err);
    }
  }

  // Fallback for Expo Go, Web, and dev environments without native compilation
  console.info('[WatermelonDB] Running with LokiJSAdapter (Expo Go / JS runtime environment).');
  return new LokiJSAdapter({
    schema,
    useWebWorker: false,
    useIncrementalIndexedDB: false
  });
}

export const database = new Database({
  adapter: createAdapter(),
  modelClasses: [NoteModel, TaskModel]
});

export const notesCollection = database.get<NoteModel>('notes');
export const tasksCollection = database.get<TaskModel>('tasks');
