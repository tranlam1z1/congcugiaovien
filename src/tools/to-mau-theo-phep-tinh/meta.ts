import { PaintBucket } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'to-mau-theo-phep-tinh',
  name: 'Tô màu theo phép tính',
  description: 'Làm phép tính để biết tô màu nào, kèm tranh đáp án.',
  icon: PaintBucket,
  group: 'to-mau-ve',
  grades: [1, 2, 3],
  subjects: ['toan'],
  mode: 'print',
  keywords: ['tranh tô màu', 'cộng trừ', 'nhân chia', 'trò chơi toán'],
  phase: 1,
  access: 'guest',
};

export default meta;
