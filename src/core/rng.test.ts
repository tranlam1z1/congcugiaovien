import { describe, expect, it } from 'vitest';
import { paginate } from './print/paper';
import { createRng, deriveSeed, randomSeed } from './rng';
import { parseStudentList } from './studentList';

const sample = (seed: number) => {
  const rng = createRng(seed);
  return Array.from({ length: 20 }, () => rng.int(0, 1000));
};

describe('rng', () => {
  it('cùng seed ra cùng kết quả, khác seed ra khác', () => {
    expect(sample(123456)).toEqual(sample(123456));
    expect(sample(123456)).not.toEqual(sample(123457));
  });

  it('int nằm trong khoảng và chạm cả hai đầu', () => {
    const rng = createRng(1);
    const values = new Set(Array.from({ length: 1000 }, () => rng.int(2, 5)));
    expect([...values].sort()).toEqual([2, 3, 4, 5]);
  });

  it('shuffle giữ đủ phần tử và không sửa mảng gốc', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8];
    const shuffled = createRng(7).shuffle(items);
    expect(items).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect([...shuffled].sort()).toEqual(items);
  });

  it('seed của các phiếu khác nhau, seed mới có 6 chữ số', () => {
    const seeds = Array.from({ length: 60 }, (_, i) => deriveSeed(100001, i));
    expect(new Set(seeds).size).toBe(60);
    expect(String(randomSeed())).toHaveLength(6);
  });
});

describe('chia trang và danh sách học sinh', () => {
  it('paginate không làm mất mục', () => {
    expect(paginate([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(paginate([], 4)).toEqual([]);
    expect(paginate([1, 2], 0)).toEqual([[1], [2]]);
  });

  it('đọc danh sách, bỏ dòng trống và khoảng trắng thừa', () => {
    expect(parseStudentList(' Nguyễn  An \r\n\r\n\tTrần Bình\n')).toEqual([
      'Nguyễn An',
      'Trần Bình',
    ]);
  });
});
