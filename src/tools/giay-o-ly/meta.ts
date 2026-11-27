import { Grid3X3 } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'giay-o-ly',
  name: 'Giấy ô ly và hơn 30 loại giấy',
  description: 'Ô ly, dòng kẻ, chấm bi và nhiều loại giấy in đúng mm.',
  icon: Grid3X3,
  group: 'giay-tap-viet',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['chung'],
  mode: 'print',
  keywords: ['giấy kẻ', 'giấy kẻ ngang', 'chấm bi', 'milimét', 'cornell', 'vở', 'khuông nhạc'],
  isNew: true,
  phase: 1,
  access: 'guest',
  guide: [
    'Chọn loại giấy, cỡ ô và kiểu kẻ đậm.',
    'Chọn khổ giấy, hướng giấy và số trang cần in.',
    'Chỉnh màu, độ đậm nét; thêm tiêu đề, chữ chìm hoặc logo nếu cần.',
    'Bấm “In ngay” hoặc “Tải PDF”. Khi in chọn đúng khổ giấy, tỉ lệ 100% và tắt “Vừa với trang”.',
  ],
  faq: [
    {
      question: 'In ra ô không đúng kích thước thì làm sao?',
      answer:
        'Trong hộp thoại in, chọn tỉ lệ 100% (hoặc “Kích thước thực”), tắt “Vừa với trang” và chọn đúng khổ giấy. Đo thử bằng thước trước khi in nhiều.',
    },
    {
      question: 'Vì sao quanh lưới còn khoảng trắng?',
      answer:
        'Công cụ chỉ vẽ ô trọn vẹn rồi canh giữa trong phần giấy trừ lề, nên không ô nào bị cắt dở.',
    },
    {
      question: 'Ảnh logo có bị gửi lên mạng không?',
      answer: 'Không. Ảnh được xử lý và lưu ngay trên máy của bạn.',
    },
  ],
};

export default meta;
