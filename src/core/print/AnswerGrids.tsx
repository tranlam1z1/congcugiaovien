import type { ReactNode } from 'react';
import { AnswerKeyPage } from './AnswerKeyPage';
import { paginate } from './paper';

/** Bề rộng và chiều cao (mm) dành cho mỗi hình đáp án khi xếp 4 hình một trang. */
export const ANSWER_GRID_MM = { width: 88, height: 104 };

/** Trang đáp án dạng hình (ô chữ, tranh tô màu): mỗi trang 4 phiếu. */
export function AnswerGrids({
  title,
  seed,
  blocks,
}: {
  title: string;
  seed: number;
  blocks: { label: string; content: ReactNode }[];
}) {
  return paginate(blocks, 4).map((page, index) => (
    <AnswerKeyPage key={index} title={title} seed={seed}>
      <div className="grid grid-cols-2 gap-x-[8mm] gap-y-[4mm] text-[11pt]">
        {page.map((block) => (
          <section data-item key={block.label}>
            <h3 className="h-[8mm] overflow-hidden font-bold whitespace-nowrap">{block.label}</h3>
            {block.content}
          </section>
        ))}
      </div>
    </AnswerKeyPage>
  ));
}
