import { Tag } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'nhan-vo-the-ten',
  name: 'Nhãn vở và thẻ tên',
  description: 'Nhãn vở, thẻ tên để bàn in theo danh sách lớp.',
  icon: Tag,
  group: 'the-bang',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['chung'],
  mode: 'print',
  keywords: ['nhãn tên', 'bảng tên'],
  phase: 2,
  access: 'pro',
};

export default meta;
