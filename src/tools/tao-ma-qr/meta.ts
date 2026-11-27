import { QrCode } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'tao-ma-qr',
  name: 'Tạo mã QR',
  description: 'Mã QR cho link, Wi-Fi, văn bản, in hàng loạt.',
  icon: QrCode,
  group: 'tien-ich',
  grades: [1, 2, 3, 4, 5, 'thcs-thpt'],
  subjects: ['chung'],
  mode: 'print',
  keywords: ['qr code', 'wifi', 'liên kết'],
  isNew: true,
  phase: 1,
  access: 'guest',
  guide: [
    'Chọn một mã (link, văn bản, Wi-Fi, email, số điện thoại) hoặc nhiều mã mỗi mã một nhãn.',
    'Chọn số mã mỗi trang, màu sắc và logo nếu cần.',
    'Bấm “Tải PNG” hoặc “Tải SVG” để lấy một mã, “In ngay” hoặc “Tải PDF” để in cả trang.',
    'Quét thử bằng điện thoại trước khi in nhiều.',
  ],
  faq: [
    {
      question: 'Mã QR có hết hạn không?',
      answer:
        'Không. Nội dung nằm ngay trong mã, không qua máy chủ trung gian. Nhưng nếu trang web ở đầu link bị xoá thì mã không mở được.',
    },
    {
      question: 'Vì sao thêm logo thì mã dày hơn?',
      answer:
        'Logo che một phần mã nên công cụ dùng mức sửa lỗi cao nhất để máy vẫn đọc được.',
    },
    {
      question: 'Nội dung và mật khẩu Wi-Fi có bị gửi đi không?',
      answer: 'Không. Mã được tạo ngay trên máy của bạn.',
    },
  ],
};

export default meta;
