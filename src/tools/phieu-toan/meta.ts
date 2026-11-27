import { Calculator } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'phieu-toan',
  name: 'Phiếu toán tự sinh (lớp 1–3)',
  description: 'Cộng, trừ, nhân, chia sinh ngẫu nhiên, kèm đáp án.',
  icon: Calculator,
  group: 'phieu-bai-tap',
  grades: [1, 2, 3],
  subjects: ['toan'],
  mode: 'print',
  keywords: ['phép cộng', 'phép trừ', 'bảng cửu chương', 'nhân chia', 'so sánh', 'đặt tính'],
  isNew: true,
  phase: 1,
  access: 'guest',
  guide: [
    'Bấm một nút ở mục “Chọn nhanh theo lớp”, hoặc tự chọn phép tính, dạng bài và phạm vi.',
    'Chỉnh số câu, số cột, font và cỡ chữ rồi xem trước trang A4.',
    'Muốn mỗi em một phiếu thì dán danh sách tên học sinh, mỗi dòng một tên.',
    'Bấm “Đổi bộ khác” để lấy đề mới. Ghi lại mã đề nếu cần in lại đúng bộ đó.',
    'Bấm “In ngay” (khổ A4, tỉ lệ 100%) hoặc “Tải PDF”.',
  ],
  faq: [
    {
      question: 'Phép trừ có ra số âm, phép chia có dư không?',
      answer:
        'Không. Số bị trừ luôn lớn hơn hoặc bằng số trừ, phép chia luôn chia hết và một phiếu không có hai câu giống nhau.',
    },
    {
      question: 'Làm sao in lại đúng bộ đề đã phát?',
      answer:
        'Mở mục “Mã đề”, nhập lại mã in trên trang đáp án và giữ nguyên các tùy chọn khác.',
    },
    {
      question: 'Vì sao phiếu có ít câu hơn số đã chọn?',
      answer:
        'Phạm vi nhỏ chỉ có một số lượng phép tính nhất định. Ví dụ nhân trong phạm vi 10 chỉ có vài câu, công cụ không lặp lại câu để đủ số.',
    },
  ],
};

export default meta;
