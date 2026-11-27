/** Cỡ ô và chia trang (mm) để lưới và gợi ý không bị cắt. */
import type { PrintFont } from '@/core/print/fonts';
import { A4, DEFAULT_MARGIN_MM, MM_PER_PX, packByHeight, paginate } from '@/core/print/paper';
import type { Clue, Crossword, WordSearch } from './generator';

export const CONTENT_WIDTH = A4.portrait.width - 2 * DEFAULT_MARGIN_MM;
const CONTENT_HEIGHT = A4.portrait.height - 2 * DEFAULT_MARGIN_MM;

/** [chữ thường, chữ to] */
const FONT_PT = [13, 17];
const HEADER_MM = [54, 68];
const HEADER_MM_PER_LEADING = 40;
const INSTRUCTION_MM = [10, 13];
/** Đầu trang tiếp theo. */
const CONTINUED_MM = 22;
export const GAP_MM = 6;
export const COLUMN_GAP_MM = 8;
export const CLUE_COLUMN_MM = (CONTENT_WIDTH - COLUMN_GAP_MM) / 2;
export const CLUE_GAP_MM = 1;
const CLUE_TITLE_MM = [8, 10];

export type TextStyle = { font: PrintFont; large: boolean };

const size = ({ large }: TextStyle) => (large ? 1 : 0);
const emMm = (style: TextStyle) => ((FONT_PT[size(style)]! * 96) / 72) * MM_PER_PX;
export const lineMm = (style: TextStyle) => emMm(style) * 1.5 * (style.font.leading ?? 1);

/** Bề rộng ước lượng dư (mm) của một đoạn chữ. */
export const textWidth = (chars: number, style: TextStyle) =>
  chars * style.font.digitWidth * 0.95 * emMm(style);

const contentHeight = (style: TextStyle) =>
  CONTENT_HEIGHT -
  HEADER_MM[size(style)]! -
  ((style.font.leading ?? 1) - 1) * HEADER_MM_PER_LEADING -
  INSTRUCTION_MM[size(style)]!;

const MIN_SEARCH_CELL = 6.5;
const MAX_SEARCH_CELL = 14;

export function layoutSearch(puzzle: WordSearch, showList: boolean, style: TextStyle) {
  const words = showList ? puzzle.words : [];
  // Chữ hoa rộng gần gấp đôi chữ thường, nhất là ở font viết tay.
  const longest = Math.max(
    1,
    ...words.map((w) => w.word.length + 0.8 * (w.word.match(/\p{Lu}/gu)?.length ?? 0)),
  );
  // Thêm chỗ cho ô vuông đánh dấu.
  const itemWidth = textWidth(longest, style) + 8;
  const columns = Math.max(
    1,
    Math.min(4, Math.floor((CONTENT_WIDTH + COLUMN_GAP_MM) / (itemWidth + COLUMN_GAP_MM))),
  );
  const rowHeight = lineMm(style);
  const listHeight = words.length ? Math.ceil(words.length / columns) * rowHeight + GAP_MM : 0;
  const height = contentHeight(style);
  const cell = Math.min(
    MAX_SEARCH_CELL,
    CONTENT_WIDTH / puzzle.size,
    Math.max(MIN_SEARCH_CELL, (height - listHeight) / puzzle.size),
  );
  const firstRows = Math.max(0, Math.floor((height - cell * puzzle.size - GAP_MM) / rowHeight));
  const first = words.slice(0, firstRows * columns);
  const rest = paginate(
    words.slice(first.length),
    Math.floor((CONTENT_HEIGHT - CONTINUED_MM) / rowHeight) * columns,
  );
  return { cell, columns, rowHeight, pages: [first, ...rest] };
}

const MIN_CROSS_CELL = 7;
const MAX_CROSS_CELL = 11;

/** Dấu cách không ngắt để "(6 ô)" luôn nằm cùng dòng. */
export const clueText = (clue: Clue) => `${clue.clue} (${clue.letters.length} ô)`;

export function clueHeight(clue: Clue, style: TextStyle) {
  // 12 mm cho số thứ tự; trừ hao chỗ ngắt dòng giữa các tiếng.
  const perLine = Math.max(8, Math.floor((CLUE_COLUMN_MM - 12) / textWidth(1, style)));
  return Math.ceil(clueText(clue).length / perLine) * lineMm(style) + CLUE_GAP_MM;
}

export function layoutCross(puzzle: Crossword, style: TextStyle) {
  const title = CLUE_TITLE_MM[size(style)]!;
  const columnHeight = (clues: Clue[]) =>
    clues.reduce((sum, c) => sum + clueHeight(c, style), title);
  const height = contentHeight(style);
  const clues = Math.max(columnHeight(puzzle.across), columnHeight(puzzle.down));
  const cell = Math.min(
    MAX_CROSS_CELL,
    CONTENT_WIDTH / Math.max(1, puzzle.columns),
    Math.max(MIN_CROSS_CELL, (height - clues - GAP_MM) / Math.max(1, puzzle.rows)),
  );
  const firstSpace = height - cell * puzzle.rows - GAP_MM - title;
  const nextSpace = CONTENT_HEIGHT - CONTINUED_MM - title;

  const split = (list: Clue[]) => {
    let used = 0;
    let count = 0;
    while (count < list.length && used + clueHeight(list[count]!, style) <= firstSpace) {
      used += clueHeight(list[count++]!, style);
    }
    return [
      list.slice(0, count),
      ...packByHeight(list.slice(count), (c) => clueHeight(c, style), nextSpace),
    ];
  };
  const across = split(puzzle.across);
  const down = split(puzzle.down);
  return {
    cell,
    pages: Array.from({ length: Math.max(across.length, down.length) }, (_, i) => ({
      across: across[i] ?? [],
      down: down[i] ?? [],
    })),
  };
}
