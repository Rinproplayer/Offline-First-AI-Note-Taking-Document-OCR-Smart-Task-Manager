import { useCallback, useRef } from 'react';
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

/**
 * Custom Hook kết nối Use Case tóm tắt và trích xuất nhiệm vụ AI vào giao diện người dùng.
 * Sử dụng Zustand Store để hiển thị token theo thời gian thực (60fps) và TanStack Query để làm mới cache.
 */
export function useAISummaryStream() {
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    setStreaming,
    appendToken,
    setStreamedContent,
    isStreaming,
    streamedContent,
    activePrompt
  } = useAIStore();

  /**
   * Phát luồng tóm tắt ghi chú thành các gạch đầu dòng ngắn gọn
   */
  const streamSummary = useCallback(
    async (noteId: string, noteContent: string) => {
      abortControllerRef.current = new AbortController();
      setStreaming(true);
      setStreamedContent('');

      try {
        const result = await streamUseCase.summarizeNote({
          noteId,
          noteContent,
          onToken: (token) => {
            appendToken(token);
          },
          autoSaveToNote: true
        });

        // Làm mới cache TanStack Query để cập nhật ngay trên giao diện
        queryClient.invalidateQueries({ queryKey: ['note', noteId] });
        queryClient.invalidateQueries({ queryKey: ['notes'] });
        return result;
      } finally {
        setStreaming(false);
      }
    },
    [setStreaming, appendToken, setStreamedContent, queryClient]
  );

  /**
   * Phát luồng và tự động trích xuất Action Items thành các Task có deadline
   */
  const streamActionItems = useCallback(
    async (noteId: string, noteContent: string) => {
      abortControllerRef.current = new AbortController();
      setStreaming(true);
      setStreamedContent('');

      try {
        const result = await streamUseCase.extractActionItems({
          noteId,
          noteContent,
          onToken: (token) => {
            appendToken(token);
          },
          autoSaveToNote: true
        });

        // Tự động làm mới cache của cả Notes và Tasks
        queryClient.invalidateQueries({ queryKey: ['note', noteId] });
        queryClient.invalidateQueries({ queryKey: ['notes'] });
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        queryClient.invalidateQueries({ queryKey: ['tasks', 'weekly-metrics'] });
        return result;
      } finally {
        setStreaming(false);
      }
    },
    [setStreaming, appendToken, setStreamedContent, queryClient]
  );

  /**
   * Điều phối streaming dựa trên promptType được chọn
   */
  const startStream = useCallback(
    async (noteId: string, noteContent: string, promptType: AIPromptType) => {
      if (promptType === 'action_items') {
        const res = await streamActionItems(noteId, noteContent);
        return res.summaryText;
      }
      return streamSummary(noteId, noteContent);
    },
    [streamSummary, streamActionItems]
  );

  /**
   * Hủy luồng phát nếu người dùng đóng cửa sổ trước khi hoàn tất
   */
  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setStreaming(false);
    }
  }, [setStreaming]);

  return {
    startStream,
    streamSummary,
    streamActionItems,
    cancelStream,
    isStreaming,
    streamedContent,
    activePrompt
  };
}
