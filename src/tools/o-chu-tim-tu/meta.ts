import { TextSearch } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'o-chu-tim-tu',
  name: 'Ô chữ và tìm từ',
  description: 'Tạo ô chữ có gợi ý hoặc bảng tìm từ ẩn.',
  icon: TextSearch,
  group: 'tro-choi',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['chung', 'tieng-viet', 'tieng-anh'],
  mode: 'print',
  keywords: ['ô chữ', 'tìm từ', 'crossword', 'word search'],
  phase: 1,
  access: 'guest',
};

export default meta;
