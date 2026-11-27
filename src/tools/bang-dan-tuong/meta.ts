import { Presentation } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'bang-dan-tuong',
  name: 'Bảng dán tường',
  description: 'Poster nội quy, bảng chữ cái, cửu chương ghép nhiều tờ.',
  icon: Presentation,
  group: 'the-bang',
  grades: [1, 2, 3, 4, 5],
  subjects: ['chung'],
  mode: 'print',
  keywords: ['poster', 'nội quy lớp', 'khẩu hiệu', 'cửu chương', 'bảng chữ cái'],
  phase: 3,
  access: 'pro',
};

export default meta;
