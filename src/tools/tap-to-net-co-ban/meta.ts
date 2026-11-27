import { Spline } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'tap-to-net-co-ban',
  name: 'Tập tô nét cơ bản',
  description: 'Nét thẳng, cong, sóng, xoắn cho bé chuẩn bị vào lớp 1.',
  icon: Spline,
  group: 'giay-tap-viet',
  grades: [1],
  subjects: ['tieng-viet'],
  mode: 'print',
  keywords: ['tô nét', 'tiền tiểu học', 'mẫu giáo', 'nét đứt'],
  phase: 2,
  access: 'pro',
};

export default meta;
