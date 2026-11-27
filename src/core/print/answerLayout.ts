/** Xếp đáp án của nhiều phiếu vào ít trang nhất. */
import { A4, DEFAULT_MARGIN_MM, packByHeight } from './paper';

export type AnswerBlock = { label: string; answers: string[] };
/** Một khối đáp án trên trang; phiếu dài được cắt thành nhiều khối đánh số tiếp. */
export type AnswerChunk = AnswerBlock & { start: number };

export const ANSWER_ROW_MM = 6.5;
const TITLE_MM = 8;
const GAP_MM = 4;
/** Chừa cho tiêu đề trang đáp án. */
const HEADER_MM = 30;
const MAX_HEIGHT = A4.portrait.height - 2 * DEFAULT_MARGIN_MM - HEADER_MM;
const MAX_ROWS = Math.floor((MAX_HEIGHT - TITLE_MM - GAP_MM) / ANSWER_ROW_MM);
/** Số ký tự chắc chắn vừa một dòng khi xếp một cột. */
const CHARS_PER_LINE = 80;

export function answerRows(answers: readonly string[], columns: number) {
  if (columns > 1) return Math.ceil(answers.length / columns);
  return answers.reduce((sum, a) => sum + Math.max(1, Math.ceil(a.length / CHARS_PER_LINE)), 0);
}

export const chunkHeight = (chunk: AnswerChunk, columns: number) =>
  TITLE_MM + answerRows(chunk.answers, columns) * ANSWER_ROW_MM + GAP_MM;

function splitBlock({ label, answers }: AnswerBlock, columns: number): AnswerChunk[] {
  const chunks: AnswerChunk[] = [{ label, answers: [], start: 0 }];
  answers.forEach((answer, index) => {
    const current = chunks[chunks.length - 1]!;
    if (current.answers.length && answerRows([...current.answers, answer], columns) > MAX_ROWS) {
      chunks.push({ label: `${label} (tiếp)`, answers: [answer], start: index });
    } else {
      current.answers.push(answer);
    }
  });
  return chunks;
}

export const layoutAnswers = (blocks: readonly AnswerBlock[], columns: number) =>
  packByHeight(
    blocks.flatMap((block) => splitBlock(block, columns)),
    (chunk) => chunkHeight(chunk, columns),
    MAX_HEIGHT,
  );
