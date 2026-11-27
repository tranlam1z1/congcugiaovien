/** Chia nội dung thành dòng 4 kẻ và chia trang. Mọi kích thước tính bằng mm. */
import { MAX_PAGES, wrap } from '@/core/handwriting/lines';
import { A4, paginate } from '@/core/print/paper';
import { sheetHeaderHeight } from '@/core/print/SheetHeader';
import type { LucideIcon } from 'lucide-react';
import type { Settings } from './options';
import { pictureFor } from '@/core/vocab/pictures';
import type { Writer } from './writer';

export const MARGIN_MM = 10;
export const AREA_WIDTH = A4.portrait.width - 2 * MARGIN_MM;
/** Khoảng hở từ đầu dòng kẻ tới chữ đầu tiên. */
const INDENT = 2;

export type Row = {
  text: string;
  /** Mép trái của dòng kẻ; lớn hơn 0 khi chừa cột hình. */
  start: number;
  /** Mép trái của từng chữ mẫu; rỗng là dòng để tự viết. */
  at: number[];
  /** Chữ đầu dòng in đậm làm mẫu. */
  model: boolean;
  /** Hình vẽ ở cột trái của dòng này. */
  picture?: LucideIcon;
};

export function geometry(settings: Settings, writer: Writer) {
  const header = sheetHeaderHeight(settings, AREA_WIDTH);
  const height = A4.portrait.height - 2 * MARGIN_MM - header;
  /** Từ dòng kẻ trên cùng tới dòng dưới cùng. */
  const ruled = (writer.top + writer.bottom) * settings.size;
  const gap = Math.max(4, settings.size * 0.8);
  const perPage = Math.max(1, Math.floor((height + gap) / (ruled + gap)));
  const picture = Math.min(ruled, 22);
  return { header, height, ruled, gap, pitch: ruled + gap, perPage, picture };
}

/** Số mm trên một đơn vị đường nét. */
export const scaleOf = (settings: Settings, writer: Writer) => settings.size / writer.unit;

export function buildRows(lines: string[], settings: Settings, writer: Writer): Row[] {
  const { picture } = geometry(settings, writer);
  const scale = scaleOf(settings, writer);
  const right = AREA_WIDTH - 1;
  const widthOf = (text: string) => {
    const { minX, maxX, commands } = writer.shape(text);
    return commands.length ? (maxX - minX) * scale : -1;
  };
  // Khoảng cách giữa hai chữ mẫu trên cùng một dòng.
  const spacing = Math.max(5, settings.size * 1.2);

  return lines.flatMap((line) => {
    const image = settings.pictures ? pictureFor(line) : undefined;
    const start = image ? picture + 4 : 0;
    const first = start + INDENT;
    return wrap(line, (text) => first + widthOf(text) <= right).flatMap((text, piece) => {
      const width = widthOf(text);
      if (width < 0) return [];
      const at = [first];
      if (settings.repeat) {
        for (;;) {
          const next = at[at.length - 1]! + width + spacing;
          if (next + width > right) break;
          at.push(next);
        }
      }
      // Câu dài chỉ vừa một lần mỗi dòng: chỉ dòng đầu là mẫu đậm, các dòng sau để tô.
      const model = (index: number) => settings.boldFirst && (at.length > 1 || index === 0);
      return [
        ...Array.from(
          { length: settings.rows },
          (_, i): Row => ({
            text,
            start,
            at,
            model: model(i),
            ...(image && piece === 0 && i === 0 ? { picture: image } : {}),
          }),
        ),
        ...Array.from(
          { length: settings.blanks },
          (): Row => ({ text, start, at: [], model: false }),
        ),
      ];
    });
  });
}

/** Chia trang. `dropped` là số dòng vượt giới hạn trang. */
export function layoutPages(rows: Row[], settings: Settings, writer: Writer) {
  const all = paginate(rows, geometry(settings, writer).perPage);
  const pages = all.slice(0, MAX_PAGES);
  return { pages, dropped: Math.max(0, rows.length - pages.flat().length) };
}
