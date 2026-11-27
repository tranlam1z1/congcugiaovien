import { Shapes } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'day-quy-luat',
  name: 'Dãy quy luật',
  description: 'Điền tiếp dãy số, hình, màu theo quy luật.',
  icon: Shapes,
  group: 'tro-choi',
  grades: [1, 2, 3],
  subjects: ['toan'],
  mode: 'print',
  keywords: ['quy luật', 'dãy số', 'mẫu lặp', 'logic'],
  phase: 3,
  access: 'pro',
};

export default meta;
