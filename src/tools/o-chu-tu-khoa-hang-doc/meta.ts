import { KeyRound } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'o-chu-tu-khoa-hang-doc',
  name: 'Ô chữ từ khóa hàng dọc',
  description: 'Ô chữ có từ khóa dọc, in phiếu hoặc trình chiếu.',
  icon: KeyRound,
  group: 'tro-choi',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['chung', 'tieng-viet'],
  mode: 'both',
  keywords: ['ô chữ', 'từ khóa', 'khởi động'],
  phase: 2,
  access: 'pro',
};

export default meta;
