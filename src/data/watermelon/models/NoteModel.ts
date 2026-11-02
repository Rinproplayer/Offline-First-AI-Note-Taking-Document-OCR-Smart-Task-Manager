import { Model, Query } from '@nozbe/watermelondb';
import { field, text, json, date, children } from '@nozbe/watermelondb/decorators';
import { Note, SyncStatus } from '../../../domain/entities/Note';
import { TaskModel } from './TaskModel';

export class NoteModel extends Model {
  static table = 'notes';

  static associations = {
    tasks: { type: 'has_many' as const, foreignKey: 'note_id' }
  };

  @text('title') title!: string;
  @text('content') content!: string;
  @json('tags', (raw: unknown) => (Array.isArray(raw) ? (raw as string[]) : [])) tags!: string[];
  @text('sync_status') localSyncStatus?: string;
  @field('is_pinned') isPinned?: boolean;
  @field('is_archived') isArchived?: boolean;
  @field('has_ocr') hasOcr?: boolean;
  @text('ocr_raw_text') ocrRawText?: string;
  @text('ai_summary') aiSummary?: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @children('tasks') tasks!: Query<TaskModel>;

  toEntity(): Note {
    const status: SyncStatus =
      (this.localSyncStatus as SyncStatus) ||
      (this.syncStatus === 'synced' ? 'synced' : 'pending');

    return {
      id: this.id,
      title: this.title,
      content: this.content,
      tags: this.tags || [],
      isPinned: !!this.isPinned,
      isArchived: !!this.isArchived,
      hasOcr: !!this.hasOcr,
      ocrRawText: this.ocrRawText,
      aiSummary: this.aiSummary,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      syncStatus: status
    };
  }
}
