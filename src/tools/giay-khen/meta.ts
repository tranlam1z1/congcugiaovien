import { Award } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'giay-khen',
  name: 'Giấy khen',
  description: 'Mẫu giấy khen có viền, in hàng loạt theo danh sách tên.',
  icon: Award,
  group: 'the-bang',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['chung'],
  mode: 'print',
  keywords: ['khen thưởng', 'danh hiệu', 'chứng nhận'],
  phase: 2,
  access: 'pro',
};

export default meta;
