import type { Grade, Subject, ToolGroup } from './types';

/** Thứ tự trong mảng là thứ tự hiện trên menu và chip lọc. */
export const GROUPS: { id: ToolGroup; label: string }[] = [
  { id: 'phieu-bai-tap', label: 'Phiếu bài tập' },
  { id: 'de-kiem-tra', label: 'Đề và kiểm tra' },
  { id: 'tro-choi', label: 'Trò chơi và ô chữ' },
  { id: 'giay-tap-viet', label: 'Giấy và tập viết' },
  { id: 'quan-ly-lop', label: 'Quản lý lớp học' },
  { id: 'the-bang', label: 'Thẻ, bảng và khen thưởng' },
  { id: 'to-mau-ve', label: 'Tô màu và vẽ' },
  { id: 'tien-ich', label: 'PDF, ảnh, QR' },
];

export const SUBJECTS: { id: Subject; label: string }[] = [
  { id: 'toan', label: 'Toán' },
  { id: 'tieng-viet', label: 'Tiếng Việt' },
  { id: 'tieng-anh', label: 'Tiếng Anh' },
  { id: 'am-nhac', label: 'Âm nhạc' },
  { id: 'chung', label: 'Chung' },
];

export const GRADES: { id: Grade; label: string; path: string }[] = [
  { id: 1, label: 'Lớp 1', path: '/lop-1' },
  { id: 2, label: 'Lớp 2', path: '/lop-2' },
  { id: 3, label: 'Lớp 3', path: '/lop-3' },
  { id: 4, label: 'Lớp 4', path: '/lop-4' },
  { id: 5, label: 'Lớp 5', path: '/lop-5' },
  { id: 'thcs-thpt', label: 'THCS/THPT', path: '/thcs-thpt' },
];

export const groupLabel = (id: ToolGroup) => GROUPS.find((g) => g.id === id)!.label;

export const subjectLabel = (id: Subject) => SUBJECTS.find((s) => s.id === id)!.label;

export const isToolGroup = (value: string): value is ToolGroup =>
  GROUPS.some((g) => g.id === value);

/** Gom nhãn lớp liền nhau: [1,2,3] thành "Lớp 1–3". */
export function formatGrades(grades: Grade[]): string[] {
  const numbers = grades.filter((g): g is Exclude<Grade, 'thcs-thpt'> => g !== 'thcs-thpt').sort();
  const ranges: [number, number][] = [];
  for (const n of numbers) {
    const last = ranges[ranges.length - 1];
    if (last && n === last[1] + 1) last[1] = n;
    else ranges.push([n, n]);
  }
  const labels = ranges.map(([a, b]) => (a === b ? `Lớp ${a}` : `Lớp ${a}–${b}`));
  if (grades.includes('thcs-thpt')) labels.push('THCS/THPT');
  return labels;
}
