import { Puzzle } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'phieu-ghep-hinh-cau',
  name: 'Ghép hình thành câu',
  description: 'Cắt câu thành thẻ từ để học sinh ghép lại.',
  icon: Puzzle,
  group: 'phieu-bai-tap',
  grades: [1, 2, 3],
  subjects: ['tieng-viet'],
  mode: 'print',
  keywords: ['ghép câu', 'cắt dán', 'thẻ từ'],
  phase: 3,
  access: 'pro',
};

export default meta;
