import { Users } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'chia-nhom',
  name: 'Chia nhóm ngẫu nhiên',
  description: 'Chia nhóm cân bằng, đặt tên nhóm và nhóm trưởng.',
  icon: Users,
  group: 'quan-ly-lop',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['chung'],
  mode: 'both',
  keywords: ['chia tổ', 'chia đội', 'nhóm trưởng', 'ngẫu nhiên'],
  isNew: true,
  phase: 1,
  access: 'guest',
  guide: [
    'Dán danh sách lớp, mỗi dòng một tên; thêm “, Nam” hoặc “, Nữ” nếu muốn cân bằng. Có thể nhập từ Excel.',
    'Chọn chia theo số nhóm hoặc số em mỗi nhóm.',
    'Thêm cặp không ngồi cùng nhóm, đặt tên nhóm nếu cần.',
    'Bấm “Đổi bộ khác” để chia lại, “Toàn màn hình” để trình chiếu hoặc “In ngay” để in.',
  ],
  faq: [
    {
      question: 'Danh sách lớp lưu ở đâu?',
      answer:
        'Chỉ lưu trong trình duyệt trên máy này, không gửi đi đâu. Máy dùng chung thì bấm “Xoá dữ liệu trên máy này” sau khi dùng.',
    },
    {
      question: 'Nhập file Excel cần định dạng gì?',
      answer:
        'File .xlsx hoặc .csv có cột “Họ và tên” (hoặc “Họ đệm” và “Tên”), thêm cột “Giới tính” hoặc cột “Nữ” đánh dấu x nếu có. Công cụ đọc trang tính đầu tiên.',
    },
    {
      question: 'Trình chiếu thì chia lại bằng phím nào?',
      answer: 'Phím Space, mũi tên phải hoặc nút chuyển trang trên bút trình chiếu.',
    },
  ],
};

export default meta;
