/** Đọc nội dung nhập, ngắt dòng và giới hạn số trang: dùng chung cho các công cụ tập viết. */
import { MAX_STUDENTS } from '@/core/studentList';

export const MAX_LINES = 100;
export const MAX_LINE_LENGTH = 200;
/** Số trang nội dung tối đa của một phiếu. */
export const MAX_PAGES = 20;
/** Tổng số trang tối đa khi in theo danh sách học sinh. */
export const MAX_TOTAL_PAGES = 120;

export function parseLines(text: string): string[] {
  return text
    .normalize('NFC')
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim().slice(0, MAX_LINE_LENGTH).trim())
    .filter(Boolean)
    .slice(0, MAX_LINES);
}

/** Ngắt câu dài theo từ; từ dài hơn cả dòng thì ngắt theo ký tự. */
export function wrap(line: string, fits: (text: string) => boolean): string[] {
  const pieces: string[] = [];
  let current = '';
  for (const word of line.split(' ')) {
    const joined = current ? `${current} ${word}` : word;
    if (fits(joined)) {
      current = joined;
      continue;
    }
    if (current) pieces.push(current);
    current = '';
    if (fits(word)) {
      current = word;
      continue;
    }
    for (const char of word) {
      if (current && !fits(current + char)) {
        pieces.push(current);
        current = '';
      }
      current += char;
    }
  }
  if (current) pieces.push(current);
  return pieces;
}

/** Số học sinh in được để không vượt tổng số trang cho phép. */
export const studentLimit = (pagesPerSheet: number) =>
  Math.min(MAX_STUDENTS, Math.max(1, Math.floor(MAX_TOTAL_PAGES / Math.max(1, pagesPerSheet))));
