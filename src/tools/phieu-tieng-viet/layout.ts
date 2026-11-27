/** Chia trang theo chiều cao ước lượng (mm) để không mục nào bị cắt ngang. */
import type { PrintFont } from '@/core/print/fonts';
import {
  A4,
  DEFAULT_MARGIN_MM,
  MM_PER_PX,
  packByHeight,
  paginate,
} from '@/core/print/paper';
import type { MatchBlock, OrderQuestion, Worksheet } from './generator';

export const COLUMN_GAP_MM = 8;
const CONTENT_WIDTH = A4.portrait.width - 2 * DEFAULT_MARGIN_MM;
const CONTENT_HEIGHT = A4.portrait.height - 2 * DEFAULT_MARGIN_MM;

/** [chữ thường, chữ to] */
const FONT_PT = [13, 17];
const HEADER_MM = [54, 68];
const HEADER_MM_PER_LEADING = 40;
/** Hộp âm, vần cho sẵn. */
export const BANK_MM = [24, 34];
export const FILL_ROW_MM = [14, 18];
export const MATCH_ROW_MM = [13, 15];
export const MATCH_GAP_MM = 10;
/** Một hàng thẻ từ, một dòng để viết, khoảng cách giữa hai câu. */
export const CARD_ROW_MM = [11, 14];
export const WRITE_ROW_MM = [13, 16];
export const ORDER_GAP_MM = 4;

export type TextStyle = { font: PrintFont; large: boolean };

/** Bề rộng ước lượng dư (mm) của một đoạn chữ. */
export function textWidth(chars: number, { font, large }: TextStyle) {
  const em = ((FONT_PT[large ? 1 : 0]! * 96) / 72) * MM_PER_PX;
  return chars * font.digitWidth * 0.95 * em;
}

const columnsFor = (itemWidth: number) =>
  Math.max(
    1,
    Math.min(3, Math.floor((CONTENT_WIDTH + COLUMN_GAP_MM) / (itemWidth + COLUMN_GAP_MM))),
  );

const longest = (texts: string[]) => Math.max(1, ...texts.map((t) => t.length));

/** Số cột nhiều nhất mà chữ không tràn: 1 đến 3. */
export function maxColumns(sheets: Worksheet[], style: TextStyle) {
  const widths = sheets.map((sheet) => {
    if (sheet.form === 'dien') {
      // Số thứ tự + phần chữ còn lại + chỗ chấm.
      const chars = longest(sheet.questions.map((q) => q.before + q.after));
      return textWidth(chars + 3.5 + 4, style);
    }
    if (sheet.form === 'noi') {
      const pairs = sheet.blocks.flatMap((b) => b.pairs);
      const chars = longest(pairs.map((p) => p.left)) + longest(pairs.map((p) => p.right));
      // Hai khung chữ, hai chấm và khoảng trống để vẽ đường nối.
      return textWidth(chars, style) + 36;
    }
    return CONTENT_WIDTH;
  });
  return columnsFor(Math.max(0, ...widths));
}

export function contentHeight({ font, large }: TextStyle) {
  const header = HEADER_MM[large ? 1 : 0]! + ((font.leading ?? 1) - 1) * HEADER_MM_PER_LEADING;
  return CONTENT_HEIGHT - header;
}

export function layoutFill<T>(
  items: readonly T[],
  columns: number,
  withBank: boolean,
  style: TextStyle,
) {
  const size = style.large ? 1 : 0;
  const base = FILL_ROW_MM[size]!;
  const available = contentHeight(style) - (withBank ? BANK_MM[size]! : 0);
  const maxRows = Math.floor(available / base);
  const rows = Math.min(maxRows, Math.max(1, Math.ceil(items.length / columns)));
  return {
    rowHeight: Math.min(base * 1.5, available / rows),
    pages: paginate(items, maxRows * columns),
  };
}

export const blockRowHeight = (blocks: MatchBlock[], large: boolean) =>
  Math.max(...blocks.map((b) => b.pairs.length)) * MATCH_ROW_MM[large ? 1 : 0]! + MATCH_GAP_MM;

/** Trả về trang → hàng → các nhóm nối đứng cạnh nhau. */
export function layoutMatch(blocks: MatchBlock[], columns: number, style: TextStyle) {
  return packByHeight(
    paginate(blocks, columns),
    (row) => blockRowHeight(row, style.large),
    contentHeight(style),
  );
}

export function orderLines(question: OrderQuestion, style: TextStyle) {
  // Cả câu dài thì bề rộng gần với trung bình, không cần ước lượng dư nhiều như từng từ.
  const text = textWidth(question.sentence.length, style) * 0.8;
  // Mỗi thẻ từ thêm lề trong và khoảng cách khoảng 8 mm.
  const cards = text + question.words.length * 8;
  return {
    cardRows: Math.max(1, Math.ceil(cards / (CONTENT_WIDTH - 20))),
    writeRows: Math.max(1, Math.ceil(text / CONTENT_WIDTH)),
  };
}

export function orderHeight(question: OrderQuestion, style: TextStyle) {
  const size = style.large ? 1 : 0;
  const { cardRows, writeRows } = orderLines(question, style);
  return cardRows * CARD_ROW_MM[size]! + writeRows * WRITE_ROW_MM[size]! + ORDER_GAP_MM;
}

export const layoutOrder = (questions: OrderQuestion[], style: TextStyle) =>
  packByHeight(questions, (q) => orderHeight(q, style), contentHeight(style));
