import { Clock } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'phieu-dong-ho-tien',
  name: 'Đồng hồ và tiền Việt Nam',
  description: 'Xem giờ, vẽ kim đồng hồ, tính tiền và tiền thừa.',
  icon: Clock,
  group: 'phieu-bai-tap',
  grades: [1, 2, 3],
  subjects: ['toan'],
  mode: 'print',
  keywords: ['xem đồng hồ', 'giờ phút', 'tiền thừa', 'mệnh giá'],
  phase: 2,
  access: 'free',
};

export default meta;
