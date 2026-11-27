import { Box } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'hinh-khai-trien',
  name: 'Hình khai triển',
  description: 'Hình khối để cắt, gấp, dán, in đúng tỉ lệ.',
  icon: Box,
  group: 'phieu-bai-tap',
  grades: [3, 4, 5, 'thcs-thpt'],
  subjects: ['toan'],
  mode: 'print',
  keywords: ['hình hộp', 'lập phương', 'hình trụ', 'hình nón', 'lăng trụ', 'hình chóp', 'cắt dán'],
  phase: 4,
  access: 'pro',
};

export default meta;
