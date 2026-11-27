import { Images } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'the-tu-vung-hinh',
  name: 'Thẻ từ vựng có hình',
  description: 'Thẻ hình và chữ in hai mặt từ hình của bạn.',
  icon: Images,
  group: 'the-bang',
  grades: [1, 2, 3, 4, 5],
  subjects: ['chung', 'tieng-viet', 'tieng-anh'],
  mode: 'print',
  keywords: ['flashcard', 'thẻ hình', 'clipart'],
  phase: 3,
  access: 'pro',
};

export default meta;
