import { IAIService, OCRResult } from '../repositories/IAIService';
import { INoteRepository } from '../repositories/INoteRepository';
import { ITaskRepository } from '../repositories/ITaskRepository';
import { Note } from '../entities/Note';

export interface ExtractOCROptions {
  imageUri: string;
  mode?: 'text' | 'receipt' | 'latex' | 'table';
  autoCreateNote?: boolean;
  autoExtractTasks?: boolean;
  noteTitle?: string;
}

export interface ExtractOCRResponse {
  ocrResult: OCRResult;
  createdNote?: Note;
  extractedTaskCount: number;
}

export class ExtractTextOCRUseCase {
  constructor(
    private readonly aiService: IAIService,
    private readonly noteRepository: INoteRepository,
    private readonly taskRepository: ITaskRepository
  ) {}

  async execute(options: ExtractOCROptions): Promise<ExtractOCRResponse> {
    const ocrResult = await this.aiService.extractTextFromImage(options.imageUri, {
      mode: options.mode || 'text'
    });

    let createdNote: Note | undefined;
    let extractedTaskCount = 0;

    if (options.autoCreateNote && ocrResult.rawText.trim().length > 0) {
      createdNote = await this.noteRepository.createNote({
        title: options.noteTitle || `OCR - ${new Date().toLocaleDateString('vi-VN')}`,
        content: ocrResult.rawText,
        tags: ['OCR', options.mode || 'Text'],
        isPinned: false,
        isArchived: false,
        hasOcr: true,
        ocrRawText: ocrResult.rawText
      });

      if (options.autoExtractTasks) {
        const candidateTasks = await this.aiService.extractTasksFromContent(ocrResult.rawText);
        for (const candidate of candidateTasks) {
          await this.taskRepository.createTask({
            noteId: createdNote.id,
            title: candidate.title,
            isCompleted: false,
            priority: candidate.priority,
            dueDate: candidate.suggestedDueDate,
            source: 'ocr'
          });
          extractedTaskCount++;
        }
      }
    }

    return {
      ocrResult,
      createdNote,
      extractedTaskCount
    };
  }
}
