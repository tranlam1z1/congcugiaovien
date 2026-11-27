import { Shuffle } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'tron-de-trac-nghiem',
  name: 'Trộn đề trắc nghiệm',
  description: 'Đảo câu, đảo đáp án thành nhiều mã đề, kèm bảng đáp án.',
  icon: Shuffle,
  group: 'de-kiem-tra',
  grades: ['thcs-thpt'],
  subjects: ['chung'],
  mode: 'print',
  keywords: ['mã đề', 'đảo đề', 'đề thi', 'đáp án'],
  phase: 2,
  access: 'pro',
};

export default meta;
