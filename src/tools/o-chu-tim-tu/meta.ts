import { TextSearch } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'o-chu-tim-tu',
  name: 'Ô chữ và tìm từ',
  description: 'Tạo ô chữ có gợi ý hoặc bảng tìm từ ẩn.',
  icon: TextSearch,
  group: 'tro-choi',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['chung', 'tieng-viet', 'tieng-anh'],
  mode: 'print',
  keywords: ['ô chữ', 'tìm từ', 'crossword', 'word search'],
  isNew: true,
  phase: 1,
  access: 'guest',
  guide: [
    'Chọn “Tìm từ ẩn” hoặc “Ô chữ có gợi ý”.',
    'Nhập danh sách, mỗi dòng một từ. Ô chữ cần gợi ý theo dạng: từ | gợi ý.',
    'Chỉnh kích thước lưới, độ khó, font trong ô rồi xem trước trang A4.',
    'Bấm “Đổi bộ khác” để xếp lại. Ghi lại mã đề nếu cần in lại đúng bộ đó.',
    'Bấm “In ngay” (khổ A4, tỉ lệ 100%) hoặc “Tải PDF”. Đáp án in ở các trang cuối.',
  ],
  faq: [
    {
      question: 'Chữ có dấu nằm trong ô thế nào?',
      answer:
        'Mỗi ô giữ một chữ cái kèm đủ dấu, ví dụ “Ớ” là một ô. Cụm từ được viết liền, bỏ khoảng trắng.',
    },
    {
      question: 'Vì sao có từ không xuất hiện trong lưới?',
      answer:
        'Từ dài hơn lưới, lưới đã hết chỗ, hoặc ở ô chữ từ đó không có chữ cái nào giống hệt (kể cả dấu) để giao với từ khác. Công cụ ghi rõ các từ bị loại bên dưới danh sách; hãy tăng kích thước lưới hoặc bấm “Đổi bộ khác”.',
    },
    {
      question: 'Mỗi học sinh có thể nhận một đề khác nhau không?',
      answer:
        'Có. Dán danh sách tên học sinh hoặc tăng số phiếu; mỗi phiếu được xếp lưới riêng và có đáp án tương ứng.',
    },
  ],
};

export default meta;
