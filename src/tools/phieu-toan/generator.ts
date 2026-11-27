/**
 * Sinh đề toán lớp 1–3 (PRD 4.1). Logic thuần, cùng seed và cấu hình cho cùng kết quả.
 * Quy tắc (PRD 4.0): trừ không ra số âm, chia luôn chia hết, không trùng câu trong một phiếu.
 */
import { createRng, type Rng } from '@/core/rng';

export const OPS = ['add', 'sub', 'mul', 'div'] as const;
export type Op = (typeof OPS)[number];

export const OP_SIGN: Record<Op, string> = { add: '+', sub: '−', mul: '×', div: ':' };
export const OP_NAME: Record<Op, string> = { add: 'cộng', sub: 'trừ', mul: 'nhân', div: 'chia' };

export const RANGES = [10, 20, 50, 100, 1000] as const;
export type Range = (typeof RANGES)[number];

/** 'none': nhân chia theo phạm vi. Còn lại: theo bảng, thừa số thứ hai từ 1 đến 10. */
export const TABLES = ['none', '2-5', '6-9', '2-9'] as const;
export type Table = (typeof TABLES)[number];

export const FORMS = ['ngang', 'doc', 'o-trong', 'so-sanh'] as const;
export type Form = (typeof FORMS)[number];

export const MAX_COUNT = 100;

export type MathConfig = {
  ops: Op[];
  range: Range;
  table: Table;
  form: Form;
  /** Dạng so sánh: một vế là phép tính thay vì hai số. */
  compareExpressions: boolean;
  count: number;
};

export type Calc = { op: Op; a: number; b: number; result: number };
export type Blank = 'a' | 'b' | 'result';
export type Sign = '<' | '>' | '=';

export type CalcQuestion = Calc & { kind: 'calc'; hidden: Blank };
export type CompareQuestion = { kind: 'compare'; left: number | Calc; right: number; sign: Sign };
export type Question = CalcQuestion | CompareQuestion;

const includes = <T>(list: readonly T[], value: unknown): value is T =>
  list.includes(value as T);

/** Dữ liệu lưu trên máy có thể cũ hoặc hỏng: ép về cấu hình hợp lệ. */
export function toConfig(input: Partial<Record<keyof MathConfig, unknown>>): MathConfig {
  const ops = OPS.filter((op) => Array.isArray(input.ops) && input.ops.includes(op));
  const count = Math.floor(Number(input.count));
  // Bỏ hết nhân, chia thì lựa chọn bảng không còn tác dụng.
  const hasTable = ops.includes('mul') || ops.includes('div');
  return {
    ops: ops.length ? ops : ['add'],
    range: includes(RANGES, input.range) ? input.range : 10,
    table: hasTable && includes(TABLES, input.table) ? input.table : 'none',
    form: includes(FORMS, input.form) ? input.form : 'ngang',
    compareExpressions: input.compareExpressions === true,
    count: Number.isFinite(count) ? Math.min(MAX_COUNT, Math.max(1, count)) : 30,
  };
}

export const tableNumbers = (table: Table): number[] => {
  if (table === 'none') return [];
  const [from, to] = table.split('-').map(Number) as [number, number];
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
};

/** Một hàng của miền: toán hạng thứ nhất cố định, toán hạng thứ hai chạy từ `from` đến `to`. */
type Row = { op: Op; first: number; from: number; to: number };

function rowsFor(op: Op, { range, table }: MathConfig): Row[] {
  const rows: Row[] = [];
  const push = (first: number, from: number, to: number) => {
    if (to >= from) rows.push({ op, first, from, to });
  };
  if (op === 'add') {
    for (let a = 1; a < range; a++) push(a, 1, range - a);
  } else if (op === 'sub') {
    for (let a = 1; a <= range; a++) push(a, 1, a);
  } else if (table !== 'none') {
    for (const t of tableNumbers(table)) push(t, 1, 10);
  } else {
    // Theo phạm vi: một thừa số (hoặc số chia) có một chữ số, từ 2 đến 9.
    for (let d = 2; d <= 9; d++) push(d, 2, Math.floor(range / d));
  }
  return rows;
}

function toCalc(row: Row, second: number, table: Table): Calc {
  const { op, first } = row;
  switch (op) {
    case 'add':
      return { op, a: first, b: second, result: first + second };
    case 'sub':
      return { op, a: first, b: second, result: first - second };
    case 'mul':
      // Bảng nhân viết "2 × 7"; ngoài bảng viết số lớn trước "34 × 2".
      return table === 'none'
        ? { op, a: second, b: first, result: first * second }
        : { op, a: first, b: second, result: first * second };
    case 'div':
      return { op, a: first * second, b: first, result: second };
  }
}

const sizeOf = (rows: Row[]) => rows.reduce((sum, row) => sum + row.to - row.from + 1, 0);

/** Chọn k số khác nhau trong [0, total), không cần dựng cả mảng. */
function sampleIndexes(rng: Rng, total: number, k: number): number[] {
  const moved = new Map<number, number>();
  const picked: number[] = [];
  for (let i = 0; i < Math.min(k, total); i++) {
    const j = rng.int(i, total - 1);
    picked.push(moved.get(j) ?? j);
    moved.set(j, moved.get(i) ?? i);
  }
  return picked;
}

function calcAt(rows: Row[], index: number, table: Table): Calc {
  let rest = index;
  for (const row of rows) {
    const size = row.to - row.from + 1;
    if (rest < size) return toCalc(row, row.from + rest, table);
    rest -= size;
  }
  throw new Error(`Vị trí ${index} nằm ngoài miền`);
}

/** `count` phép tính không trùng, chia đều cho các phép đã chọn. */
function generateCalcs(rng: Rng, config: MathConfig, count: number): Calc[] {
  const pools = rng.shuffle(config.ops).map((op) => {
    const rows = rowsFor(op, config);
    return { rows, size: sizeOf(rows), take: 0 };
  });
  let remaining = Math.min(count, pools.reduce((sum, p) => sum + p.size, 0));
  while (remaining > 0) {
    for (const pool of pools) {
      if (remaining > 0 && pool.take < pool.size) {
        pool.take++;
        remaining--;
      }
    }
  }
  return rng.shuffle(
    pools.flatMap(({ rows, size, take }) =>
      sampleIndexes(rng, size, take).map((index) => calcAt(rows, index, config.table)),
    ),
  );
}

const signOf = (left: number, right: number): Sign =>
  left < right ? '<' : left > right ? '>' : '=';

/** So sánh hai số từ 0 đến phạm vi; khoảng một phần năm số câu bằng nhau. */
function compareNumbers(rng: Rng, { range, count }: MathConfig): CompareQuestion[] {
  const values = range + 1;
  const total = values * values;
  const n = Math.min(count, total);
  const equalCount = Math.min(values, Math.floor(n / 5));
  const equal = sampleIndexes(rng, values, equalCount).map((x) => [x, x] as const);
  // Cặp khác nhau: bỏ qua đường chéo x = y.
  const different = sampleIndexes(rng, values * range, n - equalCount).map((index) => {
    const x = Math.floor(index / range);
    const y = index % range;
    return [x, y >= x ? y + 1 : y] as const;
  });
  return rng
    .shuffle([...equal, ...different])
    .map(([left, right]) => ({ kind: 'compare', left, right, sign: signOf(left, right) }));
}

/** Vế trái là phép tính, vế phải là số nằm gần kết quả. */
function compareExpressions(rng: Rng, config: MathConfig): CompareQuestion[] {
  return generateCalcs(rng, config, config.count).map((calc) => {
    const { result } = calc;
    const limit = Math.max(config.range, result);
    const spread = Math.max(2, Math.round(limit / 10));
    let right = result;
    if (rng.int(1, 5) > 1) {
      const smaller = result > 0 && (result >= limit || rng.next() < 0.5);
      right = smaller
        ? rng.int(Math.max(0, result - spread), result - 1)
        : rng.int(result + 1, Math.min(limit, result + spread));
    }
    return { kind: 'compare', left: calc, right, sign: signOf(result, right) };
  });
}

/** Số câu khác nhau tối đa với cấu hình này. */
export function availableCount(config: MathConfig): number {
  if (config.form === 'so-sanh' && !config.compareExpressions) return (config.range + 1) ** 2;
  return config.ops.reduce((sum, op) => sum + sizeOf(rowsFor(op, config)), 0);
}

/** Trả về `min(config.count, availableCount(config))` câu. */
export function generate(config: MathConfig, seed: number): Question[] {
  const rng = createRng(seed);
  if (config.form === 'so-sanh') {
    return config.compareExpressions ? compareExpressions(rng, config) : compareNumbers(rng, config);
  }
  return generateCalcs(rng, config, config.count).map((calc) => ({
    kind: 'calc',
    ...calc,
    hidden: config.form === 'o-trong' ? rng.pick<Blank>(['a', 'b', 'result']) : 'result',
  }));
}

export const answerOf = (question: Question): string =>
  question.kind === 'compare' ? question.sign : String(question[question.hidden]);

/** Phạm vi chỉ có tác dụng khi có cộng, trừ hoặc nhân chia không theo bảng. */
export const usesRange = ({ ops, table, form, compareExpressions }: MathConfig) =>
  (form === 'so-sanh' && !compareExpressions) ||
  table === 'none' ||
  ops.some((op) => op === 'add' || op === 'sub');

export function defaultTitle(config: MathConfig): string {
  const { ops, range, table, form, compareExpressions: expressions } = config;
  if (form === 'so-sanh' && !expressions) return `So sánh các số trong phạm vi ${range}`;
  const names = ops.map((op) => OP_NAME[op]).join(', ');
  const prefix = form === 'so-sanh' ? 'So sánh: phép' : 'Phép';
  if (usesRange(config) && table === 'none') return `${prefix} ${names} trong phạm vi ${range}`;
  if (!usesRange(config)) {
    const label = `${names} ${table.replace('-', '–')}`;
    return form === 'so-sanh' ? `So sánh: bảng ${label}` : `Bảng ${label}`;
  }
  return `${prefix} ${names}`;
}

export type Preset = {
  id: string;
  grade: 1 | 2 | 3;
  label: string;
  config: Omit<MathConfig, 'count'>;
};

const preset = (
  id: string,
  grade: Preset['grade'],
  label: string,
  config: Partial<Preset['config']> & Pick<MathConfig, 'ops' | 'range'>,
): Preset => ({
  id,
  grade,
  label,
  config: { table: 'none', form: 'ngang', compareExpressions: false, ...config },
});

/** "Chọn nhanh theo lớp". */
export const PRESETS: Preset[] = [
  preset('cong-tru-10', 1, 'Cộng trừ trong 10', { ops: ['add', 'sub'], range: 10 }),
  preset('cong-tru-20', 1, 'Cộng trừ trong 20', { ops: ['add', 'sub'], range: 20 }),
  preset('so-sanh-20', 1, 'So sánh trong 20', {
    ops: ['add', 'sub'],
    range: 20,
    form: 'so-sanh',
  }),
  preset('cong-tru-100', 2, 'Cộng trừ trong 100', { ops: ['add', 'sub'], range: 100 }),
  preset('bang-2-5', 2, 'Bảng nhân chia 2–5', {
    ops: ['mul', 'div'],
    range: 100,
    table: '2-5',
  }),
  preset('bang-6-9', 3, 'Bảng nhân chia 6–9', {
    ops: ['mul', 'div'],
    range: 100,
    table: '6-9',
  }),
];

export const matchesPreset = (config: MathConfig, { config: other }: Preset) =>
  config.form === other.form &&
  config.range === other.range &&
  config.table === other.table &&
  config.compareExpressions === other.compareExpressions &&
  config.ops.join() === other.ops.join();
