import type { PrintFontId } from '@/core/print/fonts';
import { MAX_STUDENTS, parseStudentList } from '@/core/studentList';

/** Tùy chọn chung của mọi công cụ in (PRD 4.0). Trải vào mặc định của từng công cụ. */
export const COMMON_DEFAULTS = {
  title: '',
  school: '',
  showNameLine: true,
  students: '',
  copies: 1,
  font: 'be-vietnam-pro' as PrintFontId,
  largeText: false,
  answerKey: true,
  seed: 100001,
};

export type CommonOptions = typeof COMMON_DEFAULTS;

/**
 * Danh sách phiếu cần in: có danh sách học sinh thì mỗi em một phiếu in sẵn tên,
 * không thì in `copies` phiếu để trống tên.
 */
export function sheetNames(options: Pick<CommonOptions, 'students' | 'copies'>) {
  const students: (string | undefined)[] = parseStudentList(options.students);
  if (students.length) return students.slice(0, MAX_STUDENTS);
  const copies = Math.min(MAX_STUDENTS, Math.max(1, Math.floor(options.copies) || 1));
  return Array.from({ length: copies }, (): string | undefined => undefined);
}
