/** Lưới chữ dùng cho phiếu và đáp án. Chỉ dùng chữ, viền và nền để PDF vẽ lại được. */
import type { PrintFont } from '@/core/print/fonts';
import { cellsOf, type Crossword, type WordSearch } from './generator';

const mm = (value: number) => `${value}mm`;

const letterStyle = (cell: number, font: PrintFont) => ({
  fontFamily: `'${font.family}', 'Be Vietnam Pro'`,
  // Chữ viết tay nét cao và rộng hơn nên thu nhỏ.
  fontSize: mm(cell * (font.leading ? 0.45 : 0.55)),
  lineHeight: 1,
});

export function SearchGrid({
  puzzle,
  cell,
  font,
  solved = false,
}: {
  puzzle: WordSearch;
  cell: number;
  font: PrintFont;
  /** Tô các ô thuộc từ cần tìm. */
  solved?: boolean;
}) {
  const marked = new Set(solved ? puzzle.words.flatMap(cellsOf).map(String) : []);
  return (
    <div data-grid className="relative mx-auto" style={{ width: mm(cell * puzzle.size) }}>
      {puzzle.grid.map((line, row) => (
        <div key={row} className="flex" style={{ height: mm(cell) }}>
          {line.map((letter, column) => (
            <span
              key={column}
              data-marked={marked.has(`${row},${column}`) || undefined}
              className="flex shrink-0 items-center justify-center font-bold"
              style={{
                ...letterStyle(cell, font),
                width: mm(cell),
                background: marked.has(`${row},${column}`) ? '#ffd54f' : undefined,
              }}
            >
              {letter}
            </span>
          ))}
        </div>
      ))}
      <div className="absolute inset-0 border border-black" />
    </div>
  );
}

export function CrossGrid({
  puzzle,
  cell,
  font,
  solved = false,
}: {
  puzzle: Crossword;
  cell: number;
  font: PrintFont;
  /** Điền sẵn chữ. */
  solved?: boolean;
}) {
  const numbers = new Map(
    [...puzzle.across, ...puzzle.down].map((c) => [`${c.row},${c.column}`, c.number]),
  );
  return (
    <div
      data-grid
      className="relative mx-auto"
      style={{ width: mm(cell * puzzle.columns), height: mm(cell * puzzle.rows) }}
    >
      {puzzle.grid.flatMap((line, row) =>
        line.map((letter, column) => {
          if (letter === null) return null;
          const number = numbers.get(`${row},${column}`);
          return (
            <span
              key={`${row},${column}`}
              data-cell
              className="absolute flex items-center justify-center border border-black font-bold"
              style={{
                ...letterStyle(cell, font),
                left: mm(column * cell),
                top: mm(row * cell),
                // Dư 1px để viền hai ô cạnh nhau chồng lên nhau.
                width: `calc(${mm(cell)} + 1px)`,
                height: `calc(${mm(cell)} + 1px)`,
              }}
            >
              {number !== undefined && (
                <span
                  className="absolute top-[0.3mm] left-[0.5mm] font-normal"
                  style={{ fontFamily: "'Be Vietnam Pro'", fontSize: mm(cell * 0.24) }}
                >
                  {number}
                </span>
              )}
              {solved ? letter : null}
            </span>
          );
        }),
      )}
    </div>
  );
}
