import { Timer } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'cong-cu-tren-lop',
  name: 'Công cụ trên lớp',
  description: 'Vòng quay gọi tên, đếm ngược, đo tiếng ồn, bốc thăm.',
  icon: Timer,
  group: 'quan-ly-lop',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['chung'],
  mode: 'present',
  keywords: ['vòng quay', 'gọi tên', 'đồng hồ đếm ngược', 'tiếng ồn', 'bốc thăm', 'ngẫu nhiên'],
  isNew: true,
  phase: 1,
  access: 'guest',
  guide: [
    'Chọn một công cụ: Vòng quay gọi tên, Đếm ngược, Đo tiếng ồn hoặc Bốc thăm.',
    'Chỉnh ở cột “Tùy chọn”. Vòng quay dùng danh sách lớp, nhập một lần là dùng lại được.',
    'Bấm “Toàn màn hình” để chiếu lên máy chiếu hoặc tivi.',
    'Khi toàn màn hình, bấm phím Space, mũi tên phải hoặc bút trình chiếu để quay, bắt đầu, tạm dừng hay bốc thăm.',
    'Đồng hồ đếm ngược vẫn chạy khi bạn chuyển sang công cụ khác trong trang này.',
  ],
  faq: [
    {
      question: 'Vòng quay có gọi một em hai lần không?',
      answer:
        'Không, cho tới khi bạn bấm “Gọi lại từ đầu”. Mỗi em còn lại có cơ hội như nhau. Danh sách em đã gọi được nhớ trên máy, tải lại trang vẫn còn.',
    },
    {
      question: 'Đo tiếng ồn có ghi âm lớp học không?',
      answer:
        'Không. Công cụ chỉ đọc độ to của âm thanh ngay trên máy để bật đèn xanh, vàng, đỏ; không ghi, không lưu và không gửi đi. Rời mục này là micro tắt.',
    },
    {
      question: 'Chuông hết giờ không kêu thì làm sao?',
      answer:
        'Kiểm tra ô “Chuông khi hết giờ” đang bật, âm lượng máy và loa của tivi. Giữ trang đang mở trong lúc đếm.',
    },
  ],
};

export default meta;
