import { Image } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'anh-thanh-tranh-to-mau',
  name: 'Ảnh thành tranh tô màu',
  description: 'Biến ảnh của bạn thành nét vẽ để in tô màu.',
  icon: Image,
  group: 'to-mau-ve',
  grades: [1, 2, 3, 4, 5],
  subjects: ['chung'],
  mode: 'print',
  keywords: ['ảnh nét vẽ', 'tô màu từ ảnh', 'dò biên'],
  phase: 3,
  access: 'pro',
};

export default meta;
