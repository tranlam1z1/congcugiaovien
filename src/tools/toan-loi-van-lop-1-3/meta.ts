import { MessageSquareText } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'toan-loi-van-lop-1-3',
  name: 'Toán lời văn lớp 1–3',
  description: 'Bài toán có lời văn kèm khung Bài giải và Đáp số.',
  icon: MessageSquareText,
  group: 'phieu-bai-tap',
  grades: [1, 2, 3],
  subjects: ['toan'],
  mode: 'print',
  keywords: ['giải toán', 'bài giải', 'nhiều hơn ít hơn', 'chia đều'],
  phase: 2,
  access: 'pro',
};

export default meta;
