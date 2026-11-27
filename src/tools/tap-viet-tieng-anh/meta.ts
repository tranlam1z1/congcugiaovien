import { Languages } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'tap-viet-tieng-anh',
  name: 'Phiếu tập viết tiếng Anh',
  description: 'Chữ cái, từ vựng, câu trên giấy 4 dòng kẻ.',
  icon: Languages,
  group: 'giay-tap-viet',
  grades: [1, 2, 3, 4, 5],
  subjects: ['tieng-anh'],
  mode: 'print',
  keywords: ['english handwriting', 'alphabet', 'cursive', 'tập viết'],
  isNew: true,
  phase: 1,
  access: 'free',
  guide: [
    'Chọn một mẫu có sẵn, một gói từ vựng theo lớp, hoặc tự nhập, mỗi dòng một mẫu.',
    'Chọn chữ in hoặc chữ nối nét, khoảng cách dòng kẻ, tô mờ hoặc nét chấm.',
    'Bật hình minh họa để từ vựng quen thuộc có hình ở đầu dòng.',
    'Chọn số dòng có chữ mẫu và số dòng trống để học sinh tự viết.',
    'Muốn mỗi em một phiếu thì dán danh sách tên học sinh, mỗi dòng một tên.',
    'Bấm “In ngay” (khổ A4, tỉ lệ 100%) hoặc “Tải PDF”.',
  ],
  faq: [
    {
      question: 'Chấm đầu tiên của mỗi nét nằm ở đâu?',
      answer:
        'Với chữ in, nét được rải chấm từ chỗ đặt bút theo cách viết thường gặp. Thứ tự nét ở mỗi trường có thể khác đôi chút, bạn nên làm mẫu cho học sinh.',
    },
    {
      question: 'Vì sao từ của tôi không có hình?',
      answer:
        'Hình chỉ hiện khi dòng gồm đúng một từ có trong bộ hình có sẵn, như cat, apple, book, sun, bus.',
    },
    {
      question: 'Nội dung và tên học sinh có bị gửi lên mạng không?',
      answer: 'Không. Mọi thứ được dựng và lưu ngay trên máy của bạn.',
    },
  ],
};

export default meta;
