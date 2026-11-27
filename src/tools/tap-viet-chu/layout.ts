/** Chia nội dung thành dòng chữ trên lưới ô và chia trang. Mọi kích thước tính bằng mm. */
import { X_HEIGHT, type Shape } from '@/core/handwriting/cursive';
import { MAX_PAGES, wrap } from '@/core/handwriting/lines';
import { A4, packByHeight } from '@/core/print/paper';
import { sheetHeaderHeight } from '@/core/print/SheetHeader';
import type { Settings } from './options';

export const MARGIN_MM = 10;

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

/** Vùng kẻ: số ô trọn vẹn vừa trong trang. */
export function grid(settings: Settings) {
  const header = sheetHeaderHeight(settings, A4.portrait.width - 2 * MARGIN_MM);
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
