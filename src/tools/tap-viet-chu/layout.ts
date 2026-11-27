/** Chia nội dung thành dòng chữ trên lưới ô và chia trang. Mọi kích thước tính bằng mm. */
import { A4, packByHeight } from '@/core/print/paper';
import { MAX_STUDENTS } from '@/core/studentList';
import { X_HEIGHT, type Shape } from './handwriting';
import type { Settings } from './options';

export const MARGIN_MM = 10;
export const MAX_LINES = 100;
export const MAX_LINE_LENGTH = 200;
/** Số trang nội dung tối đa của một phiếu. */
export const MAX_PAGES = 20;
/** Tổng số trang tối đa khi in theo danh sách học sinh. */
export const MAX_TOTAL_PAGES = 120;

/** Phần mực lấn dưới ngưỡng này (đơn vị: ô) thì không tính thêm một ô. */
const SLACK = 0.2;

export type Row = {
  /** Chiều cao dòng, tính bằng số ô. */
  cells: number;
  /** Đường chân chữ cách mép trên của dòng bao nhiêu ô. */
  baseline: number;
  text: string;
  /** Mép trái (mm, từ mép trái vùng kẻ) của từng chữ mẫu; rỗng là dòng để tự viết. */
  at: number[];
  /** Chữ đầu dòng in đậm làm mẫu. */
  model: boolean;
};

type Measure = (text: string) => Shape;

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

/** Chiều cao chừa cho đầu phiếu, ước lượng dư để không đè lên vùng kẻ. */
export function headerHeight({ title, school, showNameLine }: Settings) {
  const titleLines = Math.ceil((title.length * 3.8) / (A4.portrait.width - 2 * MARGIN_MM));
  return (school ? 6 : 0) + (showNameLine ? 9 : 0) + 3 + titleLines * 9 + 5;
}

/** Vùng kẻ: số ô trọn vẹn vừa trong trang. */
export function grid(settings: Settings) {
  const header = headerHeight(settings);
  const columns = Math.floor((A4.portrait.width - 2 * MARGIN_MM) / settings.cell);
  const rows = Math.floor((A4.portrait.height - 2 * MARGIN_MM - header) / settings.cell);
  return { header, columns, rows, width: columns * settings.cell, height: rows * settings.cell };
}

/** Số mm trên một đơn vị font. */
export const scaleOf = ({ size, cell }: Settings) => (size * cell) / X_HEIGHT;

export function buildRows(lines: string[], settings: Settings, measure: Measure): Row[] {
  const { size, cell } = settings;
  const { width } = grid(settings);
  const scale = scaleOf(settings);
  const indent = cell;
  const right = width - 0.5;
  const widthOf = (text: string) => {
    const { minX, maxX } = measure(text);
    return (maxX - minX) * scale;
  };
  const toCells = (units: number) => Math.max(0, Math.ceil(units * size - SLACK));
  // Khoảng cách giữa hai chữ mẫu trên cùng một dòng.
  const gap = Math.max(cell, size * cell * 0.8);

  return lines.flatMap((line) =>
    wrap(line, (text) => indent + widthOf(text) <= right).flatMap((text) => {
      const shape = measure(text);
      if (shape.maxX <= shape.minX) return [];
      const above = Math.max(toCells(shape.rise), toCells(1));
      const below = toCells(shape.drop);
      // Một ô trống phía trên để dòng sau không dính dòng trước.
      const row = { cells: 1 + above + below, baseline: 1 + above, text };

      const at = [indent];
      if (settings.repeat) {
        const span = widthOf(text);
        for (;;) {
          const next = Math.ceil((at[at.length - 1]! + span + gap) / cell) * cell;
          if (next + span > right) break;
          at.push(next);
        }
      }
      // Câu dài chỉ vừa một lần mỗi dòng: chỉ dòng đầu là mẫu đậm, các dòng sau để tô.
      const model = (index: number) => settings.boldFirst && (at.length > 1 || index === 0);
      return [
        ...Array.from({ length: settings.rows }, (_, i): Row => ({ ...row, at, model: model(i) })),
        ...Array.from({ length: settings.blanks }, (): Row => ({ ...row, at: [], model: false })),
      ];
    }),
  );
}

/** Chia trang, không cắt dòng nào làm đôi. `dropped` là số dòng vượt giới hạn trang. */
export function layoutPages(rows: Row[], settings: Settings) {
  const all = packByHeight(rows, (row) => row.cells, grid(settings).rows);
  const pages = all.slice(0, MAX_PAGES);
  const dropped = all.slice(MAX_PAGES).reduce((sum, page) => sum + page.length, 0);
  return { pages, dropped };
}

/** Số học sinh in được để không vượt tổng số trang cho phép. */
export const studentLimit = (pagesPerSheet: number) =>
  Math.min(MAX_STUDENTS, Math.max(1, Math.floor(MAX_TOTAL_PAGES / Math.max(1, pagesPerSheet))));
