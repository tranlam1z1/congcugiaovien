import { BookOpen } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'phieu-tieng-viet',
  name: 'Phiếu tiếng Việt lớp 1',
  description: 'Điền âm vần, nối từ, sắp xếp câu từ danh sách từ.',
  icon: BookOpen,
  group: 'phieu-bai-tap',
  grades: [1],
  subjects: ['tieng-viet'],
  mode: 'print',
  keywords: ['âm vần', 'nối từ', 'sắp xếp câu', 'đánh vần'],
  isNew: true,
  phase: 1,
  access: 'guest',
  guide: [
    'Chọn dạng bài: điền âm vần, nối từ hoặc sắp xếp câu.',
    'Dán danh sách từ hoặc câu, mỗi dòng một mục. Có sẵn danh sách mẫu để thử.',
    'Chọn số cột, font và cỡ chữ rồi xem trước trang A4.',
    'Bấm “Đổi bộ khác” để trộn lại, rồi “In ngay” (khổ A4, tỉ lệ 100%) hoặc “Tải PDF”.',
  ],
  faq: [
    {
      question: 'Công cụ tách âm đầu và vần thế nào?',
      answer:
        'Theo chính tả: “ngh”, “nh”, “tr”, “qu”, “gi” là âm đầu; phần còn lại kèm dấu thanh là vần. Tiếng bắt đầu bằng nguyên âm như “áo” không có âm đầu.',
    },
    {
      question: 'Muốn tự quyết định hai vế khi nối từ thì làm sao?',
      answer: 'Thêm dấu | giữa hai vế, ví dụ: con trâu | gặm cỏ.',
    },
    {
      question: 'Học sinh có nhiều cách nối đúng thì sao?',
      answer:
        'Trang đáp án ghi theo đúng danh sách bạn nhập. Với các từ dễ ghép lẫn, thầy cô chấp nhận cách nối khác nếu tạo thành từ có nghĩa.',
    },
  ],
};

export default meta;
