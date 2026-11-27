import { Grid2x2 } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'sudoku',
  name: 'Sudoku',
  description: 'Sudoku 4×4, 6×6, 9×9 dùng số hoặc hình.',
  icon: Grid2x2,
  group: 'tro-choi',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['toan'],
  mode: 'print',
  keywords: ['câu đố', 'logic'],
  phase: 3,
  access: 'free',
};

export default meta;
