import { Grid3x3 } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'bingo',
  name: 'Bingo',
  description: 'Thẻ bingo mỗi em một khác, có chế độ gọi ngẫu nhiên.',
  icon: Grid3x3,
  group: 'tro-choi',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['chung', 'toan', 'tieng-anh'],
  mode: 'both',
  keywords: ['lô tô', 'trò chơi', 'gọi số'],
  phase: 2,
  access: 'free',
};

export default meta;
