import { A4Page } from '@/core/print/A4Page';
import type { PrintFont } from '@/core/print/fonts';
import { SheetHeader } from '@/core/print/SheetHeader';
import type { MathConfig, Question } from './generator';
import { COLUMN_GAP_MM, layoutSheet } from './layout';
import { QuestionItem } from './QuestionItem';

const INSTRUCTION: Record<MathConfig['form'], string> = {
  ngang: 'Tính:',
  doc: 'Tính:',
  'o-trong': 'Điền số thích hợp vào ô trống:',
  'so-sanh': 'Điền dấu >, <, = vào ô tròn:',
};

export type Sheet = { studentName?: string; questions: Question[] };

export function WorksheetPages({
  sheet,
  config,
  columns,
  font,
  large,
  title,
  school,
  showNameLine,
}: {
  sheet: Sheet;
  config: MathConfig;
  columns: number;
  font: PrintFont;
  large: boolean;
  title: string;
  school: string;
  showNameLine: boolean;
}) {
  const { rowHeight, pages } = layoutSheet(sheet.questions, config, columns, large, font);
  const perPage = pages[0]?.length ?? 0;

  return pages.map((questions, page) => (
    <A4Page key={page} large={large}>
      {page === 0 ? (
        <SheetHeader
          title={title}
          school={school}
          showNameLine={showNameLine}
          studentName={sheet.studentName}
        />
      ) : (
        <p className="sheet-header">
          {sheet.studentName ? `${sheet.studentName} · ` : ''}
          {title} (tiếp theo)
        </p>
      )}
      <p className="mb-[3mm] font-bold">{INSTRUCTION[config.form]}</p>
      <ol
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gridAutoRows: `${rowHeight}mm`,
          columnGap: `${COLUMN_GAP_MM}mm`,
        }}
      >
        {questions.map((question, index) => (
          <QuestionItem
            key={index}
            number={page * perPage + index + 1}
            question={question}
            vertical={config.form === 'doc'}
            digitWidth={font.digitWidth}
          />
        ))}
      </ol>
    </A4Page>
  ));
}
