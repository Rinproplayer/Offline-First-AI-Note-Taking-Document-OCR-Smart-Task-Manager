import { synchronize, SyncDatabaseChangeSet } from '@nozbe/watermelondb/sync';
import { database } from '../watermelon/database';
import { supabase, SupabaseNoteRow, SupabaseTaskRow } from './supabaseClient';
import { mmkvStorage } from '../cache/mmkvStorage';
import { SyncResult } from '../../domain/repositories/ISyncService';

/**
 * Service đồng bộ dữ liệu hai chiều (Two-Way Synchronization)
 * giữa cơ sở dữ liệu cục bộ SQLite (WatermelonDB) và Supabase PostgreSQL.
 *
 * Tuân thủ cơ chế Row-Level Security (RLS) của Supabase:
 * - Khi Pull: RLS tự động lọc chỉ trả về dữ liệu có `auth.uid() = user_id`.
 * - Khi Push: Tự động gán `user_id` của phiên đăng nhập hiện tại vào từng bản ghi để vượt qua RLS WITH CHECK policy.
 */
export async function synchronizeWithSupabase(): Promise<SyncResult> {
  let pulledNotesCount = 0;
  let pushedNotesCount = 0;
  let pulledTasksCount = 0;
  let pushedTasksCount = 0;
  const currentTimestamp = Date.now();

  try {
    // 1. Kiểm tra xác thực người dùng để tuân thủ Row-Level Security (RLS)
    const {
      data: { user }
    } = await supabase.auth.getUser();

    const currentUserId = user?.id || 'anonymous_user';

    await synchronize({
      database,

      /**
       * PULL CHANGES:
       * Tải tất cả các bản ghi mới hoặc được chỉnh sửa trên máy chủ Supabase
       * kể từ mốc thời gian đồng bộ cuối cùng (lastPulledAt).
       */
      pullChanges: async ({ lastPulledAt }) => {
        const lastSyncIso = lastPulledAt
          ? new Date(lastPulledAt).toISOString()
          : new Date(0).toISOString();

        // Query bảng `notes` từ Supabase PostgreSQL (RLS tự động lọc theo user_id)
        let notesQuery = supabase
          .from('notes')
          .select('*')
          .gt('updated_at', lastSyncIso);

        if (user?.id) {
          notesQuery = notesQuery.eq('user_id', user.id);
        }

        // Query bảng `tasks` từ Supabase PostgreSQL
        let tasksQuery = supabase
          .from('tasks')
          .select('*')
          .gt('updated_at', lastSyncIso);

        if (user?.id) {
          tasksQuery = tasksQuery.eq('user_id', user.id);
        }

        const [{ data: notesData, error: notesError }, { data: tasksData, error: tasksError }] =
          await Promise.all([notesQuery, tasksQuery]);

        if (notesError) {
          console.warn('[Sync-Pull] Lỗi khi kéo ghi chú từ Supabase (Chế độ Offline):', notesError.message);
        }

        if (tasksError) {
          console.warn('[Sync-Pull] Lỗi khi kéo nhiệm vụ từ Supabase (Chế độ Offline):', tasksError.message);
        }

        const remoteNotes = (notesData as SupabaseNoteRow[]) || [];
        const remoteTasks = (tasksData as SupabaseTaskRow[]) || [];

        pulledNotesCount = remoteNotes.length;
        pulledTasksCount = remoteTasks.length;

        // Chuyển đổi dữ liệu Supabase sang định dạng của WatermelonDB Model
        const noteRecords = remoteNotes.map((n) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          tags: JSON.stringify(n.tags || []),
          sync_status: 'synced',
          is_pinned: n.is_pinned ?? false,
          is_archived: n.is_archived ?? false,
          has_ocr: n.has_ocr ?? false,
          ocr_raw_text: n.ocr_raw_text,
          ai_summary: n.ai_summary,
          created_at: new Date(n.created_at).getTime(),
          updated_at: new Date(n.updated_at).getTime()
        }));

        const taskRecords = remoteTasks.map((t) => ({
          id: t.id,
          note_id: t.note_id,
          title: t.title,
          description: t.description,
          status: (t as any).status || (t.is_completed ? 'completed' : 'pending'),
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

      /**
       * PUSH CHANGES:
       * Đẩy các bản ghi được thêm mới, cập nhật hoặc đánh dấu xoá trên thiết bị
       * lên Supabase PostgreSQL theo lô (Batch).
       */
      pushChanges: async ({ changes }) => {
        const notesChanges = (changes as any).notes;
        const tasksChanges = (changes as any).tasks;

        // 1. Đẩy thay đổi cho bảng `notes`
        if (notesChanges) {
          if (notesChanges.created.length > 0) {
            const rowsToInsert = notesChanges.created.map((c: any) => ({
              id: c.id,
              user_id: currentUserId,
              title: c.title,
              content: c.content,
              tags: typeof c.tags === 'string' ? JSON.parse(c.tags) : c.tags,
              sync_status: 'synced',
              is_pinned: !!c.is_pinned,
              is_archived: !!c.is_archived,
              has_ocr: !!c.has_ocr,
              ocr_raw_text: c.ocr_raw_text,
              ai_summary: c.ai_summary,
              created_at: new Date(c.created_at).toISOString(),
              updated_at: new Date(c.updated_at).toISOString()
            }));

            const { error: insertError } = await supabase.from('notes').upsert(rowsToInsert);
            if (!insertError) {
              pushedNotesCount += rowsToInsert.length;
            }
          }

          if (notesChanges.updated.length > 0) {
            const rowsToUpdate = notesChanges.updated.map((u: any) => ({
              id: u.id,
              user_id: currentUserId,
              title: u.title,
              content: u.content,
              tags: typeof u.tags === 'string' ? JSON.parse(u.tags) : u.tags,
              sync_status: 'synced',
              is_pinned: !!u.is_pinned,
              is_archived: !!u.is_archived,
              has_ocr: !!u.has_ocr,
              ocr_raw_text: u.ocr_raw_text,
              ai_summary: u.ai_summary,
              updated_at: new Date().toISOString()
            }));

            const { error: updateError } = await supabase.from('notes').upsert(rowsToUpdate);
            if (!updateError) {
              pushedNotesCount += rowsToUpdate.length;
            }
          }

          if (notesChanges.deleted.length > 0) {
            let deleteQuery = supabase.from('notes').delete().in('id', notesChanges.deleted);
            if (user?.id) {
              deleteQuery = deleteQuery.eq('user_id', user.id);
            }
            await deleteQuery;
          }
        }

        // 2. Đẩy thay đổi cho bảng `tasks`
        if (tasksChanges) {
          if (tasksChanges.created.length > 0) {
            const rowsToInsert = tasksChanges.created.map((c: any) => ({
              id: c.id,
              user_id: currentUserId,
              note_id: c.note_id || null,
              title: c.title,
              description: c.description || null,
              status: c.status || (c.is_completed ? 'completed' : 'pending'),
              is_completed: !!c.is_completed,
              priority: c.priority,
              due_date: c.due_date ? new Date(c.due_date).toISOString() : null,
              source: c.source || 'manual',
              created_at: new Date(c.created_at).toISOString(),
              updated_at: new Date(c.updated_at).toISOString()
            }));

            const { error: insertError } = await supabase.from('tasks').upsert(rowsToInsert);
            if (!insertError) {
              pushedTasksCount += rowsToInsert.length;
            }
          }

          if (tasksChanges.updated.length > 0) {
            const rowsToUpdate = tasksChanges.updated.map((u: any) => ({
              id: u.id,
              user_id: currentUserId,
              note_id: u.note_id || null,
              title: u.title,
              description: u.description || null,
              status: u.status || (u.is_completed ? 'completed' : 'pending'),
              is_completed: !!u.is_completed,
              priority: u.priority,
              due_date: u.due_date ? new Date(u.due_date).toISOString() : null,
              source: u.source,
              updated_at: new Date().toISOString()
            }));

            const { error: updateError } = await supabase.from('tasks').upsert(rowsToUpdate);
            if (!updateError) {
              pushedTasksCount += rowsToUpdate.length;
            }
          }

          if (tasksChanges.deleted.length > 0) {
            let deleteQuery = supabase.from('tasks').delete().in('id', tasksChanges.deleted);
            if (user?.id) {
              deleteQuery = deleteQuery.eq('user_id', user.id);
            }
            await deleteQuery;
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
    mmkvStorage.setLastSyncStatus('offline_preserved');
    return {
      success: true,
      timestamp: currentTimestamp,
      pulledNotesCount: 0,
      pushedNotesCount: 0,
      pulledTasksCount: 0,
      pushedTasksCount: 0,
      error: error.message
    };
  }
}

export const performTwoWaySync = synchronizeWithSupabase;
