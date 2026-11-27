import { Brush } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'tranh-to-mau-cho-be',
  name: 'Tranh tô màu cho bé',
  description: 'Tranh con vật, xe cộ, Tết, Trung thu kèm chữ tập đọc.',
  icon: Brush,
  group: 'to-mau-ve',
  grades: [1, 2],
  subjects: ['chung'],
  mode: 'print',
  keywords: ['tranh tô màu', 'con vật', 'xe cộ', 'tết', 'trung thu'],
  phase: 2,
  access: 'free',
};

export default meta;
