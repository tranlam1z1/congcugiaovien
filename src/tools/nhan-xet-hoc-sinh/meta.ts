import { MessageCircle } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'nhan-xet-hoc-sinh',
  name: 'Nhận xét học sinh (TT27)',
  description: 'Gợi ý lời nhận xét cho cả lớp, sửa tay từng em.',
  icon: MessageCircle,
  group: 'quan-ly-lop',
  grades: [1, 2, 3, 4, 5],
  subjects: ['chung'],
  mode: 'print',
  keywords: ['lời nhận xét', 'thông tư 27', 'học bạ', 'đánh giá'],
  isNew: true,
  phase: 1,
  access: 'free',
  guide: [
    'Dán danh sách lớp, mỗi dòng một tên, hoặc nhập từ file Excel.',
    'Chọn cách xưng hô, trọng tâm và mức mặc định cho cả lớp.',
    'Chỉnh mức học tập, phẩm chất cho từng em; bấm “Viết lại” để đổi câu hoặc sửa thẳng trong ô.',
    'Đọc lại từng lời nhận xét, rồi “Chép tất cả”, tải CSV/Excel, in hoặc tải PDF.',
  ],
  faq: [
    {
      question: 'Có dùng nguyên lời nhận xét được không?',
      answer:
        'Đây chỉ là bản nháp ghép từ kho câu có sẵn. Thầy cô cần đọc lại và sửa cho đúng với từng em trước khi ghi vào học bạ hay học bạ số.',
    },
    {
      question: 'Học sinh khuyết tật nhận xét thế nào?',
      answer:
        'Nên tự viết dựa trên sự tiến bộ của chính em đó, không so sánh với bạn khác. Câu gợi ý của công cụ không thay được phần này.',
    },
    {
      question: 'Tên học sinh và lời nhận xét có bị gửi lên mạng không?',
      answer:
        'Không. Danh sách lớp và nhận xét chỉ lưu trên máy bạn. Dùng máy chung thì bấm “Xoá dữ liệu trên máy này” ở mục “Danh sách lớp” sau khi xong.',
    },
  ],
};

export default meta;
