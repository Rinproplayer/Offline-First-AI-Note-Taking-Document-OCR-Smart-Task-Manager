import { Model } from '@nozbe/watermelondb';
import { field, text, json, date } from '@nozbe/watermelondb/decorators';
import { Note, SyncStatus } from '../../domain/entities/Note';

export class NoteModel extends Model {
  static table = 'notes';

  @text('title') title!: string;
  @text('content') content!: string;
  @json('tags', (raw: unknown) => (Array.isArray(raw) ? (raw as string[]) : [])) tags!: string[];
  @field('is_pinned') isPinned!: boolean;
  @field('is_archived') isArchived!: boolean;
  @field('has_ocr') hasOcr!: boolean;
  @text('ocr_raw_text') ocrRawText?: string;
  @text('ai_summary') aiSummary?: string;
  @text('sync_status') syncStatus!: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  toEntity(): Note {
    return {
      id: this.id,
      title: this.title,
      content: this.content,
      tags: this.tags || [],
      isPinned: this.isPinned,
      isArchived: this.isArchived,
      hasOcr: this.hasOcr,
      ocrRawText: this.ocrRawText,
      aiSummary: this.aiSummary,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      syncStatus: (this.syncStatus as SyncStatus) || 'synced'
    };
  }
}
