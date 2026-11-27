import type { ReactNode } from 'react';
import { A4Page } from './A4Page';

/** Trang đáp án cho thầy cô, đặt sau tất cả các trang bài tập. */
export function AnswerKeyPage({
  title,
  seed,
  children,
}: {
  title: string;
  /** In mã đề để đối chiếu và tạo lại đúng bộ cũ. */
  seed?: number;
  children: ReactNode;
}) {
  return (
    <A4Page plain>
      <header className="sheet-header">
        <h2 className="sheet-title">Đáp án · {title}</h2>
        {seed !== undefined && <p className="sheet-school">Mã đề: {seed}</p>}
      </header>
      {children}
    </A4Page>
  );
}
