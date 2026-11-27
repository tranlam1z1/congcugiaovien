import { Type } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'the-chu-the-tu',
  name: 'Thẻ chữ, thẻ từ',
  description: 'Thẻ chữ cái, âm, vần, dấu thanh cỡ tùy chọn.',
  icon: Type,
  group: 'the-bang',
  grades: [1, 2],
  subjects: ['tieng-viet'],
  mode: 'print',
  keywords: ['thẻ chữ cái', 'thẻ âm vần', 'bộ chữ'],
  phase: 2,
  access: 'pro',
};

export default meta;
