import { describe, expect, it } from 'vitest';
import { DEFAULTS, PAGE_SIZES, placeLogo, POSITIONS, resolve, type Options } from './options';
import { drawPaper, getPaperType, PAPERS, redMarginX } from './papers';
import { toPaths, type Area, type Segment } from './pen';

const A4: Area = { x: 10, y: 10, width: 190, height: 277 };

const draw = (id: string, area = A4, size?: number, major?: number) => {
  const type = getPaperType(id);
  return drawPaper(type, area, {
    size: size ?? type.defaultSize,
    major: major ?? type.major ?? 0,
    columns: 3,
  });
};

/** Tung độ các đường ngang, đã bỏ trùng. */
const horizontals = (segments: Segment[]) =>
  [...new Set(segments.filter((s) => s.y1 === s.y2).map((s) => s.y1))].sort((a, b) => a - b);
const verticals = (segments: Segment[]) =>
  [...new Set(segments.filter((s) => s.x1 === s.x2).map((s) => s.x1))].sort((a, b) => a - b);
const gaps = (values: number[]) => values.slice(1).map((v, i) => v - values[i]!);

describe('giấy in', () => {
  it('đủ các loại liệt kê trong PRD', () => {
    expect(PAPERS).toHaveLength(33);
    expect(new Set(PAPERS.map((p) => p.id)).size).toBe(PAPERS.length);
  });

  it('mọi loại, mọi cỡ, mọi khổ giấy đều vẽ gọn trong vùng cho phép', () => {
    const areas: Area[] = [
      A4,
      ...[...PAGE_SIZES, { width: 50, height: 50 }, { width: 600, height: 80 }].flatMap((p) => [
        { x: 5, y: 5, width: p.width - 10, height: p.height - 10 },
        { x: 0, y: 0, width: p.height, height: p.width },
      ]),
    ];
    const problems: string[] = [];
    for (const type of PAPERS) {
      for (const area of areas) {
        for (const size of type.sizes.length ? type.sizes : [type.defaultSize]) {
          const { segments, labels } = drawPaper(type, area, { size, major: 5, columns: 4 });
          // Mẫu có tiêu đề cần giấy đủ lớn; chỉ kiểm trên giấy từ A6.
          if (area.width < 90 || area.height < 120) continue;
          const inside = (x: number, y: number) =>
            x >= area.x - 0.02 &&
            x <= area.x + area.width + 0.02 &&
            y >= area.y - 0.02 &&
            y <= area.y + area.height + 0.02;
          const outside = segments.find((s) => !inside(s.x1, s.y1) || !inside(s.x2, s.y2));
          if (outside || labels.some((l) => !inside(l.x, l.y))) {
            problems.push(`${type.id} ${size} ${area.width}x${area.height}`);
          }
          if (type.id !== 'trang') expect(segments.length, type.id).toBeGreaterThan(0);
        }
      }
    }
    expect(problems).toEqual([]);
  });

  it('ô ly đúng cỡ từng mm, canh giữa, kẻ đậm đúng nhịp', () => {
    for (const size of [3, 4, 5, 6, 8, 10]) {
      const { segments } = draw('o-ly', A4, size, 4);
      const ys = horizontals(segments);
      const xs = verticals(segments);
      for (const gap of [...gaps(ys), ...gaps(xs)]) expect(gap).toBeCloseTo(size, 9);
      expect(xs).toHaveLength(Math.floor(190 / size) + 1);
      expect(xs[0]! - A4.x).toBeCloseTo(A4.x + A4.width - xs.at(-1)!, 9);
      const major = horizontals(segments.filter((s) => s.stroke === 'major'));
      for (const gap of gaps(major)) expect(gap).toBeCloseTo(size * 4, 9);
    }
  });

  it('giấy milimét cách nhau đúng 1 mm, đậm mỗi 10 mm', () => {
    const { segments } = draw('milimet');
    for (const gap of gaps(horizontals(segments))) expect(gap).toBeCloseTo(1, 9);
    for (const gap of gaps(verticals(segments.filter((s) => s.stroke === 'major')))) {
      expect(gap).toBeCloseTo(10, 9);
    }
  });

  it('tam giác isometric và lục giác có cạnh đúng cỡ', () => {
    const hex = draw('luc-giac', A4, 6).segments;
    for (const s of hex) expect(Math.hypot(s.x2 - s.x1, s.y2 - s.y1)).toBeCloseTo(6, 9);
    const iso = draw('isometric', A4, 6).segments;
    for (const s of iso) {
      const angle = Math.abs((Math.atan2(s.y2 - s.y1, s.x2 - s.x1) * 180) / Math.PI) % 180;
      expect([30, 90, 150].some((a) => Math.abs(angle - a) < 0.001)).toBe(true);
    }
    for (const gap of gaps(verticals(iso))) expect(gap).toBeCloseTo((6 * Math.sqrt(3)) / 2, 9);
  });

  it('lề đỏ nằm trên đường kẻ của giấy ô', () => {
    const type = getPaperType('o-ly');
    const x = redMarginX(type, A4, 210, 5);
    expect(verticals(draw('o-ly', A4, 5).segments).some((v) => Math.abs(v - x) < 1e-9)).toBe(true);
    expect(Math.abs(x - 25)).toBeLessThanOrEqual(2.5);
    expect(redMarginX(getPaperType('ke-ngang'), A4, 210, 8)).toBe(25);
  });

  it('gom nét cùng kiểu thành một path', () => {
    const paths = toPaths(draw('o-ly').segments);
    expect(paths.map((p) => p.stroke).sort()).toEqual(['major', 'minor']);
    expect(paths.every((p) => p.d.startsWith('M'))).toBe(true);
  });
});

describe('tùy chọn', () => {
  const options = (patch: Partial<Options>) => resolve({ ...DEFAULTS, ...patch });

  it('khổ chuẩn xoay theo hướng, khổ tùy chỉnh giữ nguyên', () => {
    expect(options({ page: 'a5', orientation: 'landscape' })).toMatchObject({
      width: 210,
      height: 148,
    });
    expect(
      options({ page: 'custom', customWidth: 300, customHeight: 100, orientation: 'portrait' }),
    ).toMatchObject({ width: 300, height: 100, orientation: 'landscape' });
    expect(options({ page: 'custom', customWidth: 9999, customHeight: 1 })).toMatchObject({
      width: 600,
      height: 50,
    });
  });

  it('giá trị hỏng về mặc định; cỡ không hợp loại giấy thì dùng cỡ của loại', () => {
    expect(options({ type: 'zz', size: 7, opacity: NaN, pages: 900 })).toMatchObject({
      size: 5,
      major: 4,
      opacity: 0.45,
      pages: 50,
    });
    expect(options({ type: 'dien-tu', size: 5 }).size).toBe(18);
  });

  it('đầu phiếu đẩy vùng kẻ xuống', () => {
    expect(options({}).area.y).toBe(10);
    expect(options({ title: 'A', showNameLine: true }).area.y).toBe(35);
    // Khổ nhỏ, tiêu đề dài xuống nhiều dòng nên chừa nhiều hơn.
    const long = { title: 'x'.repeat(60) };
    expect(options({ ...long, page: 'a6' }).area.y).toBeGreaterThan(options(long).area.y);
  });

  it('logo nằm trong trang ở cả 9 vị trí', () => {
    for (const { value } of POSITIONS) {
      const { left, top } = placeLogo(
        value,
        { width: 40, height: 20 },
        { width: 210, height: 297 },
        10,
      );
      expect(left).toBeGreaterThanOrEqual(10);
      expect(left + 40).toBeLessThanOrEqual(200);
      expect(top).toBeGreaterThanOrEqual(10);
      expect(top + 20).toBeLessThanOrEqual(287);
    }
  });
});
