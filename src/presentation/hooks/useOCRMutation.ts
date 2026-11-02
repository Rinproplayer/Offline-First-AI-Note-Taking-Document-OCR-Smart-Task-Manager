import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ExtractTextOCRUseCase, ExtractOCROptions } from '../../domain/usecases/ExtractTextOCRUseCase';
import { aiServiceImpl } from '../../data/repositories/AIServiceImpl';
import { watermelonNoteRepository } from '../../data/repositories/WatermelonNoteRepository';

const extractOCRUseCase = new ExtractTextOCRUseCase(
  aiServiceImpl,
  watermelonNoteRepository
);

export function useOCRMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options: ExtractOCROptions) => {
      return extractOCRUseCase.execute(options);
    },
    onSuccess: (data) => {
      if (data.note) {
        queryClient.invalidateQueries({ queryKey: ['notes'] });
      }
    }
  });
}
