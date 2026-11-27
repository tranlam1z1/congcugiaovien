import { FileImage } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'pdf-sang-anh',
  name: 'PDF sang ảnh',
  description: 'Xuất trang PDF thành ảnh PNG hoặc JPG.',
  icon: FileImage,
  group: 'tien-ich',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['chung'],
  mode: 'print',
  keywords: ['pdf to jpg', 'pdf to png', 'chuyển đổi'],
  phase: 2,
  access: 'pro',
};

export default meta;
