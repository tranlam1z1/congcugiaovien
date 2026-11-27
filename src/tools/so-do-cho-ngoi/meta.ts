import { Armchair } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'so-do-cho-ngoi',
  name: 'Sơ đồ chỗ ngồi',
  description: 'Kéo thả đổi chỗ, xếp ngẫu nhiên, in A4 ngang.',
  icon: Armchair,
  group: 'quan-ly-lop',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['chung'],
  mode: 'print',
  keywords: ['xếp chỗ', 'sơ đồ lớp', 'bàn học'],
  phase: 2,
  access: 'free',
};

export default meta;
