import { Route } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'me-cung',
  name: 'Mê cung',
  description: 'Mê cung vuông, tròn hoặc mê cung phép tính.',
  icon: Route,
  group: 'tro-choi',
  grades: [1, 2, 3, 4, 5],
  subjects: ['chung', 'toan'],
  mode: 'print',
  keywords: ['tìm đường', 'trò chơi', 'mê lộ'],
  phase: 3,
  access: 'free',
};

export default meta;
