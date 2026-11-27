import { TextCursorInput } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'phieu-luyen-tu-va-cau',
  name: 'Luyện từ và câu',
  description: 'Từ loại, dấu câu, mẫu câu, từ đồng nghĩa và trái nghĩa.',
  icon: TextCursorInput,
  group: 'phieu-bai-tap',
  grades: [2, 3, 4, 5],
  subjects: ['tieng-viet'],
  mode: 'print',
  keywords: ['từ chỉ sự vật', 'dấu câu', 'đồng nghĩa', 'trái nghĩa', 'ai là gì'],
  phase: 3,
  access: 'pro',
};

export default meta;
