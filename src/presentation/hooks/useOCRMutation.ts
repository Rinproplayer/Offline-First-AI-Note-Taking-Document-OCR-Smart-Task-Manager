import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ExtractTextOCRUseCase, ExtractOCROptions } from '../../domain/usecases/ExtractTextOCRUseCase';
import { aiServiceImpl } from '../../data/repositories/AIServiceImpl';
import { watermelonNoteRepository } from '../../data/repositories/WatermelonNoteRepository';
import { OCRResult } from '../../domain/repositories/IAIService';

const extractOCRUseCase = new ExtractTextOCRUseCase(
  aiServiceImpl,
  watermelonNoteRepository
);

/**
 * Mutation thực hiện trích xuất OCR và tự động tạo ghi chú trong cơ sở dữ liệu
 */
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

/**
 * Mutation chỉ trích xuất văn bản từ ảnh (phục vụ hiển thị và chỉnh sửa trước khi lưu)
 */
export function useOCRExtractOnlyMutation() {
  return useMutation<OCRResult, Error, { imageUri: string; mode?: 'text' | 'receipt' | 'latex' | 'table'; base64?: string }>({
    mutationFn: async (options) => {
      return aiServiceImpl.extractTextFromImage(options.imageUri, options);
    }
  });
}
