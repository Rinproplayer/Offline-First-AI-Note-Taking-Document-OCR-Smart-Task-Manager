import { Q } from '@nozbe/watermelondb';
import { INoteRepository } from '../../domain/repositories/INoteRepository';
import { Note, SyncStatus } from '../../domain/entities/Note';
import { database, notesCollection } from '../watermelon/database';
import { NoteModel } from '../watermelon/models/NoteModel';
import { synchronizeWithSupabase } from '../sync/supabaseSync';

/**
 * Repository Implementation quản lý toàn bộ vòng đời của thực thể Note.
 * Tuân thủ interface INoteRepository được định nghĩa tại tầng Domain.
 *
 * Cơ chế Offline-First:
 * 1. Mọi thao tác Create, Update, Delete đều thực thi trực tiếp trên WatermelonDB SQLite
 *    với độ trễ 0ms (zero network latency).
 * 2. Trạng thái bản ghi được gán nhãn `sync_status: 'pending'`.
 * 3. Khi có kết nối mạng, `synchronizeWithSupabase` được kích hoạt để đẩy các thay đổi lên Supabase
 *    và kéo các cập nhật mới về, cập nhật trạng thái thành `sync_status: 'synced'`.
 */
export class WatermelonNoteRepository implements INoteRepository {
  /**
   * Lấy toàn bộ danh sách ghi chú chưa bị xoá, sắp xếp theo thời gian cập nhật mới nhất.
   */
  async getNotes(): Promise<Note[]> {
    try {
      const records = await notesCollection
        .query(
          Q.where('_status', Q.notEq('deleted')),
          Q.sortBy('updated_at', Q.desc)
        )
        .fetch();

      return records.map((record) => record.toEntity());
    } catch (error) {
      console.warn('[WatermelonNoteRepository] Lỗi đọc WatermelonDB SQLite:', error);
      return [];
    }
  }

  /**
   * Tìm kiếm một ghi chú theo ID.
   */
  async getNoteById(id: string): Promise<Note | null> {
    try {
      const record = await notesCollection.find(id);
      if (!record || (record as any)._status === 'deleted') {
        return null;
      }
      return record.toEntity();
    } catch {
      return null;
    }
  }

  /**
   * Tạo mới một ghi chú trên thiết bị (Offline-First).
   * Bản ghi được tạo trong SQLite cục bộ với trạng thái `pending`.
   */
  async createNote(
    noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>
  ): Promise<Note> {
    try {
      let createdModel!: NoteModel;

      await database.write(async () => {
        createdModel = await notesCollection.create((model) => {
          model.title = noteData.title;
          model.content = noteData.content;
          model.tags = noteData.tags || [];
          model.localSyncStatus = 'pending';
          model.isPinned = !!noteData.isPinned;
          model.isArchived = !!noteData.isArchived;
          model.hasOcr = !!noteData.hasOcr;
          model.ocrRawText = noteData.ocrRawText;
          model.aiSummary = noteData.aiSummary;
        });
      });

      // Tự động kích hoạt đồng bộ nền nếu có mạng
      this.triggerBackgroundSync();

      return createdModel.toEntity();
    } catch (error) {
      console.error('[WatermelonNoteRepository] Lỗi tạo ghi chú:', error);
      return {
        id: `local_${Date.now()}`,
        ...noteData,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: 'pending'
      };
    }
  }

  /**
   * Cập nhật thông tin ghi chú cục bộ.
   * Cập nhật thời gian `updatedAt` và đánh dấu `sync_status = 'pending'`.
   */
  async updateNote(id: string, updates: Partial<Note>): Promise<Note> {
    try {
      const record = await notesCollection.find(id);

      await database.write(async () => {
        await record.update((model) => {
          if (updates.title !== undefined) model.title = updates.title;
          if (updates.content !== undefined) model.content = updates.content;
          if (updates.tags !== undefined) model.tags = updates.tags;
          if (updates.isPinned !== undefined) model.isPinned = updates.isPinned;
          if (updates.isArchived !== undefined) model.isArchived = updates.isArchived;
          if (updates.hasOcr !== undefined) model.hasOcr = updates.hasOcr;
          if (updates.ocrRawText !== undefined) model.ocrRawText = updates.ocrRawText;
          if (updates.aiSummary !== undefined) model.aiSummary = updates.aiSummary;
          model.localSyncStatus = 'pending';
        });
      });

      this.triggerBackgroundSync();

      return record.toEntity();
    } catch (error) {
      console.warn('[WatermelonNoteRepository] Lỗi cập nhật ghi chú:', error);
      const existing = await this.getNoteById(id);
      if (!existing) {
        throw new Error(`Không tìm thấy ghi chú với id: ${id}`);
      }
      return {
        ...existing,
        ...updates,
        updatedAt: new Date(),
        syncStatus: 'pending'
      };
    }
  }

  /**
   * Xoá ghi chú theo chuẩn WatermelonDB.
   */
  async deleteNote(id: string): Promise<void> {
    try {
      const record = await notesCollection.find(id);
      await database.write(async () => {
        await record.markAsDeleted();
        await record.destroyPermanently();
      });

      this.triggerBackgroundSync();
    } catch (error) {
      console.warn('[WatermelonNoteRepository] Lỗi xoá ghi chú:', error);
    }
  }

  /**
   * Tìm kiếm toàn văn (Full-text query) và lọc theo Thẻ (Tag).
   */
  async searchNotes(query: string, tag?: string): Promise<Note[]> {
    const allNotes = await this.getNotes();
    const cleanQuery = query.toLowerCase().trim();

    return allNotes.filter((note) => {
      const matchesText =
        !cleanQuery ||
        note.title.toLowerCase().includes(cleanQuery) ||
        note.content.toLowerCase().includes(cleanQuery) ||
        note.tags.some((t) => t.toLowerCase().includes(cleanQuery));

      const matchesTag =
        !tag || tag === 'Tất cả' || note.tags.some((t) => t.toLowerCase() === tag.toLowerCase());

      return matchesText && matchesTag;
    });
  }

  /**
   * Kích hoạt tiến trình đồng bộ nền không chặn (Non-blocking background sync)
   */
  private triggerBackgroundSync(): void {
    setTimeout(async () => {
      try {
        await synchronizeWithSupabase();
      } catch (err) {
        // Dữ liệu vẫn an toàn tại WatermelonDB khi không có mạng
      }
    }, 1500);
  }
}

export const watermelonNoteRepository = new WatermelonNoteRepository();
