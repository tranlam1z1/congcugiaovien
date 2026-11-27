/** Chia bảng nhận xét thành các trang A4. Kích thước tính bằng mm. */
import { A4, packByHeight } from '@/core/print/paper';
import { sheetHeaderHeight } from '@/core/print/SheetHeader';
import { charWidth, textWidthEm } from '@/core/print/textWidth';
import type { Line } from './state';

export const MARGIN_MM = 10;
export const WIDTH = A4.portrait.width - 2 * MARGIN_MM;
/** Bề rộng các cột: STT, họ tên, học tập, phẩm chất, nhận xét. */
export const COLUMNS = [12, 38, 24, 24, WIDTH - 98] as const;
export const HEADER_ROW_MM = 9;
export const NOTE_MM = 9;
/** Chiều cao một dòng chữ 11pt trong bảng. */
export const LINE_MM = 5;
const PADDING_MM = 3;

/** Một em (đơn vị đo của font) ở cỡ 11pt. */
const EM_MM = (11 * 25.4) / 72;

const textWidth = (text: string) => textWidthEm(text) * EM_MM;

/** Số dòng ước lượng dư khi chữ tự xuống dòng theo từ trong cột rộng `width` mm. */
export function wrappedLines(text: string, width: number) {
  const room = Math.max(EM_MM * 1.25, width - PADDING_MM);
  const space = textWidth(' ');
  let lines = 0;
  for (const paragraph of text.normalize('NFC').split('\n')) {
    let used = 0;
    lines++;
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const length = textWidth(word);
      if (used && used + space + length <= room) {
        used += space + length;
        continue;
      }
      if (used) lines++;
      used = 0;
      if (length <= room) {
        used = length;
        continue;
      }
      // Từ dài hơn cả dòng bị cắt theo ký tự.
      for (const char of word) {
        const next = charWidth(char) * EM_MM;
        if (used + next > room) {
          lines++;
          used = 0;
        }
        used += next;
      }
    }
  }
  return lines;
}

export type PrintRow = { line: Line; index: number; height: number };

export function paginateLines(lines: Line[], title: string, school: string) {
  const header = sheetHeaderHeight({ title, school, showNameLine: false }, WIDTH);
  const space = A4.portrait.height - 2 * MARGIN_MM - header - HEADER_ROW_MM - NOTE_MM;
  const rows: PrintRow[] = lines.map((line, index) => {
    const count = Math.max(
      wrappedLines(line.comment, COLUMNS[4]),
      wrappedLines(line.name, COLUMNS[1]),
      // "Chưa hoàn thành" xuống hai dòng.
      2,
    );
    // Một ô không cao quá cả trang, kể cả khi sửa tay toàn dòng trống.
    return { line, index, height: Math.min(space, count * LINE_MM + PADDING_MM) };
  });
  return { header, space, pages: packByHeight(rows, (row) => row.height, space) };
}
