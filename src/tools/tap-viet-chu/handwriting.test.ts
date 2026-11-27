import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import {
  centreDots,
  createHandwriting,
  dotsPath,
  flatten,
  outlinePath,
  STEM,
} from './handwriting';
import { SAMPLES } from './options';

const file = createRequire(import.meta.url).resolve(
  '@expo-google-fonts/playwrite-vn/400Regular/PlaywriteVN_400Regular.ttf',
);
const font = createHandwriting(new Uint8Array(readFileSync(file)));

/** Khoảng cách ngắn nhất từ điểm tới viền chữ. */
function distanceToOutline([x, y]: [number, number], contours: [number, number][][]) {
  let best = Infinity;
  for (const contour of contours) {
    for (let i = 1; i < contour.length; i++) {
      const [ax, ay] = contour[i - 1]!;
      const [bx, by] = contour[i]!;
      const length = (bx - ax) ** 2 + (by - ay) ** 2;
      const t = length ? Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / length)) : 0;
      best = Math.min(best, Math.hypot(ax + t * (bx - ax) - x, ay + t * (by - ay) - y));
    }
  }
  return best;
}

describe('font tập viết', () => {
  it('viết được mọi mẫu có sẵn và mọi chữ tiếng Việt', () => {
    const letters =
      'aàảãáạăằẳẵắặâầẩẫấậbcdđeèẻẽéẹêềểễếệghiìỉĩíịklmnoòỏõóọôồổỗốộơờởỡớợpqrstuùủũúụưừửữứựvxyỳỷỹýỵ';
    const all = [letters, letters.toLocaleUpperCase('vi'), ...SAMPLES.map((s) => s.text)].join(' ');
    expect(font.missing(all)).toEqual([]);
    for (const char of letters + letters.toLocaleUpperCase('vi')) {
      expect(font.shape(char).commands.length, char).toBeGreaterThan(0);
    }
  });

  it('báo ký tự font không có', () => {
    expect(font.missing('bé 汉 😀 汉')).toEqual(['汉', '😀']);
    expect(font.shape('汉').commands).toEqual([]);
  });

  it('chữ thường cao một đơn vị, chữ hoa và nét khuyết khoảng 2,5, nét xuống 1,5', () => {
    expect(font.shape('a').rise).toBeCloseTo(1, 1);
    expect(font.shape('a').drop).toBeCloseTo(0, 1);
    expect(font.shape('l').rise).toBeCloseTo(2.5, 0);
    expect(font.shape('B').rise).toBeCloseTo(2.5, 0);
    expect(font.shape('g').drop).toBeCloseTo(1.5, 0);
    // Dấu nặng nằm dưới đường chân, dấu sắc cao hơn chữ.
    expect(font.shape('ạ').drop).toBeGreaterThan(0.2);
    expect(font.shape('á').rise).toBeGreaterThan(1.4);
  });

  it('chữ ghép dùng nét nối: rộng khác tổng các chữ rời', () => {
    const joined = font.shape('ong');
    expect(joined.maxX - joined.minX).toBeGreaterThan(1000);
    expect(font.shape('Bé  yêu').maxX).toBeGreaterThan(font.shape('Bé').maxX);
  });

  it('đường nét bắt đầu từ x = 0 và trục y hướng xuống', () => {
    const shape = font.shape('l');
    const numbers = outlinePath(shape, 0.02)
      .match(/-?\d+(\.\d+)?/g)!
      .map(Number);
    const xs = numbers.filter((_, i) => i % 2 === 0);
    const ys = numbers.filter((_, i) => i % 2 === 1);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(-0.5);
    // Cao khoảng 2,55 × 500 đơn vị × 0,02 ≈ 25,5 mm, nằm phía trên đường chân.
    expect(Math.min(...ys)).toBeCloseTo(-25.5, 0);
    expect(Math.max(...ys)).toBeLessThan(1);
  });

  it('chấm nằm trong lòng nét và không dính nhau', () => {
    for (const text of ['a', 'l', 'ng', 'Ẫ', 'Q', '8']) {
      const { commands } = font.shape(text);
      const outline = flatten(commands, 16);
      const spacing = 60;
      const dots = centreDots(commands, spacing);
      expect(dots.length, text).toBeGreaterThan(10);
      const offCentre = dots.filter(
        (dot) => Math.abs(distanceToOutline(dot, outline) - STEM / 2) > STEM / 3,
      );
      // Chỗ nét giao nhau được phép lệch.
      expect(offCentre.length / dots.length, text).toBeLessThan(0.2);
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const gap = Math.hypot(dots[i]![0] - dots[j]![0], dots[i]![1] - dots[j]![1]);
          expect(gap, text).toBeGreaterThanOrEqual(spacing);
        }
      }
    }
  });

  it('chấm thưa hơn thì ít chấm hơn', () => {
    const shape = font.shape('mẹ');
    const count = (spacing: number) => dotsPath(shape, 0.02, spacing).split('M').length - 1;
    expect(count(1)).toBeGreaterThan(count(2));
    expect(count(2)).toBeGreaterThan(10);
  });
});
