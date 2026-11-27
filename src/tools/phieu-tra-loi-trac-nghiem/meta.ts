import { CircleDot } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'phieu-tra-loi-trac-nghiem',
  name: 'Phiếu trả lời trắc nghiệm',
  description: 'Phiếu tô ô tròn có mã đề, số báo danh.',
  icon: CircleDot,
  group: 'de-kiem-tra',
  grades: ['thcs-thpt'],
  subjects: ['chung'],
  mode: 'print',
  keywords: ['phiếu tô', 'đáp án', 'số báo danh', 'đúng sai', 'thi'],
  phase: 2,
  access: 'free',
};

export default meta;
