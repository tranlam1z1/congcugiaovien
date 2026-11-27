import { Gamepad2 } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'tro-choi-on-tap',
  name: 'Trò chơi ôn tập trình chiếu',
  description: 'Hộp quà bí mật và Rung chuông vàng từ câu hỏi của bạn.',
  icon: Gamepad2,
  group: 'tro-choi',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['chung'],
  mode: 'present',
  keywords: ['hộp quà', 'rung chuông vàng', 'trắc nghiệm', 'quiz', 'trò chơi'],
  phase: 1,
  access: 'free',
};

export default meta;
