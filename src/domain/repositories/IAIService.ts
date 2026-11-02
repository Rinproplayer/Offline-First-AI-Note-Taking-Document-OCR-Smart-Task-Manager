import { TaskPriority } from '../entities/Task';

export interface OCRBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OCRBlock {
  text: string;
  confidence: number;
  boundingBox?: OCRBoundingBox;
}

export interface OCRResult {
  rawText: string;
  confidence: number;
  blocks: OCRBlock[];
  detectedLanguage?: string;
}

export type AIPromptType = 'summary' | 'action_items' | 'translate' | 'explain';

export interface ExtractedTaskCandidate {
  title: string;
  priority: TaskPriority;
  suggestedDueDate?: Date;
}

export interface IAIService {
  extractTextFromImage(
    imageUri: string,
    options?: { mode?: 'text' | 'receipt' | 'latex' | 'table' }
  ): Promise<OCRResult>;

  streamNoteSummary(
    noteContent: string,
    promptType: AIPromptType,
    onToken: (token: string) => void
  ): Promise<string>;

  extractTasksFromContent(content: string): Promise<ExtractedTaskCandidate[]>;
}
