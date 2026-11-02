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

export type AIPromptType =
  | 'summary'
  | 'detailed_summary'
  | 'action_items'
  | 'critique'
  | 'translate'
  | 'explain'
  | 'custom';

export interface ExtractedTaskCandidate {
  title: string;
  priority: TaskPriority;
  suggestedDueDate?: Date;
}

export interface IAIService {
  extractTextFromImage(
    imageUri: string,
    options?: { mode?: 'text' | 'receipt' | 'latex' | 'table'; base64?: string }
  ): Promise<OCRResult>;

  streamNoteSummary(
    noteContent: string,
    promptType: AIPromptType,
    onToken: (token: string) => void,
    customPrompt?: string
  ): Promise<string>;

  extractTasksFromContent(content: string): Promise<ExtractedTaskCandidate[]>;
}
