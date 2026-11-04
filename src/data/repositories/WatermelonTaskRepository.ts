import { Q } from '@nozbe/watermelondb';
import { ITaskRepository, TaskFilterOptions, WeeklyTaskMetrics } from '../../domain/repositories/ITaskRepository';
import { Task } from '../../domain/entities/Task';
import { database, tasksCollection } from '../watermelon/database';
import { TaskModel } from '../watermelon/models/TaskModel';

export class WatermelonTaskRepository implements ITaskRepository {
  async getTasks(filter?: TaskFilterOptions): Promise<Task[]> {
    try {
      const records = await tasksCollection
        .query(
          Q.where('_status', Q.notEq('deleted')),
          Q.sortBy('created_at', Q.desc)
        )
        .fetch();

      let tasks = records.map((r) => r.toEntity());

      if (filter) {
        if (filter.isCompleted !== undefined) {
          tasks = tasks.filter((t) => t.isCompleted === filter.isCompleted);
        }
        if (filter.priority) {
          tasks = tasks.filter((t) => t.priority === filter.priority);
        }
        if (filter.source) {
          tasks = tasks.filter((t) => t.source === filter.source);
        }
        if (filter.dueDateCategory === 'today') {
          const now = new Date();
          tasks = tasks.filter((t) => {
            if (!t.dueDate) return true;
            const d = new Date(t.dueDate);
            return d.toDateString() === now.toDateString() || d.getTime() <= now.getTime();
          });
        } else if (filter.dueDateCategory === 'upcoming') {
          const now = new Date();
          tasks = tasks.filter((t) => t.dueDate && new Date(t.dueDate).getTime() > now.getTime());
        }
      }

      return tasks;
    } catch {
      return [];
    }
  }

  async getTaskById(id: string): Promise<Task | null> {
    try {
      const record = await tasksCollection.find(id);
      if (!record || (record as any)._status === 'deleted') {
        return null;
      }
      return record.toEntity();
    } catch {
      return null;
    }
  }

  async createTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<Task> {
    let createdModel!: TaskModel;
    await database.write(async () => {
      createdModel = await tasksCollection.create((model) => {
        model.noteId = taskData.noteId;
        model.title = taskData.title;
        model.description = taskData.description;
        model.status = taskData.status || (taskData.isCompleted ? 'completed' : 'pending');
        model.isCompleted = !!taskData.isCompleted;
        model.priority = taskData.priority || 'medium';
        model.dueDate = taskData.dueDate;
        model.source = taskData.source || 'manual';
        model.localSyncStatus = 'pending';
      });
    });
    return createdModel.toEntity();
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const model = await tasksCollection.find(id);
    await database.write(async () => {
      await model.update((m) => {
        if (updates.title !== undefined) m.title = updates.title;
        if (updates.description !== undefined) m.description = updates.description;
        if (updates.isCompleted !== undefined) {
          m.isCompleted = updates.isCompleted;
          m.status = updates.isCompleted ? 'completed' : 'pending';
        }
        if (updates.priority !== undefined) m.priority = updates.priority;
        if (updates.dueDate !== undefined) m.dueDate = updates.dueDate;
        if (updates.status !== undefined) m.status = updates.status;
        m.localSyncStatus = 'pending';
      });
    });
    return model.toEntity();
  }

  async deleteTask(id: string): Promise<void> {
    try {
      const model = await tasksCollection.find(id);
      await database.write(async () => {
        await model.markAsDeleted();
        await model.destroyPermanently();
      });
    } catch (err) {
      console.warn('[WatermelonTaskRepository] Delete task error:', err);
    }
  }

  async getWeeklyMetrics(): Promise<WeeklyTaskMetrics> {
    const tasks = await this.getTasks();
    const completed = tasks.filter((t) => t.isCompleted).length;
    const total = tasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      completed,
      total,
      percentage,
      trendVsLastWeek: 0,
      remainingCount: total - completed
    };
  }
}

export const watermelonTaskRepository = new WatermelonTaskRepository();
