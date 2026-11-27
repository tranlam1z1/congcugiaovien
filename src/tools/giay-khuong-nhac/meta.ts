import { ListMusic } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'giay-khuong-nhac',
  name: 'Giấy khuông nhạc trống',
  description: 'Khuông nhạc 6–12 dòng, in sẵn khóa Sol, Fa.',
  icon: ListMusic,
  group: 'giay-tap-viet',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['am-nhac'],
  mode: 'print',
  keywords: ['giấy chép nhạc', 'khóa sol', 'âm nhạc'],
  phase: 3,
  access: 'pro',
};

export default meta;
