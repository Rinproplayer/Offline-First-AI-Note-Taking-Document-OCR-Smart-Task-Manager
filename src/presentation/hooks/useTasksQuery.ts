import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { watermelonTaskRepository } from '../../data/repositories/WatermelonTaskRepository';
import { Task } from '../../domain/entities/Task';
import { TaskFilterOptions } from '../../domain/repositories/ITaskRepository';

export function useTasks(filter?: TaskFilterOptions) {
  return useQuery({
    queryKey: ['tasks', filter],
    queryFn: async () => {
      return watermelonTaskRepository.getTasks(filter);
    }
  });
}

export function useWeeklyMetrics() {
  return useQuery({
    queryKey: ['tasks', 'weekly-metrics'],
    queryFn: async () => {
      return watermelonTaskRepository.getWeeklyMetrics();
    }
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'syncStatus'>) => {
      return watermelonTaskRepository.createTask(newTask);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });
}

export function useToggleTaskComplete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      return watermelonTaskRepository.updateTask(id, { isCompleted });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return watermelonTaskRepository.deleteTask(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });
}
