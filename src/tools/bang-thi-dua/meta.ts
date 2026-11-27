import { Trophy } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'bang-thi-dua',
  name: 'Bảng thi đua',
  description: 'Cộng trừ sao theo tổ hoặc cá nhân, in dán tường.',
  icon: Trophy,
  group: 'the-bang',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['chung'],
  mode: 'both',
  keywords: ['sao', 'xếp hạng', 'thi đua', 'khen thưởng'],
  phase: 2,
  access: 'pro',
};

export default meta;
