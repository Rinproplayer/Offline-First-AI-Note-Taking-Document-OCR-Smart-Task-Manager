# [REPORT TEMPLATE 1] PROJECT PROPOSAL & INTERACTIVE WIREFRAME PROTOTYPE
**Course:** Cross-Platform Mobile App Development  
**Project Title:** Ứng dụng Sổ tay Ghi chú Thông minh & Quản lý Công việc Tích hợp AI (OCR & Trợ lý LLM) - MindVault: Offline-First AI Note-Taking, Document OCR & Smart Task Manager  
**Team Name:** SBTC (Nguyễn Trung Nguyên - 23IT.B143 [Trưởng nhóm], Võ Thành Nam - 23IT.B135, Võ Tiến Phúc - 23IT.B168, Đoàn Kim Oanh - 23IT.B159) • **Academic Term:** Semester 1 (2026 - 2027) • **Deadline:** Week 4

---

## 1. PROJECT MOTIVATION & PROBLEM STATEMENT
### 1.1. Context & Practical Problem Space
* Sinh viên và chuyên viên văn phòng thường xuyên gặp khó khăn trong việc số hóa giáo trình, tài liệu in hay bảng viết trong các buổi học/họp. Việc gõ lại thủ công gây tốn nhiều thời gian và dễ bỏ sót các đầu việc (action items), deadline quan trọng.
* Các ứng dụng ghi chú đám mây phổ biến (Notion, Google Keep) phụ thuộc hoàn toàn vào kết nối Internet liên tục, dễ gây gián đoạn công việc khi mất mạng ở giảng đường hoặc khu vực sóng yếu.
* **MindVault** giải quyết bài toán trên bằng mô hình **Offline-First**, lưu trữ dữ liệu tại máy (WatermelonDB SQLite), tích hợp nhận dạng văn bản tiếng Việt on-device tốc độ cao qua **Google ML Kit** và trợ lý **Streaming AI** tự động phân tích ghi chú thành danh sách nhiệm vụ cần làm.

### 1.2. Target User Personas
* **Primary Persona:** Nguyễn Hoàng Long (21 tuổi, sinh viên Công nghệ thông tin). Mục tiêu: Chụp ảnh bài giảng trên bảng, trích xuất văn bản tiếng Việt nhanh tại lớp học ngoại tuyến; tự động bóc tách hạn nộp bài tập lớn. Điểm đau: Mạng WiFi giảng đường chập chờn, mất nhiều thời gian chép lại bài giảng, hay quên deadline bài tập.
* **Typical User Story:** Long mở MindVault ở chế độ offline, chụp bảng bài tập bằng camera -> Google ML Kit nhận diện văn bản on-device dưới 150ms -> Bấm "Trích việc", AI streaming tự động phân tích và tạo nhiệm vụ có hạn chót vào tab "Hôm nay" -> Khi về nhà có WiFi, ứng dụng ngầm đồng bộ hai chiều an toàn với cơ sở dữ liệu Supabase PostgreSQL (RLS).

---

## 2. SYSTEM SCOPE & FUNCTIONAL SPECIFICATIONS
| # | Feature Category | Concrete Feature | Priority | Business Logic & Scope |
|:---:|---|---|:---:|---|
| 1 | Authentication & Profile | Supabase Auth (Email / OAuth), Khách ẩn danh (Guest Session) | Must-Have | Bảo vệ và cô lập dữ liệu người dùng ở mức CSDL với PostgreSQL Row-Level Security (RLS). |
| 2 | Core Business Logic | Quản lý Ghi chú & Nhiệm vụ (Lịch tuần động, Vuốt xóa 60 FPS) | Must-Have | Soạn thảo rich text, tạo mới trống sạch, lọc việc theo ngày (T2–CN, Hôm nay, Sắp tới, Từ AI), animation kéo đỏ xóa mượt mà với Reanimated. |
| 3 | Artificial Intelligence (AI) | On-Device OCR tiếng Việt & Trợ lý Streaming LLM (SSE) | Must-Have | Xử lý OCR hoàn toàn ngoại tuyến qua Google ML Kit (< 250ms), trợ lý AI truyền phát token thời gian thực để tóm tắt và trích xuất việc cần làm liên kết với ghi chú (`AI Note Link`). |
| 4 | Offline Resilience | Lưu trữ cục bộ & Tự động đồng bộ hai chiều (Bi-directional Sync) | Should-Have | Vận hành độc lập không cần mạng với WatermelonDB (SQLite) + MMKV cache, tự động đồng bộ hai chiều lên Supabase khi phát hiện có mạng. |

---

## 3. TECH STACK & INITIAL ARCHITECTURE
* **Framework:** React Native (Expo SDK 58, TypeScript, Strict 3-Layer Clean Architecture) • **State Management:** Zustand & TanStack Query
* **Backend:** Supabase (PostgreSQL, Row-Level Security) • **AI Engine:** Google ML Kit (On-Device Text Recognition) & Streaming LLM (SSE Client)
* **🔗 Figma Prototype URL:** https://www.figma.com/design/p8UwKE8kOcRg4QDKPqNA8r/Untitled?node-id=0-1&t=TYGHktn0myelPVjj-1
* **🔗 GitHub Repository:** https://github.com/Rinproplayer/Offline-First-AI-Note-Taking-Document-OCR-Smart-Task-Manager
* **🔗 Báo cáo PDF:** https://drive.google.com/drive/folders/15ujP5yjcgX5Go10XxvGvbO22fO8B4I_J?usp=drive_link
* **🔗 Tải APK:** https://drive.google.com/drive/folders/1tKbgBpehEQRkYTJ3eQTNJ2Mkd34_CL0l?usp=drive_link
* **🔗 Video Demo:** https://drive.google.com/drive/folders/1TaP7tMudeglNH6nbAGw8hy6UXZYk8KG5?usp=drive_link
