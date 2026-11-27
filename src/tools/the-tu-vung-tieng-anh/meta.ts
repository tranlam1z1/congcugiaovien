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
  isNew: true,
  phase: 1,
  access: 'free',
  guide: [
    'Chọn một chủ đề theo lớp, hoặc tự nhập mỗi dòng một từ: từ | /phiên âm/ | nghĩa.',
    'Chọn mặt trước hiện gì và số thẻ mỗi trang.',
    'Bấm “In ngay” hoặc “Tải PDF”. In hai mặt thì chọn “Lật theo cạnh dài”, rồi cắt theo nét đứt.',
    'Bấm “Toàn màn hình” để chiếu: phím Space hoặc bút trình chiếu lật thẻ rồi sang thẻ kế, nút “Nghe” đọc từ.',
  ],
  faq: [
    {
      question: 'Bấm “Nghe” mà không có tiếng?',
      answer:
        'Công cụ dùng giọng đọc có sẵn trên máy. Hãy kiểm tra loa và thử trình duyệt Chrome hoặc Edge; một số máy phải cài thêm giọng tiếng Anh trong cài đặt hệ điều hành.',
    },
    {
      question: 'Mặt sau bị lệch thẻ khi in hai mặt?',
      answer:
        'Chọn “Lật theo cạnh dài” và tỉ lệ 100% trong hộp thoại in. Máy in thường lệch một vài mm, nên in thử một tờ trước.',
    },
    {
      question: 'Phiên âm theo giọng nào?',
      answer:
        'Các chủ đề có sẵn ghi phiên âm giọng Anh - Anh. Bạn sửa được trực tiếp trong danh sách thẻ.',
    },
  ],
};

export default meta;
