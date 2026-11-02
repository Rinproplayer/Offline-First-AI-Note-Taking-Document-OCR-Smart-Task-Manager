import { Model, Relation } from '@nozbe/watermelondb';
import { field, text, date, relation } from '@nozbe/watermelondb/decorators';
import { Task, TaskPriority, TaskSource, TaskStatus } from '../../domain/entities/Task';
import { SyncStatus } from '../../domain/entities/Note';
import { NoteModel } from './NoteModel';

export class TaskModel extends Model {
  static table = 'tasks';

  static associations = {
    notes: { type: 'belongs_to' as const, key: 'note_id' }
  };

  @text('title') title!: string;
  @text('priority') priority!: string;
  @date('due_date') dueDate?: Date;
  @text('status') status!: string;
  @text('note_id') noteId?: string;
  @text('description') description?: string;
  @field('is_completed') isCompleted!: boolean;
  @text('source') source!: string;
  @text('sync_status') syncStatus!: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  @relation('notes', 'note_id') note!: Relation<NoteModel>;

  /**
   * Converts the WatermelonDB model into a pure Domain Entity.
   */
  toEntity(): Task {
    const rawStatus = (this.status as TaskStatus) || (this.isCompleted ? 'completed' : 'pending');
    return {
      id: this.id,
      noteId: this.noteId,
      title: this.title,
      description: this.description,
      status: rawStatus,
      isCompleted: this.isCompleted || rawStatus === 'completed',
      priority: (this.priority as TaskPriority) || 'medium',
      dueDate: this.dueDate,
      source: (this.source as TaskSource) || 'manual',
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      syncStatus: (this.syncStatus as SyncStatus) || 'synced'
    };
  }
}
