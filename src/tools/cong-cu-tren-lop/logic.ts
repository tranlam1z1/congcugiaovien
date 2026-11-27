/** Logic thuần của vòng quay, bốc thăm, đếm ngược và đo tiếng ồn. */

// ---------------------------------------------------------------- Gọi không lặp

/**
 * Các mục chưa được gọi. Mỗi lần gọi chỉ trừ một mục, nên hai em trùng tên
 * vẫn được gọi đủ hai lần.
 */
export function remaining(items: readonly string[], called: readonly string[]) {
  const used = new Map<string, number>();
  for (const name of called) used.set(name, (used.get(name) ?? 0) + 1);
  return items.filter((item) => {
    const left = used.get(item) ?? 0;
    used.set(item, left - 1);
    return left <= 0;
  });
}

/** Phần lịch sử còn khớp với danh sách hiện tại (danh sách có thể đã sửa). */
export function keepKnown(items: readonly string[], called: readonly string[], once: boolean) {
  const left = new Map<string, number>();
  for (const item of items) left.set(item, (left.get(item) ?? 0) + 1);
  return called.filter((name) => {
    const count = left.get(name) ?? 0;
    if (once) left.set(name, count - 1);
    return count > 0;
  });
}

/** Vị trí ngẫu nhiên, mọi mục cơ hội như nhau. `random` trả về số trong [0, 1). */
export const pickIndex = (length: number, random: () => number = Math.random) =>
  Math.min(length - 1, Math.floor(random() * length));

export function shuffled<T>(items: readonly T[], random: () => number = Math.random) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = pickIndex(i + 1, random);
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

// ---------------------------------------------------------------- Vòng quay

export const SPIN_TURNS = 5;

const modulo = (value: number, by: number) => ((value % by) + by) % by;

/**
 * Góc quay mới (độ, theo chiều kim đồng hồ) để ô `index` dừng dưới kim ở đỉnh vòng.
 * `offset` trong (-0.5, 0.5) là độ lệch so với giữa ô, tính theo bề rộng ô.
 */
export function spinTo(
  previous: number,
  index: number,
  count: number,
  offset = 0,
  turns = SPIN_TURNS,
) {
  const slice = 360 / count;
  const target = -(index + 0.5 + offset) * slice;
  return previous + turns * 360 + modulo(target - previous, 360);
}

/** Tên ngắn để ghi trên vòng: giữ hai tiếng cuối, cắt nếu vẫn dài. */
export function wheelLabel(name: string, max = 14) {
  const short = name.length > max ? name.split(' ').slice(-2).join(' ') : name;
  return short.length > max ? `${short.slice(0, max - 1)}…` : short;
}

// ---------------------------------------------------------------- Đếm ngược

export * from '@/core/present/timer';

// ---------------------------------------------------------------- Đo tiếng ồn

export const YELLOW_FROM = 40;
export const RED_FROM = 70;

/** Biên độ hiệu dụng của một khung âm thanh (mẫu trong [-1, 1]). */
export function rms(samples: ArrayLike<number>) {
  let sum = 0;
  for (let i = 0; i < samples.length; i++) sum += samples[i]! * samples[i]!;
  return samples.length ? Math.sqrt(sum / samples.length) : 0;
}

/**
 * Mức ồn 0–100 từ biên độ: -60 đến -10 dB so với mức tối đa của micro.
 * `sensitivity` 1–100, càng cao càng dễ lên đèn đỏ. Chỉ để so sánh, không phải đề-xi-ben thật.
 */
export function noiseLevel(amplitude: number, sensitivity: number) {
  if (amplitude <= 0) return 0;
  const db = 20 * Math.log10(amplitude) + (sensitivity - 50) * 0.6;
  return Math.max(0, Math.min(100, (db + 60) * 2));
}

/** Lên nhanh, xuống từ từ để đèn không nhấp nháy. */
export const smooth = (previous: number, next: number) =>
  previous + (next - previous) * (next > previous ? 0.5 : 0.1);

export type Light = 'green' | 'yellow' | 'red';

export const lightOf = (level: number): Light =>
  level >= RED_FROM ? 'red' : level >= YELLOW_FROM ? 'yellow' : 'green';
