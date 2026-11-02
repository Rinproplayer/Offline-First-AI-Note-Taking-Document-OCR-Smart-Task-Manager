import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { Platform } from 'react-native';
import { schema } from './schema';
import { NoteModel } from './models/NoteModel';
import { TaskModel } from './models/TaskModel';

// Platform-aware adapter creation
function createAdapter() {
  try {
    return new SQLiteAdapter({
      schema,
      dbName: 'mindvault_offline',
      jsi: Platform.OS === 'ios',
      onSetUpError: (error) => {
        console.error('[WatermelonDB] Database setup error:', error);
      }
    });
  } catch (err) {
    console.warn('[WatermelonDB] Fallback SQLite Adapter warning:', err);
    return new SQLiteAdapter({
      schema,
      dbName: 'mindvault_offline',
      jsi: false
    });
  }
}

export const database = new Database({
  adapter: createAdapter(),
  modelClasses: [NoteModel, TaskModel]
});

export const notesCollection = database.get<NoteModel>('notes');
export const tasksCollection = database.get<TaskModel>('tasks');
