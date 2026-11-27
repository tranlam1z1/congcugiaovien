import { describe, expect, it } from 'vitest';
import { chunkHeight, layoutAnswers } from './answerLayout';

const blocks = (count: number, answers: number, text = '12') =>
  Array.from({ length: count }, (_, i) => ({
    label: `Phiếu ${i + 1}`,
    answers: Array.from({ length: answers }, () => text),
  }));

describe('xếp trang đáp án', () => {
  it.each([
    { count: 60, answers: 100, columns: 6, text: '12' },
    { count: 3, answers: 60, columns: 2, text: 'con cá' },
    { count: 5, answers: 30, columns: 1, text: 'x'.repeat(120) },
    { count: 1, answers: 200, columns: 1, text: 'x' },
  ])(
    '$count phiếu, $answers đáp án, $columns cột: đủ đáp án và không tràn trang',
    ({ count, answers, columns, text }) => {
      const input = blocks(count, answers, text);
      const pages = layoutAnswers(input, columns);
      const chunks = pages.flat();
      expect(chunks.flatMap((c) => c.answers)).toEqual(input.flatMap((b) => b.answers));
      for (const page of pages) {
        const height = page.reduce((sum, c) => sum + chunkHeight(c, columns), 0);
        expect(height).toBeLessThanOrEqual(243);
      }
    },
  );

  it('khối bị cắt đánh số tiếp', () => {
    const chunks = layoutAnswers(blocks(1, 80, 'x'), 1).flat();
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[1]!.start).toBe(chunks[0]!.answers.length);
    expect(chunks[1]!.label).toBe('Phiếu 1 (tiếp)');
  });

  it('không có phiếu thì không có trang', () => {
    expect(layoutAnswers([], 3)).toEqual([]);
  });
});
