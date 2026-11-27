/** Trang bài tập. Chỉ dùng chữ, viền và nền để PDF vẽ lại được. */
import type { ReactNode } from 'react';
import { A4Page } from '@/core/print/A4Page';
import { SheetHeader } from '@/core/print/SheetHeader';
import type { Hide, MatchBlock, OrderQuestion, Worksheet } from './generator';
import {
  CARD_ROW_MM,
  COLUMN_GAP_MM,
  layoutFill,
  layoutMatch,
  layoutOrder,
  MATCH_GAP_MM,
  MATCH_ROW_MM,
  ORDER_GAP_MM,
  orderLines,
  WRITE_ROW_MM,
  type TextStyle,
} from './layout';

type SheetProps = {
  studentName?: string;
  title: string;
  school: string;
  showNameLine: boolean;
};

const FILL_INSTRUCTION: Record<Hide, string> = {
  onset: 'Điền âm đầu thích hợp vào chỗ chấm:',
  rime: 'Điền vần thích hợp vào chỗ chấm:',
  both: 'Điền âm đầu hoặc vần thích hợp vào chỗ chấm:',
};

const BANK_LABEL: Record<Hide, string> = {
  onset: 'Âm đầu cho sẵn:',
  rime: 'Vần cho sẵn:',
  both: 'Âm, vần cho sẵn:',
};

function Page({
  first,
  large,
  instruction,
  header: { studentName, title, school, showNameLine },
  children,
}: {
  first: boolean;
  large: boolean;
  instruction: string;
  header: SheetProps;
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
      <p className="mb-[3mm] font-bold">{instruction}</p>
      {children}
    </A4Page>
  );
}

const Dot = () => <span className="size-[2mm] shrink-0 rounded-full bg-black" />;

const Word = ({ children }: { children: string }) => (
  <span className="rounded-[2mm] border border-black px-[2.5mm] whitespace-nowrap">
    {children}
  </span>
);

function Match({
  block,
  start,
  large,
}: {
  block: MatchBlock;
  start: number;
  large: boolean;
}) {
  const rowHeight = `${MATCH_ROW_MM[large ? 1 : 0]}mm`;
  return (
    <div data-item className="flex justify-between gap-[8mm]">
      <ul>
        {block.pairs.map((pair, i) => (
          <li key={i} className="flex items-center gap-[2mm]" style={{ height: rowHeight }}>
            <span className="w-[2em] shrink-0 text-[0.75em]">{start + i + 1})</span>
            <Word>{pair.left}</Word>
            <Dot />
          </li>
        ))}
      </ul>
      <ul>
        {block.right.map((text, i) => (
          <li key={i} className="flex items-center gap-[2mm]" style={{ height: rowHeight }}>
            <Dot />
            <Word>{text}</Word>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Order({
  question,
  number,
  style,
}: {
  question: OrderQuestion;
  number: number;
  style: TextStyle;
}) {
  const size = style.large ? 1 : 0;
  const { writeRows } = orderLines(question, style);
  return (
    <li data-item style={{ marginBottom: `${ORDER_GAP_MM}mm` }}>
      <div className="flex gap-[1mm]">
        <span className="w-[2em] shrink-0 text-[0.75em]" style={{ lineHeight: '10mm' }}>
          {number})
        </span>
        <ul className="flex flex-wrap gap-x-[3mm]">
          {question.words.map((word, i) => (
            <li key={i} className="flex items-center" style={{ height: `${CARD_ROW_MM[size]}mm` }}>
              <Word>{word}</Word>
            </li>
          ))}
        </ul>
      </div>
      {Array.from({ length: writeRows }, (_, row) => (
        <div
          key={row}
          className="flex items-end justify-end border-b border-dotted border-black"
          style={{ height: `${WRITE_ROW_MM[size]}mm` }}
        >
          {row === writeRows - 1 ? question.ending : ''}
        </div>
      ))}
    </li>
  );
}

export function WorksheetPages({
  sheet,
  hide,
  showBank,
  columns,
  style,
  ...header
}: SheetProps & {
  sheet: Worksheet;
  hide: Hide;
  showBank: boolean;
  columns: number;
  style: TextStyle;
}) {
  const grid = {
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    columnGap: `${COLUMN_GAP_MM}mm`,
  };
  const common = { large: style.large, header };

  if (sheet.form === 'noi') {
    let count = 0;
    return layoutMatch(sheet.blocks, columns, style).map((rows, page) => (
      <Page key={page} first={page === 0} instruction="Nối để được từ đúng:" {...common}>
        {rows.map((row, r) => (
          <div key={r} className="grid" style={{ ...grid, marginBottom: `${MATCH_GAP_MM}mm` }}>
            {row.map((block, i) => {
              const start = count;
              count += block.pairs.length;
              return <Match key={i} block={block} start={start} large={style.large} />;
            })}
          </div>
        ))}
      </Page>
    ));
  }

  if (sheet.form === 'sap-xep') {
    let count = 0;
    return layoutOrder(sheet.questions, style).map((questions, page) => (
      <Page
        key={page}
        first={page === 0}
        instruction="Sắp xếp các từ thành câu rồi viết lại:"
        {...common}
      >
        <ol>
          {questions.map((question) => (
            <Order key={question.sentence} question={question} number={++count} style={style} />
          ))}
        </ol>
      </Page>
    ));
  }

  const bank = showBank && sheet.bank.length > 0;
  const { rowHeight, pages } = layoutFill(sheet.questions, columns, bank, style);
  const perPage = pages[0]?.length ?? 0;
  return pages.map((questions, page) => {
    // Hộp gợi ý chỉ gồm các âm, vần có trên trang đó.
    const onPage = new Set(questions.map((q) => q.hidden.toLocaleLowerCase('vi')));
    return (
      <Page key={page} first={page === 0} instruction={FILL_INSTRUCTION[hide]} {...common}>
        {bank && (
          <p className="mb-[4mm] rounded-[2mm] border border-black px-[3mm] py-[1mm]">
            {BANK_LABEL[hide]}{' '}
            <b>{sheet.bank.filter((piece) => onPage.has(piece)).join(',  ')}</b>
          </p>
        )}
        <ol className="grid" style={{ ...grid, gridAutoRows: `${rowHeight}mm` }}>
          {questions.map((q, i) => (
            <li data-item key={i} className="flex min-w-0 items-center whitespace-pre">
              <span className="w-[2.4em] shrink-0 text-[0.75em]">{page * perPage + i + 1})</span>
              <span>{q.before}</span>
              <span className="mx-[0.5mm] h-[1.2em] w-[2.6em] shrink-0 border-b border-dotted border-black" />
              <span>{q.after}</span>
            </li>
          ))}
        </ol>
      </Page>
    );
  });
}
