import { Flower2 } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'the-tro-choi-hoa-ong-dung-sai',
  name: 'Thẻ Hoa – Ong – Đúng sai',
  description: 'Thẻ giơ tay trả lời Đúng/Sai, A B C D.',
  icon: Flower2,
  group: 'tro-choi',
  grades: [1, 2, 3, 4, 5],
  subjects: ['chung'],
  mode: 'print',
  keywords: ['thẻ đúng sai', 'thẻ abcd', 'hoa', 'ong'],
  phase: 3,
  access: 'pro',
};

export default meta;
