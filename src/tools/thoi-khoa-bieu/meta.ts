import { CalendarClock } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'thoi-khoa-bieu',
  name: 'Thời khóa biểu',
  description: 'Soạn thời khóa biểu tô màu theo môn, in cho lớp và vở.',
  icon: CalendarClock,
  group: 'quan-ly-lop',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['chung'],
  mode: 'print',
  keywords: ['lịch học', 'tkb', 'tiết học'],
  phase: 2,
  access: 'free',
};

export default meta;
