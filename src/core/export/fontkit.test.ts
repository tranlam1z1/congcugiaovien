import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PRINT_FONTS } from '../print/fonts';
import { pdfFontkit } from './fontkit';

type Glyph = { id: number; path: { toSVG: () => string } };
type Font = {
  glyphForCodePoint: (code: number) => Glyph;
  getGlyph: (id: number) => Glyph;
  createSubset: () => {
    includeGlyph: (glyph: Glyph) => number;
    encodeStream: () => NodeJS.ReadableStream;
  };
};

const open = (data: Uint8Array) =>
  (pdfFontkit.create as unknown as (data: Uint8Array) => Font)(data);

const VIETNAMESE =
  'aàảãáạăằẳẵắặâầẩẫấậbcdđeèẻẽéẹêềểễếệghiìỉĩíịklmnoòỏõóọôồổỗốộơờởỡớợpqrstuùủũúụưừửữứựvxyỳỷỹýỵ';
const CHARS = [
  ...new Set([...VIETNAMESE, ...VIETNAMESE.toUpperCase(), ...'0123456789×−–:<>=+().·,?“”']),
];

/** Mọi file font có thể được nhúng vào PDF. */
function fontFiles() {
  const root = 'node_modules/@expo-google-fonts';
  const packages = [...PRINT_FONTS.map((font) => font.id as string)];
  return packages.flatMap((name) =>
    ['400Regular', '700Bold'].flatMap((weight) => {
      try {
        const dir = `${root}/${name}/${weight}`;
        const file = readdirSync(dir).find((f) => f.endsWith('.ttf'))!;
        return [{ label: `${name} ${weight}`, path: `${dir}/${file}` }];
      } catch {
        return []; // Font không có bản đậm.
      }
    }),
  );
}

const collect = (stream: NodeJS.ReadableStream) =>
  new Promise<Uint8Array>((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });

describe('font cắt bớt trong PDF', () => {
  const files = fontFiles();

  it('tìm đủ file của các font in', () => {
    expect(files.length).toBeGreaterThanOrEqual(PRINT_FONTS.length);
  });

  it.each(files)('$label giữ nguyên nét mọi chữ tiếng Việt', async ({ path }) => {
    const font = open(readFileSync(path));
    // Thứ tự đưa glyph vào quyết định vị trí trong file, thử cả hai chiều.
    for (const chars of [CHARS, [...CHARS].reverse()]) {
      const subset = font.createSubset();
      const picked = chars.map((c) => {
        const glyph = font.glyphForCodePoint(c.codePointAt(0)!);
        return { c, glyph, newId: subset.includeGlyph(glyph) };
      });
      const result = open(await collect(subset.encodeStream()));
      const broken = picked.filter(
        ({ glyph, newId }) => result.getGlyph(newId).path.toSVG() !== glyph.path.toSVG(),
      );
      expect(broken.map((b) => b.c).join('')).toBe('');
    }
  });
});
