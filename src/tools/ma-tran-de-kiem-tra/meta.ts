import { Table2 } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'ma-tran-de-kiem-tra',
  name: 'Ma trận đề kiểm tra',
  description: 'Phân bố câu theo mức độ, tự tính điểm và tỉ lệ.',
  icon: Table2,
  group: 'de-kiem-tra',
  grades: ['thcs-thpt'],
  subjects: ['chung'],
  mode: 'print',
  keywords: ['nhận biết', 'thông hiểu', 'vận dụng', 'đề kiểm tra'],
  phase: 2,
  access: 'pro',
};

export default meta;
