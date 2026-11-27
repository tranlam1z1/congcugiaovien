import { PenLine } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'tap-viet-chu',
  name: 'Tạo bài tập viết chữ',
  description: 'Chữ mẫu tô mờ trên giấy ô ly theo nội dung bạn nhập.',
  icon: PenLine,
  group: 'giay-tap-viet',
  grades: [1, 2, 3],
  subjects: ['tieng-viet'],
  mode: 'print',
  keywords: ['tập viết', 'chữ hoa', 'chữ thường', 'ô ly', 'luyện chữ', 'chữ số'],
  isNew: true,
  phase: 1,
  access: 'guest',
  guide: [
    'Bấm một mẫu có sẵn (chữ thường, chữ hoa, chữ số, dấu thanh, câu mẫu) hoặc tự nhập, mỗi dòng một mẫu.',
    'Chọn chiều cao chữ, cạnh ô và loại giấy.',
    'Chọn tô mờ, nét chấm hoặc viền rỗng; chỉnh độ mờ và màu chữ.',
    'Chọn số dòng có chữ mẫu và số dòng trống để học sinh tự viết.',
    'Muốn mỗi em một phiếu thì dán danh sách tên học sinh, mỗi dòng một tên.',
    'Bấm “In ngay” (khổ A4, tỉ lệ 100%) hoặc “Tải PDF”.',
  ],
  faq: [
    {
      question: 'Chữ mẫu dùng font nào?',
      answer:
        'Chữ viết tay Playwrite VN (giấy phép mở), nét nối liền và đủ dấu tiếng Việt. Dáng một số chữ có thể khác mẫu chữ trong vở tập viết của trường, bạn nên xem trước khi in nhiều.',
    },
    {
      question: 'In ra ô không đúng kích thước thì làm sao?',
      answer:
        'Trong hộp thoại in, chọn khổ A4, tỉ lệ 100% (hoặc “Kích thước thực”) và tắt “Vừa với trang”.',
    },
    {
      question: 'Nội dung và tên học sinh có bị gửi lên mạng không?',
      answer: 'Không. Mọi thứ được dựng và lưu ngay trên máy của bạn.',
    },
  ],
};

export default meta;
