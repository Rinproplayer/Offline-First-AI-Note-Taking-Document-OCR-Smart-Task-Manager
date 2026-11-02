import { create } from 'zustand';

export type TaskTab = 'today' | 'upcoming' | 'ai';
export type PriorityFilter = 'all' | 'high' | 'medium' | 'low';

interface FilterState {
  selectedTag: string;
  searchQuery: string;
  taskTab: TaskTab;
  priorityFilter: PriorityFilter;

  setSelectedTag: (tag: string) => void;
  setSearchQuery: (query: string) => void;
  setTaskTab: (tab: TaskTab) => void;
  setPriorityFilter: (priority: PriorityFilter) => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  selectedTag: 'Tất cả',
  searchQuery: '',
  taskTab: 'today',
  priorityFilter: 'all',

  setSelectedTag: (selectedTag) => set({ selectedTag }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setTaskTab: (taskTab) => set({ taskTab }),
  setPriorityFilter: (priorityFilter) => set({ priorityFilter })
}));
