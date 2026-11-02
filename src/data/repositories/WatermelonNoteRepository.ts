import { Q } from '@nozbe/watermelondb';
import { INoteRepository } from '../../domain/repositories/INoteRepository';
import { Note } from '../../domain/entities/Note';
import { database, notesCollection } from '../watermelon/database';
import { NoteModel } from '../watermelon/models/NoteModel';

export class WatermelonNoteRepository implements INoteRepository {
  async getNotes(): Promise<Note[]> {
    try {
      const records = await notesCollection.query(Q.sortBy('created_at', Q.desc)).fetch();
      if (records.length === 0) {
        return this.getSeedNotes();
      }
      return records.map((r) => r.toEntity());
    } catch {
      return this.getSeedNotes();
    }
  }

  async getNoteById(id: string): Promise<Note | null> {
    try {
      const record = await notesCollection.find(id);
      return record ? record.toEntity() : null;
    } catch {
      const seed = this.getSeedNotes().find((n) => n.id === id);
      return seed || null;
    }
  }

  async createNote(noteData: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<Note> {
    try {
      let createdModel!: NoteModel;
      await database.write(async () => {
        createdModel = await notesCollection.create((model) => {
          model.title = noteData.title;
          model.content = noteData.content;
          model.tags = noteData.tags || [];
          model.isPinned = !!noteData.isPinned;
          model.isArchived = !!noteData.isArchived;
          model.hasOcr = !!noteData.hasOcr;
          model.ocrRawText = noteData.ocrRawText;
          model.aiSummary = noteData.aiSummary;
          model.syncStatus = 'pending';
        });
      });
      return createdModel.toEntity();
    } catch {
      return {
        id: `local_${Date.now()}`,
        ...noteData,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: 'pending'
      };
    }
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note> {
    try {
      const model = await notesCollection.find(id);
      await database.write(async () => {
        await model.update((m) => {
          if (updates.title !== undefined) m.title = updates.title;
          if (updates.content !== undefined) m.content = updates.content;
          if (updates.tags !== undefined) m.tags = updates.tags;
          if (updates.isPinned !== undefined) m.isPinned = updates.isPinned;
          if (updates.isArchived !== undefined) m.isArchived = updates.isArchived;
          if (updates.hasOcr !== undefined) m.hasOcr = updates.hasOcr;
          if (updates.ocrRawText !== undefined) m.ocrRawText = updates.ocrRawText;
          if (updates.aiSummary !== undefined) m.aiSummary = updates.aiSummary;
          m.syncStatus = 'pending';
        });
      });
      return model.toEntity();
    } catch {
      const existing = await this.getNoteById(id);
      return {
        ...(existing || this.getSeedNotes()[0]),
        ...updates,
        updatedAt: new Date()
      };
    }
  }

  async deleteNote(id: string): Promise<void> {
    try {
      const model = await notesCollection.find(id);
      await database.write(async () => {
        await model.markAsDeleted();
      });
    } catch {
      // Ignored for in-memory
    }
  }

  async searchNotes(query: string, tag?: string): Promise<Note[]> {
    const notes = await this.getNotes();
    const q = query.toLowerCase().trim();
    return notes.filter((n) => {
      const matchesQuery =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q));
      const matchesTag = !tag || tag === 'Tất cả' || n.tags.includes(tag);
      return matchesQuery && matchesTag;
    });
  }

  private getSeedNotes(): Note[] {
    return [
      {
        id: 'note_1',
        title: 'Kiến trúc Clean Architecture & WatermelonDB',
        content:
          'Triển khai mô hình 3 lớp nghiêm ngặt (Domain, Data, Presentation) cho dự án Capstone MindVault. Sử dụng WatermelonDB đảm bảo đọc ghi cực nhanh với SQLite cục bộ, sau đó đồng bộ hoá lên Supabase.',
        tags: ['CleanArchitecture', 'OfflineFirst', 'Capstone'],
        isPinned: true,
        isArchived: false,
        hasOcr: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 15),
        updatedAt: new Date(Date.now() - 1000 * 60 * 10),
        syncStatus: 'synced'
      },
      {
        id: 'note_2',
        title: 'Bài giảng Xử lý Ngôn ngữ Tự nhiên & LLMs',
        content:
          'Nghiên cứu cơ chế Attention trong Transformer, các kỹ thuật tối ưu hóa độ trễ phản hồi SSE khi truyền luồng dữ liệu (streaming). Kết hợp bộ nhận diện OCR tiếng Việt trên thiết bị bằng Google ML Kit.',
        tags: ['AI', 'NLP', 'Research'],
        isPinned: false,
        isArchived: false,
        hasOcr: true,
        ocrRawText: 'Mô hình Transformer và ứng dụng trong trích xuất văn bản tài liệu học thuật.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 20),
        syncStatus: 'synced'
      },
      {
        id: 'note_3',
        title: 'Kế hoạch Capstone Project - MindVault',
        content:
          'Các mốc quan trọng: 1. Hoàn thành thiết kế Mobile UI trên Stitch. 2. Triển khai kiến trúc 3 lớp không dính UI trong Domain. 3. Thử nghiệm tốc độ đạt 60fps với FlashList trên Android.',
        tags: ['Capstone', 'Task', 'Đại học'],
        isPinned: false,
        isArchived: false,
        hasOcr: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 40),
        syncStatus: 'synced'
      }
    ];
  }
}

export const watermelonNoteRepository = new WatermelonNoteRepository();
