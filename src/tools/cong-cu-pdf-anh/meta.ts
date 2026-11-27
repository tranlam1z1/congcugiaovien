import { Files } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'cong-cu-pdf-anh',
  name: 'Bộ công cụ PDF và ảnh',
  description: 'Ảnh sang PDF, ghép, tách, xoay, sắp xếp trang.',
  icon: Files,
  group: 'tien-ich',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['chung'],
  mode: 'screen',
  keywords: ['ghép pdf', 'tách pdf', 'xoay pdf', 'ảnh sang pdf', 'nối file'],
  isNew: true,
  phase: 1,
  access: 'free',
  guide: [
    'Chọn việc cần làm: ảnh sang PDF, ghép, tách, hoặc xoay, xoá, sắp xếp trang.',
    'Bấm chọn file hoặc kéo file thả vào khung.',
    'Đổi thứ tự bằng cách kéo thả hoặc bấm mũi tên; chỉnh khổ trang, khoảng trang nếu cần.',
    'Bấm nút xử lý; file kết quả tự tải về máy.',
  ],
  faq: [
    {
      question: 'File có bị gửi lên mạng không?',
      answer:
        'Không. File được đọc và xử lý ngay trong trình duyệt trên máy bạn, phù hợp cả với đề kiểm tra và danh sách học sinh.',
    },
    {
      question: 'File lớn có xử lý được không?',
      answer:
        'Nên dùng tổng dung lượng dưới khoảng 200 MB mỗi lượt. Máy ít bộ nhớ hoặc điện thoại thì chia thành nhiều lượt.',
    },
    {
      question: 'Vì sao một số file PDF không mở được?',
      answer:
        'File có mật khẩu hoặc bị hỏng thì công cụ không đọc được. Hãy gỡ mật khẩu hoặc xuất lại file rồi thử lại.',
    },
  ],
};

export default meta;
