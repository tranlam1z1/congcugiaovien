import { PaintBucket } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'to-mau-theo-phep-tinh',
  name: 'Tô màu theo phép tính',
  description: 'Làm phép tính để biết tô màu nào, kèm tranh đáp án.',
  icon: PaintBucket,
  group: 'to-mau-ve',
  grades: [1, 2, 3],
  subjects: ['toan'],
  mode: 'print',
  keywords: ['tranh tô màu', 'cộng trừ', 'nhân chia', 'trò chơi toán'],
  isNew: true,
  phase: 1,
  access: 'guest',
  guide: [
    'Chọn phép tính và phạm vi phù hợp với lớp.',
    'Chọn một hình, hoặc để “Mỗi trang một hình khác”, rồi chọn số phép tính mỗi trang.',
    'Muốn mỗi em một phiếu thì dán danh sách tên học sinh, mỗi dòng một tên.',
    'Bấm “Đổi bộ khác” để lấy phép tính mới.',
    'Bấm “In ngay” (khổ A4, tỉ lệ 100%) hoặc “Tải PDF”. Tranh đáp án in màu ở các trang cuối.',
  ],
  faq: [
    {
      question: 'Có cần máy in màu không?',
      answer:
        'Không. Phiếu của học sinh chỉ có ô và phép tính, bảng màu ghi cả tên màu. Trang đáp án nên xem trên màn hình hoặc in màu.',
    },
    {
      question: 'Vì sao có phép tính xuất hiện nhiều lần?',
      answer:
        'Mỗi màu ứng với một kết quả. Khi phạm vi nhỏ, số cách viết ra kết quả đó ít hơn số ô cùng màu nên phải lặp lại. Chọn phạm vi 100 để ít lặp hơn.',
    },
    {
      question: 'Phép trừ và phép chia có gì cần lưu ý?',
      answer:
        'Phép trừ không ra số âm, phép chia luôn chia hết. Phép nhân và chia theo bảng, các số từ 1 đến 10.',
    },
  ],
};

export default meta;
