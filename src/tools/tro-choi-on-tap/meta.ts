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
  isNew: true,
  phase: 1,
  access: 'free',
  guide: [
    'Nhập câu hỏi ở mục “Câu hỏi” (hoặc dùng câu mẫu), các câu cách nhau một dòng trống.',
    'Hộp quà bí mật: chọn số đội và điểm, mỗi đội lần lượt mở hộp; bấm “Đúng” hoặc “Sai” để ghi điểm.',
    'Rung chuông vàng: dán danh sách lớp, bấm đếm ngược, lật đáp án rồi bấm tên bạn trả lời sai.',
    'Bấm “Toàn màn hình” để chiếu lên tivi. Phím Space hoặc bút trình chiếu bấm bước kế tiếp.',
  ],
  faq: [
    {
      question: 'Lưu bộ câu hỏi để dùng lại thế nào?',
      answer:
        'Công cụ tự nhớ bộ câu hỏi trên máy này. Muốn giữ nhiều bộ hoặc chuyển sang máy khác thì bấm “Lưu file .txt”, sau đó “Mở file .txt”.',
    },
    {
      question: 'Lỡ tải lại trang có mất điểm không?',
      answer:
        'Không. Điểm và các hộp đã mở được nhớ trên máy. Ván mới chỉ bắt đầu khi bạn bấm “Ván mới” hoặc đổi câu hỏi, số đội, số hộp bất ngờ.',
    },
    {
      question: 'Câu hỏi và tên học sinh có bị gửi lên mạng không?',
      answer: 'Không. Mọi thứ chỉ lưu và chạy trên máy của bạn.',
    },
  ],
};

export default meta;
