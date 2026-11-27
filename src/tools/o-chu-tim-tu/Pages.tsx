import type { ReactNode } from 'react';
import { A4Page } from '@/core/print/A4Page';
import type { PrintFont } from '@/core/print/fonts';
import { SheetHeader } from '@/core/print/SheetHeader';
import type { Clue, Puzzle } from './generator';
import { CrossGrid, SearchGrid } from './Grids';
import {
  CLUE_COLUMN_MM,
  CLUE_GAP_MM,
  clueText,
  COLUMN_GAP_MM,
  GAP_MM,
  layoutCross,
  layoutSearch,
  type TextStyle,
} from './layout';

type HeaderProps = {
  studentName?: string;
  title: string;
  school: string;
  showNameLine: boolean;
};

function Page({
  first,
  large,
  header: { studentName, title, school, showNameLine },
  children,
}: {
  first: boolean;
  large: boolean;
  header: HeaderProps;
  children: ReactNode;
}) {
  return (
    <A4Page large={large}>
      {first ? (
        <SheetHeader
          title={title}
          school={school}
          showNameLine={showNameLine}
          studentName={studentName}
        />
      ) : (
        <p className="sheet-header">
          {studentName ? `${studentName} · ` : ''}
          {title} (tiếp theo)
        </p>
      )}
      {children}
    </A4Page>
  );
}

function ClueColumn({ title, clues }: { title: string; clues: Clue[] }) {
  return (
    <div style={{ width: `${CLUE_COLUMN_MM}mm` }}>
      {clues.length > 0 && (
        <>
          <h3 className="font-bold">{title}</h3>
          <ol>
            {clues.map((clue) => (
              <li
                data-item
                key={clue.number}
                className="flex"
                style={{ marginBottom: `${CLUE_GAP_MM}mm` }}
              >
                <span className="w-[2em] shrink-0 font-bold">{clue.number}.</span>
                <span className="min-w-0 break-words">{clueText(clue)}</span>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

export function PuzzlePages({
  puzzle,
  showList,
  gridFont,
  style,
  ...header
}: HeaderProps & {
  puzzle: Puzzle;
  showList: boolean;
  gridFont: PrintFont;
  style: TextStyle;
}) {
  const common = { large: style.large, header };

  if (puzzle.kind === 'o-chu') {
    const { cell, pages } = layoutCross(puzzle, style);
    return pages.map((clues, page) => (
      <Page key={page} first={page === 0} {...common}>
        {page === 0 && (
          <>
            <p className="mb-[3mm] font-bold">Đọc gợi ý rồi điền mỗi ô một chữ cái:</p>
            <div data-item style={{ marginBottom: `${GAP_MM}mm` }}>
              <CrossGrid puzzle={puzzle} cell={cell} font={gridFont} />
            </div>
          </>
        )}
        <div className="flex" style={{ gap: `${COLUMN_GAP_MM}mm` }}>
          <ClueColumn title="Hàng ngang" clues={clues.across} />
          <ClueColumn title="Hàng dọc" clues={clues.down} />
        </div>
      </Page>
    ));
  }

  const { cell, columns, rowHeight, pages } = layoutSearch(puzzle, showList, style);
  return pages.map((words, page) => (
    <Page key={page} first={page === 0} {...common}>
      {page === 0 && (
        <>
          <p className="mb-[3mm] font-bold">
            {showList
              ? 'Tìm và khoanh tròn các từ sau trong bảng:'
              : `Tìm và khoanh tròn ${puzzle.words.length} từ ẩn trong bảng:`}
          </p>
          <div data-item style={{ marginBottom: `${GAP_MM}mm` }}>
            <SearchGrid puzzle={puzzle} cell={cell} font={gridFont} />
          </div>
        </>
      )}
      {words.length > 0 && (
        <ul
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gridAutoRows: `${rowHeight}mm`,
            columnGap: `${COLUMN_GAP_MM}mm`,
          }}
        >
          {words.map((word) => (
            <li data-item key={word.word} className="flex items-center gap-[2mm] whitespace-nowrap">
              <span className="size-[3.5mm] shrink-0 border border-black" />
              {word.word}
            </li>
          ))}
        </ul>
      )}
    </Page>
  ));
}
