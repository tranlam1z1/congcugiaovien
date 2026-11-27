import { Pyramid } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'ma-phuong-thap-so',
  name: 'Ma phương và tháp số',
  description: 'Ma phương 3×3 và tháp số cộng để trống ô.',
  icon: Pyramid,
  group: 'tro-choi',
  grades: [2, 3, 4, 5],
  subjects: ['toan'],
  mode: 'print',
  keywords: ['hình vuông kỳ diệu', 'tháp số', 'phép cộng'],
  phase: 3,
  access: 'pro',
};

export default meta;
