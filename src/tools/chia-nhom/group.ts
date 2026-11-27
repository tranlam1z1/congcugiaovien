/**
 * Chia nhóm ngẫu nhiên theo seed (PRD 4.5). Logic thuần:
 * sĩ số các nhóm lệch nhau nhiều nhất 1; cân bằng giới tính thì số nam và số nữ
 * mỗi nhóm cũng lệch nhiều nhất 1; cố tách các cặp không được ngồi chung.
 */
import type { Student } from '@/core/classes/model';
import { createRng, type Rng } from '@/core/rng';
import { removeDiacritics } from '@/core/vi/normalize';

export type By = 'groups' | 'size';
/** Hai vị trí trong danh sách học sinh. */
export type Pair = readonly [number, number];

export type Config = {
  by: By;
  /** Số nhóm, hoặc số em mỗi nhóm. */
  value: number;
  balance: boolean;
  pickLeader: boolean;
  avoid: Pair[];
  /** Tên đặt cho các nhóm theo thứ tự. */
  names: string[];
};

export type Group = {
  name: string;
  /** Vị trí học sinh; nhóm trưởng (nếu có) đứng đầu. */
  members: number[];
  leader: number | null;
};

export type Result = {
  groups: Group[];
  /** Các cặp vẫn phải chung nhóm vì không xếp được. */
  violations: Pair[];
};

export function groupCount(students: number, by: By, value: number) {
  if (students === 0) return 0;
  const wanted = Math.max(1, Math.floor(value) || 1);
  return by === 'groups' ? Math.min(wanted, students) : Math.ceil(students / wanted);
}

const fold = (name: string) => name.normalize('NFC').toLocaleLowerCase('vi').trim();

/**
 * Mỗi dòng hai tên: "An - Bình" hoặc "An, Bình". Tên trùng khớp cả dấu được ưu tiên,
 * không thấy thì so không dấu. Tên trùng nhau trong lớp thì áp cho mọi em trùng tên.
 */
export function parsePairs(text: string, students: Student[]) {
  const pairs: Pair[] = [];
  const unknown: string[] = [];
  const seen = new Set<string>();
  const find = (name: string) => {
    const matching = (key: (s: string) => string) =>
      students.flatMap((s, i) => (key(s.name) === key(name) ? [i] : []));
    const exact = matching(fold);
    return exact.length ? exact : matching((s) => removeDiacritics(s).trim());
  };

  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const parts = line
      .split(/\t|[,;|+]|\s[-–]\s/)
      .map((p) => p.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    const found = parts.map(find);
    if (parts.length !== 2 || found.some((f) => f.length === 0)) {
      unknown.push(line.trim());
      continue;
    }
    for (const a of found[0]!) {
      for (const b of found[1]!) {
        const key = a < b ? `${a}-${b}` : `${b}-${a}`;
        if (a !== b && !seen.has(key)) {
          seen.add(key);
          pairs.push([a, b]);
        }
      }
    }
  }
  return { pairs, unknown };
}

const together = (groupOf: number[], avoid: Pair[]) =>
  avoid.filter(([a, b]) => groupOf[a] === groupOf[b]);

/** Đổi chỗ từng em đang vi phạm với em ở nhóm khác cho tới khi hết cải thiện. */
function repair(rng: Rng, groupOf: number[], students: Student[], config: Config) {
  for (let step = 0; step < 100; step++) {
    const bad = together(groupOf, config.avoid);
    if (!bad.length) return bad;
    const pair = rng.pick(bad);
    const x = pair[rng.int(0, 1)]!;
    let best = bad.length;
    let candidates: number[] = [];
    for (let y = 0; y < groupOf.length; y++) {
      if (groupOf[y] === groupOf[x]) continue;
      // Giữ cân bằng giới tính: chỉ đổi hai em cùng giới.
      if (config.balance && students[y]!.gender !== students[x]!.gender) continue;
      [groupOf[x], groupOf[y]] = [groupOf[y]!, groupOf[x]!];
      const count = together(groupOf, config.avoid).length;
      [groupOf[x], groupOf[y]] = [groupOf[y]!, groupOf[x]!];
      if (count < best) {
        best = count;
        candidates = [y];
      } else if (count === best && candidates.length) {
        candidates.push(y);
      }
    }
    if (!candidates.length) return bad;
    const y = rng.pick(candidates);
    [groupOf[x], groupOf[y]] = [groupOf[y]!, groupOf[x]!];
  }
  return together(groupOf, config.avoid);
}

/** Chia lần lượt vào các nhóm; các em cùng giới đứng liền nhau nên được rải đều. */
function deal(rng: Rng, students: Student[], count: number, balance: boolean) {
  const all = students.map((_, i) => i);
  const order = balance
    ? (['nam', 'nu', null] as const).flatMap((gender) =>
        rng.shuffle(all.filter((i) => students[i]!.gender === gender)),
      )
    : rng.shuffle(all);
  const seats = rng.shuffle(Array.from({ length: count }, (_, i) => i));
  const groupOf: number[] = Array<number>(students.length);
  order.forEach((student, position) => {
    groupOf[student] = seats[position % count]!;
  });
  return groupOf;
}

export function makeGroups(students: Student[], config: Config, seed: number): Result {
  const count = groupCount(students.length, config.by, config.value);
  if (count === 0) return { groups: [], violations: [] };
  const rng = createRng(seed);

  let best: { groupOf: number[]; violations: Pair[] } | null = null;
  for (let attempt = 0; attempt < 200; attempt++) {
    const groupOf = deal(rng, students, count, config.balance);
    const violations = repair(rng, groupOf, students, config);
    if (!best || violations.length < best.violations.length) best = { groupOf, violations };
    if (!violations.length) break;
  }
  const { groupOf, violations } = best!;

  const groups = Array.from({ length: count }, (_, index): Group => {
    const members = rng.shuffle(students.map((_, i) => i).filter((i) => groupOf[i] === index));
    const leader = config.pickLeader ? members[0]! : null;
    return { name: config.names[index]?.trim() || `Nhóm ${index + 1}`, members, leader };
  });
  return { groups, violations };
}
