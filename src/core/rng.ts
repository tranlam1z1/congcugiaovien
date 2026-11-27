/** Sinh số ngẫu nhiên có seed: cùng seed luôn ra cùng bộ đề. */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = {
  /** [0, 1) */
  next: () => number;
  /** Số nguyên trong [min, max], gồm cả hai đầu. */
  int: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
  /** Trả về bản sao đã xáo trộn. */
  shuffle: <T>(items: readonly T[]) => T[];
};

export function createRng(seed: number): Rng {
  const next = mulberry32(seed);
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  return {
    next,
    int,
    pick: (items) => {
      if (items.length === 0) throw new Error('pick: danh sách rỗng');
      return items[int(0, items.length - 1)]!;
    },
    shuffle: (items) => {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = int(0, i);
        [copy[i], copy[j]] = [copy[j]!, copy[i]!];
      }
      return copy;
    },
  };
}

/** Mã seed 6 chữ số, đủ ngắn để giáo viên chép lại. */
export const randomSeed = () => 100000 + Math.floor(Math.random() * 900000);

/** Seed riêng cho phiếu thứ `index` khi in nhiều bản khác nhau. */
export const deriveSeed = (seed: number, index: number) =>
  (seed + Math.imul(index, 0x9e3779b1)) >>> 0;
