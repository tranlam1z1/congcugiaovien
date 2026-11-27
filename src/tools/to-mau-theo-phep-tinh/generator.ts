/**
 * Gán phép tính vào từng ô tranh (PRD 4.7). Logic thuần, cùng seed cho cùng kết quả.
 * Mỗi màu một kết quả riêng; các ô cùng màu dùng lần lượt mọi biểu thức ra kết quả đó,
 * chỉ lặp khi đã hết. Trừ không ra số âm, chia luôn chia hết.
 */
import { createRng, type Rng } from '@/core/rng';
import { CELL_COUNTS, PICTURES, pictureGrid, type CellCount, type ColorId } from './art';

export const OPERATIONS = ['cong', 'tru', 'cong-tru', 'nhan', 'chia'] as const;
export type Operation = (typeof OPERATIONS)[number];

export const RANGES = [10, 20, 100] as const;
export type Range = (typeof RANGES)[number];

/** Mỗi trang một hình khác nhau. */
export const EVERY_PAGE = 'moi-trang';

export type Config = { operation: Operation; range: Range; picture: string; cells: CellCount };

/** Dữ liệu lưu trên máy có thể cũ hoặc hỏng: ép về cấu hình hợp lệ. */
export function toConfig(input: Partial<Record<keyof Config, unknown>>): Config {
  const pick = <T>(list: readonly T[], value: unknown, fallback: T) =>
    list.includes(value as T) ? (value as T) : fallback;
  return {
    operation: pick(OPERATIONS, input.operation, 'cong'),
    range: pick(RANGES, input.range, 10),
    picture: pick([EVERY_PAGE, ...PICTURES.map((p) => p.id)], input.picture, EVERY_PAGE),
    cells: pick(CELL_COUNTS, input.cells, 64),
  };
}

type BasicOp = 'cong' | 'tru' | 'nhan' | 'chia';
const SIGN: Record<BasicOp, string> = { cong: '+', tru: '−', nhan: '×', chia: ':' };

export type Expression = { a: number; b: number; op: BasicOp };

export const textOf = ({ a, b, op }: Expression) => `${a} ${SIGN[op]} ${b}`;

export const valueOf = ({ a, b, op }: Expression) =>
  op === 'cong' ? a + b : op === 'tru' ? a - b : op === 'nhan' ? a * b : a / b;

/**
 * Mọi biểu thức trong phạm vi, gom theo kết quả. Cộng, trừ dùng số từ 1;
 * nhân, chia theo bảng với thừa số, số chia, thương từ 1 đến 10.
 */
export function expressionPools(operation: Operation, range: Range) {
  const pools = new Map<number, Expression[]>();
  const add = (a: number, b: number, op: BasicOp) => {
    const result = valueOf({ a, b, op });
    const pool = pools.get(result);
    if (pool) pool.push({ a, b, op });
    else pools.set(result, [{ a, b, op }]);
  };
  const ops: BasicOp[] = operation === 'cong-tru' ? ['cong', 'tru'] : [operation];
  for (const op of ops) {
    if (op === 'cong') {
      for (let a = 1; a < range; a++) for (let b = 1; a + b <= range; b++) add(a, b, op);
    } else if (op === 'tru') {
      for (let a = 2; a <= range; a++) for (let b = 1; b < a; b++) add(a, b, op);
    } else {
      for (let x = 1; x <= 10; x++) {
        for (let y = 1; y <= 10; y++) {
          if (x * y > range) continue;
          if (op === 'nhan') add(x, y, op);
          else add(x * y, y, op);
        }
      }
    }
  }
  return pools;
}

/** Chọn `count` kết quả khác nhau, ưu tiên những số có nhiều cách viết. */
function pickResults(rng: Rng, pools: Map<number, Expression[]>, count: number) {
  const bySize = rng
    .shuffle([...pools.keys()])
    .sort((a, b) => pools.get(b)!.length - pools.get(a)!.length);
  const enough = Math.floor(pools.get(bySize[0]!)!.length * 0.4);
  const rich = bySize.filter((r) => pools.get(r)!.length >= enough);
  const candidates = rich.length >= count + 2 ? rich : bySize.slice(0, count * 2);
  return rng.shuffle(candidates).slice(0, count);
}

export type Cell = { color: ColorId; expression: Expression };

export type Worksheet = {
  pictureId: string;
  name: string;
  cells: Cell[][];
  /** Bảng màu, kết quả tăng dần. */
  legend: { color: ColorId; result: number }[];
};

/** Hình của phiếu thứ `index`: hình đã chọn, hoặc lần lượt cả bộ theo thứ tự xáo từ mã đề. */
export function pictureFor(config: Config, seed: number, index: number) {
  if (config.picture !== EVERY_PAGE) return PICTURES.find((p) => p.id === config.picture)!;
  const order = createRng(seed).shuffle(PICTURES);
  return order[index % order.length]!;
}

export function generate(config: Config, pictureId: string, seed: number): Worksheet {
  const rng = createRng(seed);
  const picture = PICTURES.find((p) => p.id === pictureId)!;
  const grid = pictureGrid(picture, config.cells);
  const counts = new Map<ColorId, number>();
  for (const color of grid.flat()) counts.set(color, (counts.get(color) ?? 0) + 1);

  const pools = expressionPools(config.operation, config.range);
  // Màu nhiều ô nhất nhận kết quả có nhiều biểu thức nhất.
  const colors = [...counts.keys()].sort((a, b) => counts.get(b)! - counts.get(a)!);
  const results = pickResults(rng, pools, colors.length).sort(
    (a, b) => pools.get(b)!.length - pools.get(a)!.length,
  );

  const queues = new Map(
    colors.map((color, i) => {
      const pool = rng.shuffle(pools.get(results[i]!)!);
      const list = Array.from({ length: counts.get(color)! }, (_, n) => pool[n % pool.length]!);
      return [color, rng.shuffle(list)];
    }),
  );

  return {
    pictureId,
    name: picture.name,
    cells: grid.map((line) =>
      line.map((color) => ({ color, expression: queues.get(color)!.pop()! })),
    ),
    legend: colors
      .map((color, i) => ({ color, result: results[i]! }))
      .sort((a, b) => a.result - b.result),
  };
}

const OPERATION_NAME: Record<Operation, string> = {
  cong: 'phép cộng',
  tru: 'phép trừ',
  'cong-tru': 'phép cộng, trừ',
  nhan: 'phép nhân',
  chia: 'phép chia',
};

export const defaultTitle = ({ operation, range }: Config) =>
  `Tô màu theo ${OPERATION_NAME[operation]} trong phạm vi ${range}`;
