import { GalleryHorizontalEnd } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'the-tu-vung-tieng-anh',
  name: 'Flashcard tiếng Anh',
  description: 'Thẻ từ theo chủ đề, có phiên âm, nghĩa và phát âm.',
  icon: GalleryHorizontalEnd,
  group: 'the-bang',
  grades: [1, 2, 3, 4, 5],
  subjects: ['tieng-anh'],
  mode: 'both',
  keywords: ['flashcard', 'thẻ từ vựng', 'english', 'phát âm'],
  phase: 1,
  access: 'free',
};

export default meta;
