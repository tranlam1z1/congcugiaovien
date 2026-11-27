import type { ReactNode } from 'react';
import { A4Page } from '@/core/print/A4Page';
import { SheetHeader } from '@/core/print/SheetHeader';
import { COLUMNS, HEADER_ROW_MM, LINE_MM, MARGIN_MM, type PrintRow } from './layout';
import { QUALITIES, STUDIES } from './state';

const TEMPLATE = COLUMNS.map((width) => `${width}mm`).join(' ');

function Cell({ children, center = false }: { children: ReactNode; center?: boolean }) {
  return (
    <div
      data-cell
      className={`overflow-hidden border-r-[0.2mm] border-b-[0.2mm] border-black px-[1.2mm] py-[1mm] break-words whitespace-pre-line ${
        center ? 'text-center' : ''
      }`}
    >
      {children}
    </div>
  );
}

function TableRow({ height, children }: { height: number; children: ReactNode }) {
  return (
    <div className="grid" style={{ gridTemplateColumns: TEMPLATE, height: `${height}mm` }}>
      {children}
    </div>
  );
}

export function CommentPage({
  rows,
  title,
  school,
  headerHeight,
}: {
  rows: PrintRow[];
  title: string;
  school: string;
  headerHeight: number;
}) {
  return (
    <A4Page margin={MARGIN_MM}>
      <div style={{ height: `${headerHeight}mm` }}>
        <SheetHeader title={title} school={school} showNameLine={false} />
      </div>
      <div
        data-table
        className="border-t-[0.2mm] border-l-[0.2mm] border-black text-[11pt]"
        style={{ lineHeight: `${LINE_MM}mm`, width: 'max-content' }}
      >
        <TableRow height={HEADER_ROW_MM}>
          {['STT', 'Họ và tên', 'Học tập', 'Phẩm chất', 'Nhận xét'].map((label) => (
            <Cell key={label} center>
              <b>{label}</b>
            </Cell>
          ))}
        </TableRow>
        {rows.map(({ line, index, height }) => (
          <TableRow key={line.key} height={height}>
            <Cell center>{index + 1}</Cell>
            <Cell>{line.name}</Cell>
            <Cell>{STUDIES.find((s) => s.value === line.study)!.label}</Cell>
            <Cell>{QUALITIES.find((q) => q.value === line.quality)!.label}</Cell>
            <Cell>{line.comment}</Cell>
          </TableRow>
        ))}
      </div>
      <p className="mt-[2mm] text-[10pt] italic">
        Bản nháp, giáo viên cần rà soát trước khi ghi vào hồ sơ.
      </p>
    </A4Page>
  );
}
