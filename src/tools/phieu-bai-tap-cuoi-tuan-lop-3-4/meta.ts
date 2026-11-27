import { CalendarRange } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'phieu-bai-tap-cuoi-tuan-lop-3-4',
  name: 'Phiếu cuối tuần lớp 3–4',
  description: 'Toán, Tiếng Việt và viết đoạn ngắn theo tuần.',
  icon: CalendarRange,
  group: 'phieu-bai-tap',
  grades: [3, 4],
  subjects: ['chung', 'toan', 'tieng-viet'],
  mode: 'print',
  keywords: ['bài tập cuối tuần', 'ôn tập tuần', 'viết đoạn văn'],
  phase: 3,
  access: 'pro',
};

export default meta;
