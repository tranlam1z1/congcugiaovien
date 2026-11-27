import { Hash } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'phieu-so-lop-1-3',
  name: 'Phiếu số lớp 1–3',
  description: 'Đếm hình, số liền trước liền sau, tách số, tia số.',
  icon: Hash,
  group: 'phieu-bai-tap',
  grades: [1, 2, 3],
  subjects: ['toan'],
  mode: 'print',
  keywords: ['đếm số', 'tách số', 'tia số', 'sắp xếp số', 'đọc viết số'],
  phase: 2,
  access: 'free',
};

export default meta;
