import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ExtractTextOCRUseCase, ExtractOCROptions } from '../../domain/usecases/ExtractTextOCRUseCase';
import { aiServiceImpl } from '../../data/repositories/AIServiceImpl';
import { watermelonNoteRepository } from '../../data/repositories/WatermelonNoteRepository';
import { watermelonTaskRepository } from '../../data/repositories/WatermelonTaskRepository';

const extractOCRUseCase = new ExtractTextOCRUseCase(
  aiServiceImpl,
  watermelonNoteRepository,
  watermelonTaskRepository
);

export function useOCRMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options: ExtractOCROptions) => {
      return extractOCRUseCase.execute(options);
    },
    onSuccess: (data) => {
      if (data.createdNote) {
        queryClient.invalidateQueries({ queryKey: ['notes'] });
      }
      if (data.extractedTaskCount > 0) {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
      }
    }
  });
}
