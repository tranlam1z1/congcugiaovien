import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import fontkit from '@pdf-lib/fontkit';
import { describe, expect, it } from 'vitest';
import { A4 } from '@/core/print/paper';
import { VOCAB } from '@/core/vocab/packs';
import {
  fitSize,
  geometry,
  MARGIN_MM,
  MAX_CARDS,
  parseCards,
  PER_PAGE,
  sheets,
  toText,
  visualOf,
  type PerPage,
} from './cards';
import { DEFAULTS, resolve } from './options';

const entries = VOCAB.flatMap((p) => p.entries);

const loadFont = (path: string) =>
  fontkit.create(readFileSync(createRequire(import.meta.url).resolve(path)));

describe('gói từ vựng', () => {
  it('mỗi chủ đề 8 từ, đủ phiên âm và nghĩa, không trùng trong chủ đề', () => {
    for (const pack of VOCAB) {
      expect(pack.entries, pack.label).toHaveLength(8);
      expect(new Set(pack.entries.map((e) => e.word)).size, pack.label).toBe(8);
      for (const e of pack.entries) {
        expect(e.word, pack.label).toMatch(/^[a-z-]+$/);
        expect(e.ipa, e.word).toMatch(/^\/[^/]+\/$/);
        expect(e.meaning.length, e.word).toBeGreaterThan(0);
      }
    }
  });

  it('font Andika có đủ mọi ký hiệu phiên âm', () => {
    const font = loadFont('@expo-google-fonts/andika/400Regular/Andika_400Regular.ttf');
    const missing = [...new Set(entries.flatMap((e) => [...e.ipa]))].filter(
      (c) => !font.hasGlyphForCodePoint(c.codePointAt(0)!),
    );
    expect(missing).toEqual([]);
  });

  it('đổi sang chữ rồi đọc lại không mất gì', () => {
    for (const pack of VOCAB) expect(parseCards(toText(pack.entries))).toEqual(pack.entries);
  });
});

describe('đọc danh sách thẻ', () => {
  it('phiên âm và nghĩa không bắt buộc', () => {
    expect(parseCards('cat\n\n dog |  con   chó \nfish | /fɪʃ/\npig|[pɪɡ]|con lợn')).toEqual([
      { word: 'cat', ipa: '', meaning: '' },
      { word: 'dog', ipa: '', meaning: 'con chó' },
      { word: 'fish', ipa: '/fɪʃ/', meaning: '' },
      { word: 'pig', ipa: '[pɪɡ]', meaning: 'con lợn' },
    ]);
  });

  it('bỏ dòng không có từ, giới hạn số thẻ và độ dài', () => {
    expect(parseCards('| /x/ | y')).toEqual([]);
    expect(parseCards('a\n'.repeat(MAX_CARDS + 5))).toHaveLength(MAX_CARDS);
    expect(parseCards('x'.repeat(100))[0]!.word).toHaveLength(30);
  });
});

describe('hình của thẻ', () => {
  const card = (word: string, meaning = '') => ({ word, ipa: '', meaning });

  it('màu, số, biểu tượng hoặc không có hình', () => {
    expect(visualOf(card('Red'))).toMatchObject({ kind: 'colour' });
    expect(visualOf(card('seven'))).toEqual({ kind: 'number', digits: '7' });
    expect(visualOf(card('cat'))).toMatchObject({ kind: 'icon' });
    expect(visualOf(card('grandmother'))).toBeNull();
    expect(visualOf(card('constructor'))).toBeNull();
  });

  it('orange là màu hay quả cam tùy nghĩa', () => {
    expect(visualOf(card('orange', 'màu cam'))).toMatchObject({ kind: 'colour' });
    expect(visualOf(card('orange', 'quả cam'))).toMatchObject({ kind: 'icon' });
  });
});

describe('xếp thẻ vào trang', () => {
  const cards = parseCards(toText(VOCAB[0]!.entries));

  it('mặt sau đảo cột để lật theo cạnh dài vẫn đúng thẻ', () => {
    const [front, back] = sheets(cards.slice(0, 3), 4, true);
    expect(front!.slots.map((c) => c?.word ?? null)).toEqual(['cat', 'dog', 'fish', null]);
    expect(back!.slots.map((c) => c?.word ?? null)).toEqual(['dog', 'cat', null, 'fish']);
  });

  it('mọi cỡ: đủ thẻ, trang trước sau xen kẽ, lưới nằm trong lề', () => {
    for (const perPage of Object.keys(PER_PAGE).map(Number) as PerPage[]) {
      const { columns, rows, width, height } = geometry(perPage);
      expect(columns * rows).toBe(perPage);
      expect(columns * width).toBeLessThanOrEqual(A4.portrait.width - 2 * MARGIN_MM);
      expect(rows * height).toBeLessThanOrEqual(A4.portrait.height - 2 * MARGIN_MM);
      const pages = sheets(cards, perPage, true);
      expect(pages.map((p) => p.side)).toEqual(
        pages.map((_, i) => (i % 2 ? 'back' : 'front')),
      );
      const words = (side: string) =>
        pages
          .filter((p) => p.side === side)
          .flatMap((p) => p.slots.flatMap((c) => c?.word ?? []))
          .sort();
      expect(words('front')).toEqual(cards.map((c) => c.word).sort());
      expect(words('back')).toEqual(words('front'));
      expect(sheets(cards, perPage, false)).toHaveLength(pages.length / 2);
    }
    expect(sheets([], 4, true)).toEqual([]);
  });

  it('cỡ chữ ước lượng không làm từ dài tràn thẻ', () => {
    const font = loadFont(
      '@expo-google-fonts/be-vietnam-pro/700Bold/BeVietnamPro_700Bold.ttf',
    );
    const words = [
      ...entries.map((e) => e.word),
      'extraordinarily',
      'international',
      'W'.repeat(30),
      'MUMMY',
      'ELEPHANT',
      'Wednesday',
    ];
    for (const word of words) {
      const size = fitSize(word, 85, 40);
      const widthMm =
        (font.layout(word).advanceWidth / font.unitsPerEm) * size * (25.4 / 72);
      expect(widthMm, word).toBeLessThanOrEqual(86);
    }
  });

  it('tùy chọn đã lưu sai được đưa về giá trị hợp lệ', () => {
    expect(resolve({ ...DEFAULTS, perPage: 5, front: 'x' as never })).toMatchObject({
      perPage: 6,
      front: 'hinh-tu',
    });
  });
});
