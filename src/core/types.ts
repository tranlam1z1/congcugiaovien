import type { LucideIcon } from 'lucide-react';

export type ToolGroup =
  | 'phieu-bai-tap'
  | 'de-kiem-tra'
  | 'tro-choi'
  | 'giay-tap-viet'
  | 'quan-ly-lop'
  | 'the-bang'
  | 'to-mau-ve'
  | 'tien-ich';

export type Grade = 1 | 2 | 3 | 4 | 5 | 'thcs-thpt';

export type Subject = 'toan' | 'tieng-viet' | 'tieng-anh' | 'am-nhac' | 'chung';

/** 'screen': dùng ngay trên màn hình, không in cũng không trình chiếu (vd tính điểm). */
export type ToolMode = 'print' | 'present' | 'both' | 'screen';

export type Access = 'guest' | 'free' | 'pro';

export type Phase = 1 | 2 | 3 | 4;

/** Nội dung file `src/tools/<slug>/meta.ts`. */
export type ToolMeta = {
  slug: string;
  name: string;
  /** Mô tả một dòng trên thẻ công cụ và thẻ meta description. */
  description: string;
  icon: LucideIcon;
  group: ToolGroup;
  grades: Grade[];
  subjects: Subject[];
  mode: ToolMode;
  /** Phục vụ tìm kiếm không dấu. */
  keywords: string[];
  isNew?: boolean;
  phase: Phase;
  /** Giá trị mặc định; về sau cấu hình admin đã xuất bản được ghi đè. */
  access: Access;
  /** Hướng dẫn ngắn hiện dưới công cụ. */
  guide?: string[];
  faq?: { question: string; answer: string }[];
};
