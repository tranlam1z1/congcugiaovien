import { Calendar } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'lich-nam-hoc',
  name: 'Lịch năm học',
  description: 'Lịch cả năm đánh số tuần học, ngày lễ và nghỉ Tết.',
  icon: Calendar,
  group: 'quan-ly-lop',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['chung'],
  mode: 'print',
  keywords: ['tuần học', 'ngày nghỉ', 'khai giảng', 'kế hoạch năm'],
  phase: 3,
  access: 'pro',
};

export default meta;
