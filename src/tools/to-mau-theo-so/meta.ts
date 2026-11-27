import { Palette } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'to-mau-theo-so',
  name: 'Tô màu theo số',
  description: 'Tranh chia vùng đánh số kèm bảng màu.',
  icon: Palette,
  group: 'to-mau-ve',
  grades: [1, 2, 3],
  subjects: ['chung'],
  mode: 'print',
  keywords: ['tranh tô màu', 'số màu'],
  phase: 2,
  access: 'pro',
};

export default meta;
