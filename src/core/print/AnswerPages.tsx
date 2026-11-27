import { AnswerKeyPage } from './AnswerKeyPage';
import { ANSWER_ROW_MM, layoutAnswers, type AnswerBlock } from './answerLayout';

/** Các trang đáp án in ở cuối: mỗi phiếu một khối, đánh số theo câu. */
export function AnswerPages({
  blocks,
  columns,
  title,
  seed,
}: {
  blocks: AnswerBlock[];
  /** Đáp án ngắn xếp nhiều cột; câu dài dùng 1 cột. */
  columns: number;
  title: string;
  seed: number;
}) {
  return layoutAnswers(blocks, columns).map((page, index) => (
    <AnswerKeyPage key={index} title={title} seed={seed}>
      {page.map((chunk) => (
        <section key={`${chunk.label}-${chunk.start}`} className="mb-[4mm] text-[11pt]">
          <h3 className="h-[8mm] font-bold">{chunk.label}</h3>
          <ol
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gridAutoRows: columns > 1 ? `${ANSWER_ROW_MM}mm` : `minmax(${ANSWER_ROW_MM}mm, auto)`,
              lineHeight: columns > 1 ? undefined : `${ANSWER_ROW_MM}mm`,
            }}
          >
            {chunk.answers.map((answer, i) => (
              <li key={i}>
                {chunk.start + i + 1}) <b>{answer}</b>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </AnswerKeyPage>
  ));
}
