import { CalendarDays } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'phieu-bai-tap-cuoi-tuan-lop-1-2',
  name: 'Phiếu cuối tuần lớp 1–2',
  description: 'Toán và Tiếng Việt theo tuần học 1–35.',
  icon: CalendarDays,
  group: 'phieu-bai-tap',
  grades: [1, 2],
  subjects: ['chung', 'toan', 'tieng-viet'],
  mode: 'print',
  keywords: ['bài tập cuối tuần', 'ôn tập tuần'],
  phase: 3,
  access: 'pro',
};

export default meta;
