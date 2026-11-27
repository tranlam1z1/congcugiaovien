import { Music2 } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'phieu-doc-ten-not',
  name: 'Đọc tên nốt',
  description: 'Nốt trên khuông khóa Sol, Fa để học sinh viết tên.',
  icon: Music2,
  group: 'phieu-bai-tap',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['am-nhac'],
  mode: 'print',
  keywords: ['âm nhạc', 'nốt nhạc', 'khóa sol', 'khóa fa', 'khuông nhạc'],
  phase: 4,
  access: 'pro',
};

export default meta;
