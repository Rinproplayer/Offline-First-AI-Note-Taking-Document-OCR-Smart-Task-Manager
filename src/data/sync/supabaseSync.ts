import { synchronize, SyncDatabaseChangeSet } from '@nozbe/watermelondb/sync';
import { database } from '../watermelon/database';
import { supabase, SupabaseNoteRow, SupabaseTaskRow } from './supabaseClient';
import { mmkvStorage } from '../cache/mmkvStorage';
import { SyncResult } from '../../domain/repositories/ISyncService';

export async function performTwoWaySync(): Promise<SyncResult> {
  let pulledNotesCount = 0;
  let pushedNotesCount = 0;
  let pulledTasksCount = 0;
  let pushedTasksCount = 0;
  const currentTimestamp = Date.now();

  try {
    await synchronize({
      database,
      pullChanges: async ({ lastPulledAt, schemaVersion, migration }) => {
        const lastSyncIso = lastPulledAt ? new Date(lastPulledAt).toISOString() : new Date(0).toISOString();

        // 1. Fetch updated notes from Supabase
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .gt('updated_at', lastSyncIso);

        if (notesError) {
          console.warn('[Sync] Supabase notes fetch warning (offline or demo mode):', notesError.message);
        }

        // 2. Fetch updated tasks from Supabase
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('*')
          .gt('updated_at', lastSyncIso);

        if (tasksError) {
          console.warn('[Sync] Supabase tasks fetch warning (offline or demo mode):', tasksError.message);
        }

        const remoteNotes = (notesData as SupabaseNoteRow[]) || [];
        const remoteTasks = (tasksData as SupabaseTaskRow[]) || [];

        pulledNotesCount = remoteNotes.length;
        pulledTasksCount = remoteTasks.length;

        // Transform remote rows to WatermelonDB format
        const noteRecords = remoteNotes.map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          tags: JSON.stringify(n.tags || []),
          is_pinned: n.is_pinned,
          is_archived: n.is_archived,
          has_ocr: n.has_ocr,
          ocr_raw_text: n.ocr_raw_text,
          ai_summary: n.ai_summary,
          sync_status: 'synced',
          created_at: new Date(n.created_at).getTime(),
          updated_at: new Date(n.updated_at).getTime()
        }));

        const taskRecords = remoteTasks.map((t) => ({
          id: t.id,
          note_id: t.note_id,
          title: t.title,
          description: t.description,
          is_completed: t.is_completed,
          priority: t.priority,
          due_date: t.due_date ? new Date(t.due_date).getTime() : undefined,
          source: t.source,
          sync_status: 'synced',
          created_at: new Date(t.created_at).getTime(),
          updated_at: new Date(t.updated_at).getTime()
        }));

        return {
          changes: {
            notes: {
              created: noteRecords,
              updated: [],
              deleted: []
            },
            tasks: {
              created: taskRecords,
              updated: [],
              deleted: []
            }
          },
          timestamp: currentTimestamp
        };
      },
      pushChanges: async ({ changes, lastPulledAt }) => {
        // Push local changes up to Supabase PostgreSQL (RLS enabled)
        const notesChanges = changes.notes;
        const tasksChanges = changes.tasks;

        // Push Notes
        if (notesChanges) {
          if (notesChanges.created.length > 0) {
            const rows = notesChanges.created.map((c: any) => ({
              id: c.id,
              title: c.title,
              content: c.content,
              tags: typeof c.tags === 'string' ? JSON.parse(c.tags) : c.tags,
              is_pinned: c.is_pinned,
              is_archived: c.is_archived,
              has_ocr: c.has_ocr,
              ocr_raw_text: c.ocr_raw_text,
              ai_summary: c.ai_summary,
              created_at: new Date(c.created_at).toISOString(),
              updated_at: new Date(c.updated_at).toISOString()
            }));
            await supabase.from('notes').upsert(rows);
            pushedNotesCount += rows.length;
          }

          if (notesChanges.updated.length > 0) {
            const rows = notesChanges.updated.map((u: any) => ({
              id: u.id,
              title: u.title,
              content: u.content,
              tags: typeof u.tags === 'string' ? JSON.parse(u.tags) : u.tags,
              is_pinned: u.is_pinned,
              is_archived: u.is_archived,
              has_ocr: u.has_ocr,
              ocr_raw_text: u.ocr_raw_text,
              ai_summary: u.ai_summary,
              updated_at: new Date().toISOString()
            }));
            await supabase.from('notes').upsert(rows);
            pushedNotesCount += rows.length;
          }

          if (notesChanges.deleted.length > 0) {
            await supabase.from('notes').delete().in('id', notesChanges.deleted);
          }
        }

        // Push Tasks
        if (tasksChanges) {
          if (tasksChanges.created.length > 0) {
            const rows = tasksChanges.created.map((c: any) => ({
              id: c.id,
              note_id: c.note_id,
              title: c.title,
              description: c.description,
              is_completed: c.is_completed,
              priority: c.priority,
              due_date: c.due_date ? new Date(c.due_date).toISOString() : null,
              source: c.source,
              created_at: new Date(c.created_at).toISOString(),
              updated_at: new Date(c.updated_at).toISOString()
            }));
            await supabase.from('tasks').upsert(rows);
            pushedTasksCount += rows.length;
          }

          if (tasksChanges.updated.length > 0) {
            const rows = tasksChanges.updated.map((u: any) => ({
              id: u.id,
              note_id: u.note_id,
              title: u.title,
              description: u.description,
              is_completed: u.is_completed,
              priority: u.priority,
              due_date: u.due_date ? new Date(u.due_date).toISOString() : null,
              source: u.source,
              updated_at: new Date().toISOString()
            }));
            await supabase.from('tasks').upsert(rows);
            pushedTasksCount += rows.length;
          }

          if (tasksChanges.deleted.length > 0) {
            await supabase.from('tasks').delete().in('id', tasksChanges.deleted);
          }
        }
      }
    });

    mmkvStorage.setLastSyncTimestamp(currentTimestamp);
    mmkvStorage.setLastSyncStatus('synced');

    return {
      success: true,
      timestamp: currentTimestamp,
      pulledNotesCount,
      pushedNotesCount,
      pulledTasksCount,
      pushedTasksCount
    };
  } catch (error: any) {
    console.warn('[Sync] Offline synchronization notice:', error.message || error);
    // Offline-first graceful fallback: we mark local state as preserved
    mmkvStorage.setLastSyncStatus('offline_preserved');
    return {
      success: true, // local changes safe in WatermelonDB
      timestamp: currentTimestamp,
      pulledNotesCount: 0,
      pushedNotesCount: 0,
      pulledTasksCount: 0,
      pushedTasksCount: 0,
      error: error.message
    };
  }
}
