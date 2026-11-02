import { IAIService, OCRResult } from '../repositories/IAIService';
import { INoteRepository } from '../repositories/INoteRepository';
import { Note } from '../entities/Note';

/**
 * Tham số đầu vào cho Use Case trích xuất văn bản từ hình ảnh.
 */
export interface ExtractOCROptions {
  /**
   * Đường dẫn URI của hình ảnh trên thiết bị (file://... hoặc content://...)
   */
  imageUri: string;

  /**
   * Tiêu đề tùy chỉnh cho ghi chú mới (nếu bỏ trống, tiêu đề sẽ tự động được tạo từ nội dung hoặc mốc thời gian)
   */
  noteTitle?: string;

  /**
   * Chế độ quét chuyên biệt: 'text' (mặc định), 'receipt', 'latex', 'table'
   */
  mode?: 'text' | 'receipt' | 'latex' | 'table';

  /**
   * Danh sách nhãn (tags) bổ sung cho ghi chú
   */
  tags?: string[];
}

/**
 * Kết quả trả về sau khi hoàn tất Use Case
 */
export interface ExtractOCRResponse {
  /**
   * Ghi chú mới đã được tự động tạo và lưu trữ cục bộ
   */
  note: Note;

  /**
   * Kết quả OCR chi tiết từ Google ML Kit (văn bản thô, độ tin cậy, danh sách blocks, bounding boxes)
   */
  ocrResult: OCRResult;
}

/**
 * Use Case: Nhận diện văn bản từ ảnh và tự động tạo ghi chú mới.
 *
 * ĐẶC TẢ KIẾN TRÚC:
 * - Nằm trong tầng Domain (src/domain/usecases).
 * - Thuần túy TypeScript (Pure TypeScript), độc lập hoàn toàn với framework và thiết bị.
 * - KHÔNG IMPORT bất kỳ thư viện UI, React, React Native hay SDK bên ngoài nào.
 */
export class ExtractTextOCRUseCase {
  constructor(
    private readonly aiService: IAIService,
    private readonly noteRepository: INoteRepository
  ) {}

  /**
   * Thực thi Use Case nhận diện ảnh và tự động tạo Ghi chú mới.
   *
   * @param input Đường dẫn URI ảnh (string) hoặc đối tượng cấu hình ExtractOCROptions
   * @returns ExtractOCRResponse chứa ghi chú vừa tạo và chi tiết kết quả OCR
   */
  async execute(input: string | ExtractOCROptions): Promise<ExtractOCRResponse> {
    const options: ExtractOCROptions =
      typeof input === 'string' ? { imageUri: input } : input;

    if (!options.imageUri || options.imageUri.trim() === '') {
      throw new Error('Đường dẫn ảnh (imageUri) không hợp lệ hoặc bị trống.');
    }

    // 1. Gọi service nhận diện văn bản trên thiết bị (Google ML Kit OCR)
    const ocrResult = await this.aiService.extractTextFromImage(options.imageUri, {
      mode: options.mode || 'text'
    });

    const recognizedText = ocrResult.rawText ? ocrResult.rawText.trim() : '';
    if (recognizedText.length === 0) {
      throw new Error('Không phát hiện được văn bản nào trong hình ảnh đã chọn.');
    }

    // 2. Tạo tiêu đề thông minh: Lấy dòng đầu tiên của văn bản hoặc tạo theo ngày giờ
    const defaultTitle = this.generateTitleFromContent(recognizedText);
    const finalTitle = options.noteTitle?.trim() || defaultTitle;

    // 3. Chuẩn bị danh sách nhãn (Tags)
    const tags = Array.from(
      new Set(['OCR', 'Tiếng Việt', ...(options.tags || [])])
    );

    // 4. Tự động khởi tạo và lưu Note mới vào cơ sở dữ liệu cục bộ thông qua Repository
    const createdNote = await this.noteRepository.createNote({
      title: finalTitle,
      content: recognizedText,
      tags,
      isPinned: false,
      isArchived: false,
      hasOcr: true,
      ocrRawText: recognizedText
    });

    return {
      note: createdNote,
      ocrResult
    };
  }

  /**
   * Tự động sinh tiêu đề ngắn gọn từ nội dung trích xuất
   */
  private generateTitleFromContent(content: string): string {
    const firstLine = content.split('\n')[0].replace(/^[#\s\d\.\-\*]+/, '').trim();
    if (firstLine.length > 0 && firstLine.length <= 60) {
      return firstLine;
    }
    const now = new Date();
    const formattedDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return `Tài liệu OCR - ${formattedDate} ${formattedTime}`;
  }
}
