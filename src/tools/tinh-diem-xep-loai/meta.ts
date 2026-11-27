import { Percent } from 'lucide-react';
import type { ToolMeta } from '@/core/types';

const meta: ToolMeta = {
  slug: 'tinh-diem-xep-loai',
  name: 'Tính điểm và xếp loại (TT22)',
  description: 'Tính điểm trung bình môn và gợi ý xếp loại học lực.',
  icon: Percent,
  group: 'de-kiem-tra',
  grades: ['thcs-thpt'],
  subjects: ['chung'],
  mode: 'screen',
  keywords: ['thông tư 22', 'điểm trung bình', 'học lực', 'tính điểm'],
  isNew: true,
  phase: 1,
  access: 'guest',
  guide: [
    'Chọn “Điểm học kỳ” hoặc “Điểm cả năm”, rồi chọn mẫu môn THCS hay THPT.',
    'Sửa tên môn, thêm hoặc bớt môn cho đúng lớp. Chọn môn nào đánh giá bằng nhận xét.',
    'Nhập điểm. Điểm thường xuyên cách nhau bằng dấu cách, ví dụ: 8 7,5 9.',
    'Xem gợi ý xếp loại và bấm “Chép kết quả” để dán vào nơi khác.',
  ],
  faq: [
    {
      question: 'Điểm trung bình môn tính thế nào?',
      answer:
        'Học kỳ: (tổng điểm thường xuyên + 2 × giữa kỳ + 3 × cuối kỳ) chia cho (số điểm thường xuyên + 5). Cả năm: (học kỳ I + 2 × học kỳ II) chia 3. Làm tròn một chữ số thập phân.',
    },
    {
      question: 'Bốn mức xếp loại cần điều kiện gì?',
      answer:
        'Tốt: môn nhận xét đều Đạt, môn chấm điểm đều từ 6,5 và ít nhất 6 môn từ 8,0. Khá: môn nhận xét đều Đạt, môn chấm điểm đều từ 5,0 và ít nhất 6 môn từ 6,5. Đạt: nhiều nhất 1 môn nhận xét Chưa đạt, ít nhất 6 môn từ 5,0 và không môn nào dưới 3,5. Còn lại là Chưa đạt.',
    },
    {
      question: 'Khi nào được điều chỉnh mức xếp loại?',
      answer:
        'Khi mức xếp loại bị thấp từ hai mức trở lên so với Tốt hoặc Khá chỉ vì kết quả của một môn duy nhất thì được nâng lên mức liền kề (khoản 3 Điều 9 Thông tư 22/2021).',
    },
    {
      question: 'Công cụ này dùng cho tiểu học được không?',
      answer: 'Không. Tiểu học đánh giá theo Thông tư 27/2020, không xếp loại theo cách này.',
    },
  ],
};

export default meta;
