import { Files } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'cong-cu-pdf-anh',
  name: 'Bộ công cụ PDF và ảnh',
  description: 'Ảnh sang PDF, ghép, tách, xoay, sắp xếp trang.',
  icon: Files,
  group: 'tien-ich',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['chung'],
  mode: 'print',
  keywords: ['ghép pdf', 'tách pdf', 'xoay pdf', 'ảnh sang pdf', 'nối file'],
  phase: 1,
  access: 'free',
};

export default meta;
