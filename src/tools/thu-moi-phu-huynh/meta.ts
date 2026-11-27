import { Mail } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'thu-moi-phu-huynh',
  name: 'Thư mời họp phụ huynh',
  description: 'Thư mời in tên từng em, kèm phần giấy hồi đáp.',
  icon: Mail,
  group: 'quan-ly-lop',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['chung'],
  mode: 'print',
  keywords: ['giấy mời', 'họp phụ huynh', 'hồi đáp'],
  phase: 3,
  access: 'pro',
};

export default meta;
