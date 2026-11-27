import { LayoutTemplate } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'phieu-hoc-tap-khung-trong',
  name: 'Phiếu học tập khung trống',
  description: 'Sơ đồ tư duy, Venn, KWL, 5W1H, phiếu đọc sách.',
  icon: LayoutTemplate,
  group: 'phieu-bai-tap',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['chung'],
  mode: 'print',
  keywords: ['sơ đồ tư duy', 'mindmap', 'venn', 'kwl', 'đọc sách', 'bảng so sánh'],
  phase: 2,
  access: 'pro',
};

export default meta;
