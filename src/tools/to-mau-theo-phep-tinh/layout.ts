/** Cỡ ô và cỡ chữ (mm) để cả tranh nằm trong một trang. */
import type { PrintFont } from '@/core/print/fonts';
import { A4, DEFAULT_MARGIN_MM } from '@/core/print/paper';
import { textOf, type Worksheet } from './generator';

const CONTENT_WIDTH = A4.portrait.width - 2 * DEFAULT_MARGIN_MM;
const CONTENT_HEIGHT = A4.portrait.height - 2 * DEFAULT_MARGIN_MM;

/** [chữ thường, chữ to]: đầu phiếu, câu hướng dẫn và bảng màu hai đến ba hàng. */
const HEADER_MM = [54, 68];
const HEADER_MM_PER_LEADING = 40;
const LEGEND_MM = [34, 46];
const MAX_CELL = 22;
/** Cỡ chữ lớn nhất so với cạnh ô. */
const FONT_RATIO = [0.25, 0.3];

export function layoutCells(
  sheet: Worksheet,
  { font, large }: { font: PrintFont; large: boolean },
) {
  const size = large ? 1 : 0;
  const height =
    CONTENT_HEIGHT -
    HEADER_MM[size]! -
    ((font.leading ?? 1) - 1) * HEADER_MM_PER_LEADING -
    LEGEND_MM[size]!;
  const cell = Math.min(
    MAX_CELL,
    CONTENT_WIDTH / sheet.cells[0]!.length,
    height / sheet.cells.length,
  );
  const longest = Math.max(...sheet.cells.flat().map((c) => textOf(c.expression).length));
  const fontSize = Math.min(
    cell * FONT_RATIO[size]!,
    (cell * 0.9) / (longest * font.digitWidth),
  );
  return { cell, fontSize };
}
