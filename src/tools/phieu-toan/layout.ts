/**
 * Chia trang. Mỗi hàng câu hỏi cao cố định (mm) nên tính trước được số câu mỗi trang
 * và không câu nào bị cắt ngang.
 */
import type { PrintFont } from '@/core/print/fonts';
import { A4, DEFAULT_MARGIN_MM, MM_PER_PX, paginate } from '@/core/print/paper';
import { tableNumbers, type MathConfig } from './generator';

export const COLUMN_GAP_MM = 6;
export const MAX_COLUMNS = 5;

const CONTENT_WIDTH = A4.portrait.width - 2 * DEFAULT_MARGIN_MM;
const CONTENT_HEIGHT = A4.portrait.height - 2 * DEFAULT_MARGIN_MM;

/** [chữ thường, chữ to] */
const ROW_MM = { ngang: [11, 14], 'o-trong': [12, 16], 'so-sanh': [13, 17], doc: [34, 44] };
/** Chừa cho đầu phiếu (trường, họ tên, tiêu đề hai dòng) và câu lệnh. */
const HEADER_MM = [54, 68];
const FONT_PT = [13, 17];
/** Đầu phiếu cao thêm bao nhiêu mm cho mỗi đơn vị giãn dòng. */
const HEADER_MM_PER_LEADING = 40;

const digits = (value: number) => String(value).length;

function maxValue({ ops, range, table, form, compareExpressions }: MathConfig) {
  if (form === 'so-sanh' && !compareExpressions) return range;
  const tableMax = 10 * Math.max(0, ...tableNumbers(table));
  return Math.max(
    ...ops.map((op) => (table !== 'none' && (op === 'mul' || op === 'div') ? tableMax : range)),
  );
}

/** Ước lượng dư bề rộng câu dài nhất (mm). */
function itemWidth(config: MathConfig, font: PrintFont, large: boolean) {
  const em = (FONT_PT[large ? 1 : 0]! * 96) / 72 * MM_PER_PX;
  const length = digits(maxValue(config));
  const n = length * font.digitWidth;
  const label = 3.5 * font.digitWidth;
  // Đặt tính dọc: mỗi chữ số một ô rộng hơn chữ một chút; phép chia thêm cột số chia.
  const cells = length * (font.digitWidth + 0.06);
  const content = {
    ngang: 2 * n + 4,
    'o-trong': 3 * n + 4.5,
    'so-sanh': config.compareExpressions ? 3 * n + 4.5 : 2 * n + 3,
    doc: cells + (config.ops.includes('div') ? 4.2 : 2.5),
  }[config.form];
  return (label + content) * em;
}

/** Số cột nhiều nhất mà câu hỏi không tràn sang cột bên. */
export function maxColumns(config: MathConfig, font: PrintFont, large: boolean) {
  const fit = Math.floor(
    (CONTENT_WIDTH + COLUMN_GAP_MM) / (itemWidth(config, font, large) + COLUMN_GAP_MM),
  );
  return Math.min(MAX_COLUMNS, Math.max(1, fit));
}

/**
 * Chia câu của một phiếu thành các trang và chọn chiều cao hàng: trang ít câu thì giãn
 * hàng cho thoáng (tối đa 1,6 lần).
 */
export function layoutSheet<T>(
  questions: readonly T[],
  { form }: Pick<MathConfig, 'form'>,
  columns: number,
  large: boolean,
  { leading = 1 }: Pick<PrintFont, 'leading'> = {},
) {
  const size = large ? 1 : 0;
  const base = ROW_MM[form][size]!;
  const header = HEADER_MM[size]! + (leading - 1) * HEADER_MM_PER_LEADING;
  const available = CONTENT_HEIGHT - header;
  const maxRows = Math.floor(available / base);
  const rows = Math.min(maxRows, Math.max(1, Math.ceil(questions.length / columns)));
  return {
    rowHeight: Math.min(base * 1.6, available / rows),
    pages: paginate(questions, maxRows * columns),
  };
}
