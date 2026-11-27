import { describe, expect, it } from 'vitest';
import type { Student } from '@/core/classes/model';
import { PRINT_FONTS } from '@/core/print/fonts';
import { A4 } from '@/core/print/paper';
import { createRng } from '@/core/rng';
import { groupCount, makeGroups, parsePairs, type Config, type Pair } from './group';
import { columnsFor, layoutGroups } from './layout';

const students = (genders: Student['gender'][]): Student[] =>
  genders.map((gender, i) => ({ name: `Em ${i + 1}`, gender }));

const config = (patch: Partial<Config> = {}): Config => ({
  by: 'groups',
  value: 4,
  balance: false,
  pickLeader: true,
  avoid: [],
  names: [],
  ...patch,
});

const spread = (values: number[]) => Math.max(...values) - Math.min(...values);

describe('số nhóm', () => {
  it('theo số nhóm hoặc số em mỗi nhóm', () => {
    expect(groupCount(30, 'groups', 4)).toBe(4);
    expect(groupCount(3, 'groups', 10)).toBe(3);
    expect(groupCount(30, 'size', 4)).toBe(8);
    expect(groupCount(0, 'size', 4)).toBe(0);
    expect(groupCount(5, 'groups', 0)).toBe(1);
  });
});

describe('chia nhóm', () => {
  it('đúng quy tắc trên 3.000 lớp ngẫu nhiên', () => {
    const rng = createRng(5);
    for (let i = 0; i < 3000; i++) {
      const list = students(
        Array.from({ length: rng.int(1, 45) }, () =>
          rng.pick<Student['gender']>(['nam', 'nu', 'nam', 'nu', null]),
        ),
      );
      const c = config({
        by: rng.pick(['groups', 'size'] as const),
        value: rng.int(1, 10),
        balance: rng.next() < 0.5,
        pickLeader: rng.next() < 0.5,
      });
      const { groups } = makeGroups(list, c, rng.int(0, 999999));
      expect(groups).toHaveLength(groupCount(list.length, c.by, c.value));
      // Mỗi em đúng một nhóm.
      expect(groups.flatMap((g) => g.members).sort((a, b) => a - b)).toEqual(list.map((_, j) => j));
      expect(spread(groups.map((g) => g.members.length))).toBeLessThanOrEqual(1);
      if (c.by === 'size') {
        for (const g of groups) expect(g.members.length).toBeLessThanOrEqual(c.value);
      }
      if (c.balance) {
        for (const gender of ['nam', 'nu', null]) {
          const counts = groups.map(
            (g) => g.members.filter((m) => list[m]!.gender === gender).length,
          );
          expect(spread(counts)).toBeLessThanOrEqual(1);
        }
      }
      for (const g of groups) {
        expect(g.leader).toBe(c.pickLeader ? g.members[0] : null);
      }
    }
  }, 60_000);

  it('tách được mọi cặp khi có thể, trên 1.000 lớp ngẫu nhiên', () => {
    const rng = createRng(9);
    for (let i = 0; i < 1000; i++) {
      const list = students(
        Array.from({ length: rng.int(12, 40) }, () => rng.pick(['nam', 'nu'] as const)),
      );
      // Mỗi em nằm trong nhiều nhất một cặp, 4 nhóm trở lên: luôn tách được.
      const order = rng.shuffle(list.map((_, j) => j));
      const avoid: Pair[] = Array.from({ length: rng.int(1, 5) }, (_, p) => [
        order[2 * p]!,
        order[2 * p + 1]!,
      ]);
      const c = config({ value: rng.int(4, 6), balance: rng.next() < 0.5, avoid });
      const { groups, violations } = makeGroups(list, c, i);
      expect(violations).toEqual([]);
      for (const [a, b] of avoid) {
        expect(groups.some((g) => g.members.includes(a) && g.members.includes(b))).toBe(false);
      }
    }
  }, 60_000);

  it('không thể tách thì báo đúng các cặp còn chung nhóm', () => {
    const list = students(Array(6).fill(null));
    // Ba em đôi một không chung nhóm mà chỉ có hai nhóm.
    const { groups, violations } = makeGroups(
      list,
      config({
        value: 2,
        avoid: [
          [0, 1],
          [1, 2],
          [0, 2],
        ],
      }),
      1,
    );
    expect(violations).toHaveLength(1);
    const [a, b] = violations[0]!;
    expect(groups.some((g) => g.members.includes(a) && g.members.includes(b))).toBe(true);
  });

  it('cùng seed ra cùng kết quả; đặt tên nhóm', () => {
    const list = students(Array(20).fill('nam'));
    const c = config({ names: ['Sơn Ca', ' '] });
    expect(makeGroups(list, c, 3)).toEqual(makeGroups(list, c, 3));
    expect(makeGroups(list, c, 3)).not.toEqual(makeGroups(list, c, 4));
    expect(makeGroups(list, c, 3).groups.map((g) => g.name)).toEqual([
      'Sơn Ca',
      'Nhóm 2',
      'Nhóm 3',
      'Nhóm 4',
    ]);
  });
});

describe('cặp không ngồi chung', () => {
  const list: Student[] = ['Lê An', 'Lê Ân', 'Võ Chi', 'Võ Chi'].map((name) => ({
    name,
    gender: null,
  }));

  it('ưu tiên khớp đúng dấu, không thì so không dấu', () => {
    expect(parsePairs('Lê An - Lê Ân', list).pairs).toEqual([[0, 1]]);
    // "vo chi" khớp cả hai em trùng tên.
    expect(parsePairs('lê ân, vo chi', list).pairs).toEqual([
      [1, 2],
      [1, 3],
    ]);
  });

  it('dòng sai được báo lại', () => {
    expect(parsePairs('Lê An\nLê An - Ai Đó\n\nVõ Chi, Võ Chi', list)).toEqual({
      pairs: [[2, 3]],
      unknown: ['Lê An', 'Lê An - Ai Đó'],
    });
  });
});

describe('xếp trang', () => {
  it('không mất em nào, kể cả một nhóm 80 em, với mọi font', () => {
    const list = students(Array(80).fill(null));
    for (const count of [1, 7, 30]) {
      const { groups } = makeGroups(list, config({ value: count }), 1);
      for (const font of PRINT_FONTS) {
        for (const large of [false, true]) {
          for (const page of [A4.portrait, A4.landscape]) {
            const columns = columnsFor(25, page, { font, large });
            const pages = layoutGroups(groups, columns, page, { font, large });
            expect(
              pages
                .flat(2)
                .flatMap((c) => c.members)
                .sort((a, b) => a - b),
            ).toEqual(list.map((_, i) => i));
          }
        }
      }
    }
  });
});
