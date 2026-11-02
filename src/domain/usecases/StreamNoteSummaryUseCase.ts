import { IAIService, AIPromptType } from '../repositories/IAIService';
import { INoteRepository } from '../repositories/INoteRepository';
import { ITaskRepository } from '../repositories/ITaskRepository';

export interface StreamSummaryOptions {
  noteId: string;
  noteContent: string;
  promptType: AIPromptType;
  onToken: (token: string) => void;
  autoSaveToNote?: boolean;
}

export class StreamNoteSummaryUseCase {
  constructor(
    private readonly aiService: IAIService,
    private readonly noteRepository: INoteRepository,
    private readonly taskRepository: ITaskRepository
  ) {}

  async execute(options: StreamSummaryOptions): Promise<string> {
    const fullSummary = await this.aiService.streamNoteSummary(
      options.noteContent,
      options.promptType,
      options.onToken
    );

    if (options.autoSaveToNote) {
      await this.noteRepository.updateNote(options.noteId, {
        aiSummary: fullSummary
      });
    }

    if (options.promptType === 'action_items') {
      const candidates = await this.aiService.extractTasksFromContent(fullSummary);
      for (const item of candidates) {
        await this.taskRepository.createTask({
          noteId: options.noteId,
          title: item.title,
          isCompleted: false,
          priority: item.priority,
          dueDate: item.suggestedDueDate,
          source: 'ai_extracted'
        });
      }
    }

    return fullSummary;
  }
}
