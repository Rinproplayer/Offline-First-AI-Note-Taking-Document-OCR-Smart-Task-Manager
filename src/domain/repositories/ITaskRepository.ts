import { Task, TaskPriority, TaskSource } from '../entities/Task';

export interface TaskFilterOptions {
  isCompleted?: boolean;
  priority?: TaskPriority;
  source?: TaskSource;
  dueDateCategory?: 'today' | 'upcoming' | 'overdue' | 'all';
}

export interface WeeklyTaskMetrics {
  completed: number;
  total: number;
  percentage: number;
  trendVsLastWeek: number;
  remainingCount: number;
}

export interface ITaskRepository {
  getTasks(filter?: TaskFilterOptions): Promise<Task[]>;
  getTaskById(id: string): Promise<Task | null>;
  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  getWeeklyMetrics(): Promise<WeeklyTaskMetrics>;
}
