import { LayoutGrid } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'ghep-trang-pdf',
  name: 'Ghép nhiều trang trên một tờ',
  description: 'In 2 đến 16 trang một tờ hoặc in sách gấp đôi.',
  icon: LayoutGrid,
  group: 'tien-ich',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['chung'],
  mode: 'print',
  keywords: ['n-up', 'booklet', 'in tiết kiệm giấy', 'in sách'],
  phase: 3,
  access: 'pro',
};

export default meta;
