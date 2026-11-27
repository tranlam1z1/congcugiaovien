import { Music } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'phieu-tiet-tau',
  name: 'Phiếu tiết tấu',
  description: 'Mẫu tiết tấu 2/4, 3/4, 4/4 để vỗ theo và đếm phách.',
  icon: Music,
  group: 'phieu-bai-tap',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['am-nhac'],
  mode: 'print',
  keywords: ['âm nhạc', 'nhịp', 'phách', 'nốt nhạc'],
  phase: 4,
  access: 'pro',
};

export default meta;
