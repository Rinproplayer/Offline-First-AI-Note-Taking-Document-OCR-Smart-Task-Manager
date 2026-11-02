import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { StreamNoteSummaryUseCase } from '../../domain/usecases/StreamNoteSummaryUseCase';
import { AIPromptType } from '../../domain/repositories/IAIService';
import { aiServiceImpl } from '../../data/repositories/AIServiceImpl';
import { watermelonNoteRepository } from '../../data/repositories/WatermelonNoteRepository';
import { watermelonTaskRepository } from '../../data/repositories/WatermelonTaskRepository';
import { useAIStore } from '../stores/useAIStore';

const streamUseCase = new StreamNoteSummaryUseCase(
  aiServiceImpl,
  watermelonNoteRepository,
  watermelonTaskRepository
);

export function useAISummaryStream() {
  const queryClient = useQueryClient();
  const { setStreaming, appendToken, setStreamedContent } = useAIStore();

  const startStream = useCallback(
    async (noteId: string, noteContent: string, promptType: AIPromptType) => {
      setStreaming(true);
      setStreamedContent('');

      try {
        const result = await streamUseCase.execute({
          noteId,
          noteContent,
          promptType,
          onToken: (token) => {
            appendToken(token);
          },
          autoSaveToNote: true
        });

        queryClient.invalidateQueries({ queryKey: ['note', noteId] });
        queryClient.invalidateQueries({ queryKey: ['notes'] });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        return result;
      } finally {
        setStreaming(false);
      }
    },
    [setStreaming, appendToken, setStreamedContent, queryClient]
  );

  return { startStream };
}
