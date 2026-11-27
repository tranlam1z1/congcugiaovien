/** Trang tranh và hình đáp án. Chỉ dùng chữ, viền và nền để PDF vẽ lại được. */
import { A4Page } from '@/core/print/A4Page';
import { ANSWER_GRID_MM } from '@/core/print/AnswerGrids';
import type { PrintFont } from '@/core/print/fonts';
import { SheetHeader } from '@/core/print/SheetHeader';
import { COLORS } from './art';
import { textOf, type Worksheet } from './generator';
import { layoutCells } from './layout';

const mm = (value: number) => `${value}mm`;

export function WorksheetPage({
  sheet,
  font,
  large,
  studentName,
  title,
  school,
  showNameLine,
}: {
  sheet: Worksheet;
  font: PrintFont;
  large: boolean;
  studentName?: string;
  title: string;
  school: string;
  showNameLine: boolean;
}) {
  const { cell, fontSize } = layoutCells(sheet, { font, large });
  return (
    <A4Page large={large}>
      <SheetHeader
        title={title}
        school={school}
        showNameLine={showNameLine}
        studentName={studentName}
      />
      <p className="mb-[2mm] font-bold">Tính rồi tô màu mỗi ô theo kết quả:</p>
      <ul data-item data-legend className="mb-[4mm] flex flex-wrap gap-x-[7mm] gap-y-[2mm]">
        {sheet.legend.map(({ color, result }) => (
          <li key={color} className="flex items-center gap-[2mm] whitespace-nowrap">
            <span
              className="size-[5mm] shrink-0 border border-black"
              style={{ background: COLORS[color].hex }}
            />
            <span>
              {COLORS[color].name}: <b>{result}</b>
            </span>
          </li>
        ))}
      </ul>
      <div data-item data-grid className="mx-auto w-max border-t border-l border-black">
        {sheet.cells.map((line, row) => (
          <div key={row} className="flex" style={{ height: mm(cell) }}>
            {line.map(({ expression }, column) => (
              <span
                data-cell
                key={column}
                className="flex shrink-0 items-center justify-center border-r border-b border-black whitespace-nowrap"
                style={{ width: mm(cell), fontSize: mm(fontSize), lineHeight: 1.2 }}
              >
                {textOf(expression)}
              </span>
            ))}
          </div>
        ))}
      </div>
    </A4Page>
  );
}

/** Tranh đã tô màu, cho trang đáp án. */
export function ColoredPicture({ sheet }: { sheet: Worksheet }) {
  const cell = Math.min(
    8.5,
    ANSWER_GRID_MM.width / sheet.cells[0]!.length,
    ANSWER_GRID_MM.height / sheet.cells.length,
  );
  return (
    <div data-answer className="mx-auto w-max">
      {sheet.cells.map((line, row) => (
        <div key={row} className="flex" style={{ height: mm(cell) }}>
          {line.map(({ color }, column) => (
            <span
              key={column}
              className="shrink-0"
              style={{ width: mm(cell), background: COLORS[color].hex }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
