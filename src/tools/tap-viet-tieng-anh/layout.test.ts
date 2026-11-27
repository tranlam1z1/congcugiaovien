import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { createHandwriting } from '@/core/handwriting/cursive';
import { MAX_LINES, MAX_PAGES, parseLines } from '@/core/handwriting/lines';
import { AREA_WIDTH, buildRows, geometry, layoutPages, scaleOf } from './layout';
import { DEFAULTS, resolve, SIZES, type Options } from './options';
import { pictureFor } from '@/core/vocab/pictures';
import { PACKS, SAMPLES } from './words';
import { cursiveWriter, printWriter, type Writer } from './writer';

const file = createRequire(import.meta.url).resolve(
  '@expo-google-fonts/playwrite-vn/400Regular/PlaywriteVN_400Regular.ttf',
);
const cursive = cursiveWriter(createHandwriting(new Uint8Array(readFileSync(file))));
const writers: [string, Writer][] = [
  ['chữ in', printWriter],
  ['chữ nối', cursive],
];

const build = (options: Partial<Options>, writer = printWriter) => {
  const settings = resolve({ ...DEFAULTS, ...options });
  const rows = buildRows(parseLines(options.text ?? DEFAULTS.text), settings, writer);
  return { settings, rows, ...layoutPages(rows, settings, writer) };
};

describe('mẫu và gói từ vựng', () => {
  const texts = [...SAMPLES, ...PACKS].map((s) => s.text).join(' ');

  it('cả hai kiểu chữ viết được hết', () => {
    for (const [name, writer] of writers) expect(writer.missing(texts), name).toEqual([]);
  });

  it('gói từ phủ đủ lớp 1–5, không trùng mã', () => {
    expect(new Set(PACKS.map((p) => p.label.slice(0, 5)))).toEqual(
      new Set(['Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5']),
    );
    expect(new Set(PACKS.map((p) => p.id)).size).toBe(PACKS.length);
  });
});

describe('hình minh họa', () => {
  it('nhận đúng một từ, không phân biệt hoa thường, nhận số nhiều', () => {
    expect(pictureFor('cat')).toBeDefined();
    expect(pictureFor(' Apple ')).toBe(pictureFor('apple'));
    expect(pictureFor('apples')).toBe(pictureFor('apple'));
    expect(pictureFor('buses')).toBe(pictureFor('bus'));
    expect(pictureFor('ice cream')).toBeDefined();
  });

  it('không đoán cho câu, từ lạ hay tên thuộc tính của đối tượng', () => {
    for (const line of ['I like cats', 'zzz', 'a', '', 'constructor', 'toString']) {
      expect(pictureFor(line), line).toBeUndefined();
    }
  });
});

describe('dòng 4 kẻ', () => {
  it('chừa cột hình cho mọi dòng của từ, chỉ vẽ hình ở dòng đầu', () => {
    const { rows } = build({ text: 'cat\nzzz', rows: 2, blanks: 1 });
    expect(rows.map((r) => [r.text, r.start > 0, Boolean(r.picture), r.at.length > 0])).toEqual([
      ['cat', true, true, true],
      ['cat', true, false, true],
      ['cat', true, false, false],
      ['zzz', false, false, true],
      ['zzz', false, false, true],
      ['zzz', false, false, false],
    ]);
    expect(build({ text: 'cat', pictures: false }).rows.every((r) => !r.picture && !r.start)).toBe(
      true,
    );
  });

  it('câu chỉ vừa một lần mỗi dòng thì chỉ dòng đầu in đậm', () => {
    const models = (text: string) => build({ text, rows: 3, blanks: 0 }).rows.map((r) => r.model);
    expect(models('a')).toEqual([true, true, true]);
    expect(models('This is my new school bag.')).toEqual([true, false, false]);
  });

  it('mọi cỡ và kiểu chữ: không tràn ngang, không tràn trang', () => {
    const text = [
      ...SAMPLES.map((s) => s.text),
      'elephant\numbrella',
      'The quick brown fox jumps over the lazy dog. '.repeat(4),
      'W'.repeat(90),
    ].join('\n');
    for (const [name, writer] of writers) {
      for (const size of SIZES) {
        const label = `${name} ${size} mm`;
        const { rows, pages, settings } = build({ text, size, rows: 1, blanks: 0 }, writer);
        const area = geometry(settings, writer);
        expect(area.perPage, label).toBeGreaterThanOrEqual(3);
        for (const row of rows) {
          const { minX, maxX } = writer.shape(row.text);
          const width = (maxX - minX) * scaleOf(settings, writer);
          for (const x of row.at) {
            expect(x, label).toBeGreaterThan(row.start);
            expect(x + width, `${label} ${row.text}`).toBeLessThanOrEqual(AREA_WIDTH);
          }
        }
        for (const page of pages) {
          expect(page.length * area.pitch - area.gap, label).toBeLessThanOrEqual(area.height);
        }
      }
    }
  });

  it('giới hạn số trang và báo số dòng bị bỏ', () => {
    const { rows, pages, dropped } = build({ text: 'a\n'.repeat(MAX_LINES), size: 10, rows: 10 });
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
      lettering: 'x' as never,
      size: 7,
      style: 'rong' as never,
      fade: -5,
      rows: 99,
      title: '',
    });
    expect(settings).toMatchObject({
      lettering: 'print',
      size: 6,
      style: 'cham',
      fade: 0,
      rows: 10,
      title: 'Luyện viết tiếng Anh',
    });
  });
});
