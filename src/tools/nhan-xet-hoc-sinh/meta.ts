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
  phase: 1,
  access: 'free',
};

export default meta;
