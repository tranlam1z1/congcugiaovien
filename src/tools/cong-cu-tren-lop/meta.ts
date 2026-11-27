import { Timer } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'cong-cu-tren-lop',
  name: 'Công cụ trên lớp',
  description: 'Vòng quay gọi tên, đếm ngược, đo tiếng ồn, bốc thăm.',
  icon: Timer,
  group: 'quan-ly-lop',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['chung'],
  mode: 'present',
  keywords: ['vòng quay', 'gọi tên', 'đồng hồ đếm ngược', 'tiếng ồn', 'bốc thăm', 'ngẫu nhiên'],
  phase: 1,
  access: 'guest',
};

export default meta;
