import { describe, expect, it } from 'vitest';
import { createRng } from '@/core/rng';
import { ART_SIZE, CELL_COUNTS, COLORS, PICTURES, pictureGrid } from './art';
import {
  EVERY_PAGE,
  expressionPools,
  generate,
  OPERATIONS,
  pictureFor,
  RANGES,
  textOf,
  toConfig,
  valueOf,
  type Config,
} from './generator';

describe('tranh', () => {
  it('đủ 14 hình 8×8, chỉ dùng màu đã khai báo, 2 đến 5 màu', () => {
    expect(PICTURES).toHaveLength(14);
    expect(new Set(PICTURES.map((p) => p.id)).size).toBe(14);
    for (const picture of PICTURES) {
      expect(picture.rows, picture.id).toHaveLength(ART_SIZE);
      for (const line of picture.rows) expect(line, picture.id).toHaveLength(ART_SIZE);
      const colors = new Set(picture.rows.join(''));
      for (const color of colors) expect(Object.keys(COLORS), picture.id).toContain(color);
      expect(colors.size).toBeGreaterThanOrEqual(2);
      expect(colors.size).toBeLessThanOrEqual(5);
    }
  });

  it('mở rộng đúng số ô', () => {
    for (const picture of PICTURES) {
      for (const count of CELL_COUNTS) {
        const grid = pictureGrid(picture, count);
        expect(grid.flat()).toHaveLength(count);
        expect(new Set(grid.map((line) => line.length)).size).toBe(1);
      }
    }
  });
});

describe('biểu thức', () => {
  it('đúng phạm vi, không âm, chia hết, không trùng', () => {
    for (const operation of OPERATIONS) {
      for (const range of RANGES) {
        const pools = expressionPools(operation, range);
        // Đủ kết quả khác nhau cho tranh nhiều màu nhất.
        expect(pools.size).toBeGreaterThanOrEqual(5);
        for (const [result, pool] of pools) {
          expect(new Set(pool.map(textOf)).size).toBe(pool.length);
          for (const expression of pool) {
            expect(valueOf(expression)).toBe(result);
            expect(Number.isInteger(result) && result >= 0).toBe(true);
            expect(Math.max(expression.a, expression.b, result)).toBeLessThanOrEqual(range);
          }
        }
      }
    }
  });
});

it('1.000 lần sinh: mỗi màu một kết quả riêng, ô nào cũng tính ra đúng màu', () => {
  const rng = createRng(2026);
  for (let i = 0; i < 1000; i++) {
    const config: Config = {
      operation: rng.pick(OPERATIONS),
      range: rng.pick(RANGES),
      picture: rng.pick(PICTURES).id,
      cells: rng.pick(CELL_COUNTS),
    };
    const sheet = generate(config, config.picture, rng.int(0, 999999));
    const results = new Map(sheet.legend.map((l) => [l.color, l.result]));
    expect(new Set(results.values()).size).toBe(sheet.legend.length);

    const expected = pictureGrid(PICTURES.find((p) => p.id === config.picture)!, config.cells);
    expect(sheet.cells.map((line) => line.map((c) => c.color))).toEqual(expected);

    const pools = expressionPools(config.operation, config.range);
    for (const [color, result] of results) {
      const used = sheet.cells.flat().filter((c) => c.color === color);
      for (const { expression } of used) expect(valueOf(expression)).toBe(result);
      // Chỉ lặp khi đã dùng hết các cách viết.
      expect(new Set(used.map((c) => textOf(c.expression))).size).toBe(
        Math.min(used.length, pools.get(result)!.length),
      );
    }
  }
});

it('mỗi trang một hình khác cho tới khi hết 14 hình', () => {
  const config = toConfig({});
  const ids = Array.from({ length: 14 }, (_, i) => pictureFor(config, 5, i).id);
  expect(new Set(ids).size).toBe(14);
  expect(pictureFor(config, 5, 14).id).toBe(ids[0]);
});

it('cùng seed cho cùng kết quả', () => {
  const config = toConfig({ operation: 'cong-tru', range: 100 });
  expect(generate(config, 'ga-con', 9)).toEqual(generate(config, 'ga-con', 9));
  expect(generate(config, 'ga-con', 9)).not.toEqual(generate(config, 'ga-con', 10));
});

it('ép tùy chọn đã lưu về hợp lệ', () => {
  expect(toConfig({ operation: 'x', range: 7, picture: 'khong-co', cells: 3 })).toEqual({
    operation: 'cong',
    range: 10,
    picture: EVERY_PAGE,
    cells: 64,
  });
});
