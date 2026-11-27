import { describe, expect, it } from 'vitest';
import { flatten } from '@/core/handwriting/cursive';
import { missingPrint, printShape, strokeDots } from './printFont';

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = LOWER.toUpperCase();
const DIGITS = '0123456789';
const MARKS = `.,!?'"-:;()/+=’‘“”–—`;

/** Mực thấp nhất và cao nhất của một ký tự, tính theo khoảng dòng. */
const extent = (char: string) => {
  const { rise, drop } = printShape(char);
  return { rise, drop };
};

describe('chữ in một nét', () => {
  it('có đủ chữ cái, chữ số và dấu câu thường dùng', () => {
    const all = LOWER + UPPER + DIGITS + MARKS;
    expect(missingPrint(all)).toEqual([]);
    for (const char of all) {
      expect(printShape(char).commands.length, char).toBeGreaterThan(1);
    }
  });

  it('báo ký tự không có và bỏ qua khi dựng', () => {
    expect(missingPrint('café 汉 汉 ok')).toEqual(['é', '汉']);
    expect(printShape('汉').commands).toEqual([]);
    expect(printShape('a汉b')).toEqual(printShape('ab'));
  });

  it('chữ thường nằm giữa đường chân và đường giữa', () => {
    for (const char of 'acemnorsuvwxz') {
      expect(extent(char).rise, char).toBeCloseTo(1, 1);
      expect(extent(char).drop, char).toBeCloseTo(0, 1);
    }
  });

  it('chữ hoa, chữ số và nét khuyết chạm đúng dòng trên cùng', () => {
    for (const char of UPPER + DIGITS + 'bdhkl') {
      expect(extent(char).rise, char).toBeCloseTo(2, 1);
      expect(extent(char).drop, char).toBeCloseTo(0, 1);
    }
  });

  it('nét xuống chạm dòng dưới cùng', () => {
    for (const char of 'gjpqy') {
      expect(extent(char).drop, char).toBeCloseTo(1, 1);
    }
  });

  it('không nét nào ra ngoài bốn dòng kẻ quá một chút, không lấn sang trái', () => {
    for (const char of LOWER + UPPER + DIGITS + MARKS) {
      const shape = printShape(char);
      expect(shape.rise, char).toBeLessThanOrEqual(2.1);
      expect(shape.drop, char).toBeLessThanOrEqual(1.05);
      for (const [x] of flatten(shape.commands).flat()) {
        expect(x, char).toBeGreaterThanOrEqual(-2);
        expect(x, char).toBeLessThanOrEqual(shape.maxX + 2);
      }
    }
  });

  it('các chữ nối tiếp nhau, dấu cách rộng thêm', () => {
    const width = (text: string) => printShape(text).maxX;
    expect(width('ab')).toBeGreaterThan(width('a') + width('b'));
    expect(width('a b')).toBeGreaterThan(width('ab'));
    expect(width('a ')).toBe(width('a'));
  });
});

describe('chữ chấm', () => {
  it('đầu và cuối nét đều có chấm', () => {
    const dots = strokeDots(printShape('l').commands, 30);
    expect(dots[0]).toEqual([0, 200]);
    expect(dots.at(-1)).toEqual([0, 0]);
    // 200 đơn vị chia khoảng 30: 7 khoảng, 8 chấm.
    expect(dots).toHaveLength(8);
  });

  it('chỗ hai nét chạm nhau không có chấm chồng lên nhau', () => {
    for (const char of 'abdeAB8') {
      const dots = strokeDots(printShape(char).commands, 20);
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const gap = Math.hypot(dots[i]![0] - dots[j]![0], dots[i]![1] - dots[j]![1]);
          expect(gap, char).toBeGreaterThanOrEqual(12);
        }
      }
    }
  });

  it('dấu chấm của chữ i vẫn hiện khi chấm thưa', () => {
    const dots = strokeDots(printShape('i').commands, 50);
    expect(dots.some(([, y]) => y > 130)).toBe(true);
  });
});
