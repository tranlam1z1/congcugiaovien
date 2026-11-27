import { createRng } from '@/core/rng';

export type DemoGrade = 1 | 2 | 3;
export type DemoOp = '+' | '−' | '×' | ':';

export const DEMO_OPS: DemoOp[] = ['+', '−', '×', ':'];

const MAX: Record<DemoGrade, number> = { 1: 20, 2: 100, 3: 1000 };

/** Phiếu mẫu ở trang chủ: không ra số âm, chia hết, không trùng câu. */
export function demoQuestions(seed: number, grade: DemoGrade, ops: DemoOp[], count = 10) {
  const rng = createRng(seed);
  const max = MAX[grade];
  const table = grade === 3 ? 9 : 5;
  const questions = new Set<string>();

  // Mỗi phép tính có hơn `count` câu khác nhau nên vòng lặp luôn kết thúc.
  while (questions.size < count) {
    const op = rng.pick(ops);
    let a: number;
    let b: number;
    if (op === '+') {
      const sum = rng.int(3, max);
      a = rng.int(1, sum - 1);
      b = sum - a;
    } else if (op === '−') {
      a = rng.int(3, max);
      b = rng.int(1, a);
    } else if (op === '×') {
      a = rng.int(2, table);
      b = rng.int(1, 9);
    } else {
      b = rng.int(2, table);
      a = b * rng.int(1, 9);
    }
    questions.add(`${a} ${op} ${b} =`);
  }
  return [...questions];
}
