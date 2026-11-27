import { Ticket } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'phieu-doi-qua',
  name: 'Phiếu đổi quà',
  description: 'Vé thưởng tự soạn nội dung, có đường cắt.',
  icon: Ticket,
  group: 'the-bang',
  grades: [1, 2, 3, 4, 5],
  subjects: ['chung'],
  mode: 'print',
  keywords: ['vé khen', 'phiếu thưởng', 'quà'],
  phase: 3,
  access: 'pro',
};

export default meta;
