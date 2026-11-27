import { BrushCleaning } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'phan-cong-truc-nhat',
  name: 'Phân công trực nhật',
  description: 'Lịch trực xoay vòng theo tổ, in dán tường.',
  icon: BrushCleaning,
  group: 'quan-ly-lop',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['chung'],
  mode: 'print',
  keywords: ['trực lớp', 'vệ sinh', 'phân công'],
  phase: 3,
  access: 'pro',
};

export default meta;
