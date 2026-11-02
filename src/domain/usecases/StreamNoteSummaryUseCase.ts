import { IAIService, AIPromptType } from '../repositories/IAIService';
import { INoteRepository } from '../repositories/INoteRepository';
import { ITaskRepository } from '../repositories/ITaskRepository';
import { Task } from '../entities/Task';

/**
 * Cấu hình cho thao tác phát luồng AI tóm tắt hoặc trích xuất nhiệm vụ
 */
export interface StreamNoteSummaryOptions {
  noteId: string;
  noteContent: string;
  onToken: (token: string) => void;
  promptType?: AIPromptType;
  autoSaveToNote?: boolean;
}

/**
 * Kết quả trả về từ Use Case trích xuất Action Items
 */
export interface ExtractActionItemsResult {
  summaryText: string;
  createdTasks: Task[];
}

/**
 * Use Case: Phát luồng tóm tắt ghi chú và tự động trích xuất việc cần làm (Action Items).
 *
 * ĐẶC TẢ KIẾN TRÚC:
 * - Thuần túy TypeScript (Pure TypeScript), độc lập với React/React Native.
 * - ZERO UI IMPORTS: Tuyệt đối không import component UI hay framework.
 */
export class StreamNoteSummaryUseCase {
  constructor(
    private readonly aiService: IAIService,
    private readonly noteRepository: INoteRepository,
    private readonly taskRepository: ITaskRepository
  ) {}

  /**
   * Tóm tắt nội dung ghi chú thành các gạch đầu dòng ngắn gọn và lưu kết quả vào Note.
   */
  async summarizeNote(options: StreamNoteSummaryOptions): Promise<string> {
    const fullSummary = await this.aiService.streamNoteSummary(
      options.noteContent,
      'summary',
      options.onToken
    );

    if (options.autoSaveToNote !== false && options.noteId) {
      await this.noteRepository.updateNote(options.noteId, {
        aiSummary: fullSummary
      });
    }

    return fullSummary;
  }

  /**
   * Tự động trích xuất các đầu việc (Action Items) từ biên bản họp thành danh sách Task có thời hạn (deadline).
   */
  async extractActionItems(options: StreamNoteSummaryOptions): Promise<ExtractActionItemsResult> {
    // 1. Phát luồng phân tích Action Items qua LLM SSE
    const fullAnalysis = await this.aiService.streamNoteSummary(
      options.noteContent,
      'action_items',
      options.onToken
    );

    // 2. Bóc tách các đầu việc thành danh sách có thời hạn và mức độ ưu tiên
    const candidateTasks = await this.aiService.extractTasksFromContent(fullAnalysis);
    const createdTasks: Task[] = [];

    // 3. Tự động lưu từng Task vào cơ sở dữ liệu cục bộ thông qua ITaskRepository
    for (const candidate of candidateTasks) {
      const task = await this.taskRepository.createTask({
        noteId: options.noteId,
        title: candidate.title,
        priority: candidate.priority,
        dueDate: candidate.suggestedDueDate || new Date(Date.now() + 86400000 * 2),
        status: 'pending',
        isCompleted: false,
        source: 'ai_extracted'
      });
      createdTasks.push(task);
    }

    // 4. Cập nhật bản tóm tắt vào ghi chú cha
    if (options.autoSaveToNote !== false && options.noteId) {
      await this.noteRepository.updateNote(options.noteId, {
        aiSummary: fullAnalysis
      });
    }

    return {
      summaryText: fullAnalysis,
      createdTasks
    };
  }

  /**
   * Phương thức điều phối chung hỗ trợ đa dạng promptType
   */
  async execute(options: StreamNoteSummaryOptions): Promise<string> {
    const type = options.promptType || 'summary';

    if (type === 'action_items') {
      const result = await this.extractActionItems(options);
      return result.summaryText;
    }

    return this.summarizeNote({
      ...options,
      promptType: type
    });
  }
}
