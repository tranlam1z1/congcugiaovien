import { describe, expect, it } from 'vitest';
import { createRng } from '@/core/rng';
import {
  answerOf,
  availableCount,
  defaultTitle,
  FORMS,
  generate,
  matchesPreset,
  OPS,
  PRESETS,
  RANGES,
  TABLES,
  tableNumbers,
  toConfig,
  type Calc,
  type MathConfig,
  type Question,
} from './generator';

/** Tính lại độc lập với generator để kiểm đáp án. */
const compute = ({ op, a, b }: Calc) =>
  op === 'add' ? a + b : op === 'sub' ? a - b : op === 'mul' ? a * b : a / b;

const config = (overrides: Partial<MathConfig> = {}): MathConfig => ({
  ops: ['add', 'sub'],
  range: 20,
  table: 'none',
  form: 'ngang',
  compareExpressions: false,
  count: 30,
  ...overrides,
});

function checkCalc(calc: Calc, { ops, range, table }: MathConfig) {
  const { op, a, b, result } = calc;
  expect(ops).toContain(op);
  for (const value of [a, b, result]) {
    expect(Number.isInteger(value)).toBe(true);
    expect(value).toBeGreaterThanOrEqual(0);
  }
  expect(result).toBe(compute(calc));
  if (op === 'add') expect(result).toBeLessThanOrEqual(range);
  if (op === 'sub') expect(a).toBeLessThanOrEqual(range);
  if (op === 'div') expect(a % b).toBe(0);
  if (op === 'mul' || op === 'div') {
    if (table === 'none') {
      expect(op === 'mul' ? result : a).toBeLessThanOrEqual(range);
      expect(b).toBeGreaterThanOrEqual(2);
      expect(b).toBeLessThanOrEqual(9);
    } else {
      // Bảng nhân: thừa số đầu thuộc bảng; bảng chia: số chia thuộc bảng.
      expect(tableNumbers(table)).toContain(op === 'mul' ? a : b);
      const other = op === 'mul' ? b : result;
      expect(other).toBeGreaterThanOrEqual(1);
      expect(other).toBeLessThanOrEqual(10);
    }
  }
}

const keyOf = (q: Question) => {
  if (q.kind === 'calc') return `${q.op} ${q.a} ${q.b}`;
  return typeof q.left === 'number'
    ? `${q.left} ? ${q.right}`
    : `${q.left.op} ${q.left.a} ${q.left.b}`;
};

function checkSheet(questions: Question[], c: MathConfig) {
  expect(questions).toHaveLength(Math.min(c.count, availableCount(c)));
  expect(new Set(questions.map(keyOf)).size).toBe(questions.length);
  for (const q of questions) {
    if (q.kind === 'calc') {
      checkCalc(q, c);
      expect(answerOf(q)).toBe(String(q[q.hidden]));
      if (c.form !== 'o-trong') expect(q.hidden).toBe('result');
      continue;
    }
    const left = typeof q.left === 'number' ? q.left : compute(q.left);
    if (typeof q.left !== 'number') checkCalc(q.left, c);
    expect(q.right).toBeGreaterThanOrEqual(0);
    expect(q.right).toBeLessThanOrEqual(Math.max(c.range, left));
    expect(answerOf(q)).toBe(left < q.right ? '<' : left > q.right ? '>' : '=');
  }
}

describe('generate', () => {
  it('đúng mọi quy tắc trên 3.000 cấu hình ngẫu nhiên', () => {
    const rng = createRng(2026);
    for (let i = 0; i < 3000; i++) {
      const ops = OPS.filter(() => rng.next() < 0.5);
      const c = config({
        ops: ops.length ? ops : [rng.pick(OPS)],
        range: rng.pick(RANGES),
        table: rng.pick(TABLES),
        form: rng.pick(FORMS),
        compareExpressions: rng.next() < 0.5,
        count: rng.int(1, 100),
      });
      checkSheet(generate(c, rng.int(0, 999999)), c);
    }
  }, 60_000);

  it('cùng seed ra cùng đề, khác seed ra đề khác', () => {
    for (const form of FORMS) {
      const c = config({ form, range: 100 });
      expect(generate(c, 42)).toEqual(generate(c, 42));
      expect(generate(c, 42)).not.toEqual(generate(c, 43));
    }
  });

  it('chia đều số câu cho các phép tính', () => {
    const c = config({ ops: [...OPS], range: 100, count: 40 });
    const questions = generate(c, 7);
    for (const op of OPS) {
      expect(questions.filter((q) => q.kind === 'calc' && q.op === op)).toHaveLength(10);
    }
  });

  it('hết câu không trùng thì lấy đủ mọi câu, bù bằng phép khác', () => {
    // Nhân trong 10 chỉ có 8 câu: 2×2..2×5 (thừa số một chữ số).
    const only = config({ ops: ['mul'], range: 10, count: 100 });
    expect(availableCount(only)).toBe(8);
    expect(generate(only, 1)).toHaveLength(8);

    const mixed = config({ ops: ['mul', 'add'], range: 10, count: 40 });
    const questions = generate(mixed, 1);
    expect(questions).toHaveLength(40);
    expect(questions.filter((q) => q.kind === 'calc' && q.op === 'mul')).toHaveLength(8);
  });

  it('cộng trong 10 đủ 45 câu', () => {
    const c = config({ ops: ['add'], range: 10, count: 100 });
    expect(generate(c, 5)).toHaveLength(45);
    checkSheet(generate(c, 5), c);
  });

  it('điền ô trống ẩn đủ cả ba vị trí', () => {
    const questions = generate(config({ form: 'o-trong', count: 60 }), 3);
    expect(new Set(questions.map((q) => q.kind === 'calc' && q.hidden))).toEqual(
      new Set(['a', 'b', 'result']),
    );
  });

  it('so sánh có đủ ba dấu', () => {
    for (const compareExpressions of [false, true]) {
      const questions = generate(config({ form: 'so-sanh', compareExpressions, count: 60 }), 9);
      expect(new Set(questions.map(answerOf))).toEqual(new Set(['<', '>', '=']));
    }
  });
});

describe('cấu hình', () => {
  it('dữ liệu hỏng được ép về giá trị hợp lệ', () => {
    expect(
      toConfig({ ops: ['x'], range: 7, table: '1-1', form: 'zz', count: -4 }),
    ).toMatchObject({ ops: ['add'], range: 10, table: 'none', form: 'ngang', count: 1 });
    expect(toConfig({ ops: 'add', count: 'abc' })).toMatchObject({ ops: ['add'], count: 30 });
    expect(toConfig({ count: 5000 }).count).toBe(100);
  });

  it('bỏ nhân, chia thì bảng đã chọn không còn ảnh hưởng', () => {
    const c = toConfig({ ops: ['add', 'sub'], table: '2-5', range: 10 });
    expect(c.table).toBe('none');
    expect(defaultTitle(c)).toBe('Phép cộng, trừ trong phạm vi 10');
    expect(toConfig({ ops: ['mul'], table: '2-5' }).table).toBe('2-5');
  });

  it('mỗi nút chọn nhanh nhận ra đúng cấu hình của mình', () => {
    for (const preset of PRESETS) {
      const c = toConfig({ ...preset.config, count: 30 });
      expect(PRESETS.filter((p) => matchesPreset(c, p)).map((p) => p.id)).toEqual([preset.id]);
    }
  });

  it('tiêu đề mặc định theo lựa chọn', () => {
    expect(defaultTitle(config())).toBe('Phép cộng, trừ trong phạm vi 20');
    expect(defaultTitle(config({ ops: ['mul', 'div'], table: '2-5' }))).toBe(
      'Bảng nhân, chia 2–5',
    );
    expect(defaultTitle(config({ form: 'so-sanh' }))).toBe('So sánh các số trong phạm vi 20');
    expect(defaultTitle(config({ ops: ['add', 'mul'], table: '6-9' }))).toBe('Phép cộng, nhân');
  });
});
