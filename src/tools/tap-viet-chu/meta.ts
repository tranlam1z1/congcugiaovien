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
  phase: 1,
  access: 'guest',
};

export default meta;
