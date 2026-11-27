import { Sun } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'bai-tap-on-tet-on-he',
  name: 'Ôn Tết, ôn hè',
  description: 'Mỗi ngày một trang ôn tập, có bìa và bảng theo dõi.',
  icon: Sun,
  group: 'phieu-bai-tap',
  grades: [1, 2, 3, 4, 5],
  subjects: ['chung', 'toan', 'tieng-viet'],
  mode: 'print',
  keywords: ['ôn hè', 'ôn tết', 'nghỉ hè', 'bài tập về nhà'],
  phase: 3,
  access: 'pro',
};

export default meta;
