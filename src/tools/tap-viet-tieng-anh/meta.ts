import { Languages } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'tap-viet-tieng-anh',
  name: 'Phiếu tập viết tiếng Anh',
  description: 'Chữ cái, từ vựng, câu trên giấy 4 dòng kẻ.',
  icon: Languages,
  group: 'giay-tap-viet',
  grades: [1, 2, 3, 4, 5],
  subjects: ['tieng-anh'],
  mode: 'print',
  keywords: ['english handwriting', 'alphabet', 'cursive', 'tập viết'],
  phase: 1,
  access: 'free',
};

export default meta;
