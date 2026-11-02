import { Model } from '@nozbe/watermelondb';
import { field, text, date } from '@nozbe/watermelondb/decorators';
import { Task, TaskPriority, TaskSource } from '../../domain/entities/Task';
import { SyncStatus } from '../../domain/entities/Note';

export class TaskModel extends Model {
  static table = 'tasks';

  @text('note_id') noteId?: string;
  @text('title') title!: string;
  @text('description') description?: string;
  @field('is_completed') isCompleted!: boolean;
  @text('priority') priority!: string;
  @date('due_date') dueDate?: Date;
  @text('source') source!: string;
  @text('sync_status') syncStatus!: string;
  @date('created_at') createdAt!: Date;
  @date('updated_at') updatedAt!: Date;

  toEntity(): Task {
    return {
      id: this.id,
      noteId: this.noteId,
      title: this.title,
      description: this.description,
      isCompleted: this.isCompleted,
      priority: (this.priority as TaskPriority) || 'medium',
      dueDate: this.dueDate,
      source: (this.source as TaskSource) || 'manual',
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      syncStatus: (this.syncStatus as SyncStatus) || 'synced'
    };
  }
}
