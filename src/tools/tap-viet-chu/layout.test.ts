import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { createHandwriting } from '@/core/handwriting/cursive';
import { MAX_LINES, MAX_PAGES, parseLines } from '@/core/handwriting/lines';
import { buildRows, grid, layoutPages, scaleOf } from './layout';
import { CELLS, DEFAULTS, resolve, SAMPLES, SIZES, type Options } from './options';

const file = createRequire(import.meta.url).resolve(
  '@expo-google-fonts/playwrite-vn/400Regular/PlaywriteVN_400Regular.ttf',
);
const font = createHandwriting(new Uint8Array(readFileSync(file)));

const build = (options: Partial<Options>) => {
  const settings = resolve({ ...DEFAULTS, ...options });
  const lines = parseLines(options.text ?? DEFAULTS.text);
  const rows = buildRows(lines, settings, font.shape);
  return { settings, rows, ...layoutPages(rows, settings) };
};

describe('dòng tập viết', () => {
  it('font viết được mọi mẫu có sẵn', () => {
    expect(font.missing(SAMPLES.map((s) => s.text).join(' '))).toEqual([]);
  });

  it('mỗi mẫu có đúng số dòng chữ và dòng trống', () => {
    const { rows } = build({ text: 'a\nb', rows: 3, blanks: 2 });
    expect(rows.map((r) => (r.at.length ? r.text : `(${r.text})`))).toEqual([
      'a', 'a', 'a', '(a)', '(a)', 'b', 'b', 'b', '(b)', '(b)',
    ]);
  });

  it('lặp chữ cho đầy dòng, mỗi chữ bắt đầu đúng đường ô', () => {
    const { rows, settings } = build({ text: 'a', blanks: 0 });
    const [row] = rows;
    expect(row!.at.length).toBeGreaterThan(5);
    for (const x of row!.at) expect(x % settings.cell).toBe(0);
    expect(build({ text: 'a', repeat: false }).rows[0]!.at).toHaveLength(1);
  });

  it('dòng nào cũng có mẫu đậm; câu chỉ vừa một lần thì các dòng sau để tô', () => {
    const models = (options: Partial<Options>) =>
      build({ blanks: 0, rows: 3, ...options }).rows.map((r) => r.model);
    expect(models({ text: 'a' })).toEqual([true, true, true]);
    expect(models({ text: 'Uống nước nhớ' })).toEqual([true, false, false]);
    expect(models({ text: 'a', repeat: false })).toEqual([true, false, false]);
    expect(models({ text: 'a', boldFirst: false })).toEqual([false, false, false]);
  });

  it('chữ cao hoặc có nét xuống thì dòng cao hơn', () => {
    const cells = (text: string) => build({ text }).rows[0]!;
    expect(cells('a')).toMatchObject({ cells: 3, baseline: 3 });
    expect(cells('B')).toMatchObject({ cells: 6, baseline: 6 });
    expect(cells('g')).toMatchObject({ cells: 6, baseline: 3 });
  });

  it('mọi cỡ chữ và cỡ ô: không tràn ngang, không tràn trang, nét không lấn dòng khác', () => {
    const text = [
      ...SAMPLES.map((s) => s.text),
      'Nghiêng nghiêng Ẫ Ỗ Ỵ g y ' + 'Công cha như núi Thái Sơn '.repeat(6),
      'khuỷuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu',
    ].join('\n');
    for (const size of SIZES) {
      for (const cell of CELLS) {
        const label = `${size} ô × ${cell} mm`;
        const { rows, pages, settings } = build({ text, size, cell, rows: 1, blanks: 0 });
        const area = grid(settings);
        expect(area.header + area.height, label).toBeLessThanOrEqual(277);
        expect(area.width, label).toBeLessThanOrEqual(190);
        for (const row of rows) {
          const shape = font.shape(row.text);
          const width = (shape.maxX - shape.minX) * scaleOf(settings);
          for (const x of row.at) {
            expect(x + width, `${label} ${row.text}`).toBeLessThanOrEqual(area.width);
          }
          // Nét được lấn tối đa 0,25 ô sang phần liền kề.
          expect(shape.rise * size, `${label} ${row.text}`).toBeLessThanOrEqual(row.baseline + 0.25);
          expect(shape.drop * size, `${label} ${row.text}`).toBeLessThanOrEqual(
            row.cells - row.baseline + 0.25,
          );
        }
        for (const page of pages) {
          const used = page.reduce((sum, row) => sum + row.cells, 0);
          expect(used, label).toBeLessThanOrEqual(area.rows);
        }
      }
    }
  });

  it('giới hạn số trang và báo số dòng bị bỏ', () => {
    const { rows, pages, dropped } = build({
      text: 'B\n'.repeat(MAX_LINES),
      size: 3,
      cell: 8,
      rows: 10,
    });
    expect(pages).toHaveLength(MAX_PAGES);
    expect(pages.flat().length + dropped).toBe(rows.length);
  });

  it('nội dung trống hoặc toàn ký tự lạ thì không có trang', () => {
    expect(build({ text: '' }).pages).toEqual([]);
    expect(build({ text: '汉字' }).pages).toEqual([]);
  });

  it('tùy chọn đã lưu sai được đưa về giá trị hợp lệ', () => {
    const settings = resolve({
      ...DEFAULTS,
      size: 9,
      cell: 0,
      paper: 'x' as never,
      style: 'x' as never,
      color: 'x' as never,
      fade: 500,
      rows: -1,
      blanks: NaN,
      title: '   ',
    });
    expect(settings).toMatchObject({
      size: 2,
      cell: 5,
      paper: 'o-ly',
      style: 'mo',
      fade: 90,
      rows: 1,
      blanks: 1,
      title: 'Luyện viết chữ',
    });
  });
});
