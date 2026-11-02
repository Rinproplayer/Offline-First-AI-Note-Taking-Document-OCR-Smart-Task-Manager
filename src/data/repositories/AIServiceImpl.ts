import { IAIService, OCRResult, AIPromptType, ExtractedTaskCandidate } from '../../domain/repositories/IAIService';
import { mlKitOCRService } from '../ocr/mlKitOCRService';
import { streamingLLMClient } from '../ai/streamingLLMClient';

export class AIServiceImpl implements IAIService {
  async extractTextFromImage(
    imageUri: string,
    options?: { mode?: 'text' | 'receipt' | 'latex' | 'table' }
  ): Promise<OCRResult> {
    return mlKitOCRService.processImage(imageUri, options?.mode || 'text');
  }

  async streamNoteSummary(
    noteContent: string,
    promptType: AIPromptType,
    onToken: (token: string) => void
  ): Promise<string> {
    return streamingLLMClient.streamResponse({
      content: noteContent,
      promptType,
      onToken
    });
  }

  async extractTasksFromContent(content: string): Promise<ExtractedTaskCandidate[]> {
    return streamingLLMClient.extractTasks(content);
  }
}

export const aiServiceImpl = new AIServiceImpl();
