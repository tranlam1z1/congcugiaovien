import { Stamp } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'them-watermark-pdf',
  name: 'Watermark và đánh số trang',
  description: 'Đóng dấu chữ, logo và đánh số trang cho PDF.',
  icon: Stamp,
  group: 'tien-ich',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['chung'],
  mode: 'print',
  keywords: ['watermark', 'đóng dấu', 'số trang', 'logo'],
  phase: 2,
  access: 'pro',
};

export default meta;
