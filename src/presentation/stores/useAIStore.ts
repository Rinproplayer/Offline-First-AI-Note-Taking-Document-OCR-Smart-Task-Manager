import { create } from 'zustand';
import { AIPromptType } from '../../domain/repositories/IAIService';

interface AIStoreState {
  isStreaming: boolean;
  activePrompt: AIPromptType;
  streamedContent: string;
  isBottomSheetOpen: boolean;
  selectedTextSnippet?: string;

  openBottomSheet: (prompt?: AIPromptType, snippet?: string) => void;
  closeBottomSheet: () => void;
  setActivePrompt: (prompt: AIPromptType) => void;
  appendToken: (token: string) => void;
  setStreamedContent: (content: string) => void;
  setStreaming: (isStreaming: boolean) => void;
  resetStream: () => void;
}

export const useAIStore = create<AIStoreState>((set) => ({
  isStreaming: false,
  activePrompt: 'summary',
  streamedContent: '',
  isBottomSheetOpen: false,
  selectedTextSnippet: undefined,

  openBottomSheet: (prompt = 'summary', snippet) =>
    set({
      isBottomSheetOpen: true,
      activePrompt: prompt,
      selectedTextSnippet: snippet,
      streamedContent: ''
    }),

  closeBottomSheet: () =>
    set({
      isBottomSheetOpen: false,
      isStreaming: false
    }),

  setActivePrompt: (prompt) => set({ activePrompt: prompt }),
  appendToken: (token) =>
    set((state) => ({ streamedContent: state.streamedContent + token })),
  setStreamedContent: (content) => set({ streamedContent: content }),
  setStreaming: (isStreaming) => set({ isStreaming }),
  resetStream: () => set({ streamedContent: '', isStreaming: false })
}));
