import { ClipboardCheck } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'diem-danh-thu-nop',
  name: 'Điểm danh và thu nộp',
  description: 'Bảng điểm danh tháng và bảng theo dõi khoản thu.',
  icon: ClipboardCheck,
  group: 'quan-ly-lop',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['chung'],
  mode: 'print',
  keywords: ['chuyên cần', 'thu tiền', 'bảng ký', 'sổ theo dõi'],
  phase: 2,
  access: 'free',
};

export default meta;
