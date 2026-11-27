/** Đọc danh sách thẻ, chọn hình và xếp thẻ vào trang. Kích thước tính bằng mm. */
import { A4, paginate } from '@/core/print/paper';
import { textWidthEm } from '@/core/print/textWidth';
import { pictureFor } from '@/core/vocab/pictures';
import type { VocabEntry } from '@/core/vocab/packs';
import type { LucideIcon } from 'lucide-react';

export type Card = VocabEntry;

export const MAX_CARDS = 120;
export const MAX_WORD = 30;
export const MAX_IPA = 40;
export const MAX_MEANING = 60;

const clean = (text: string, max: number) =>
  text.normalize('NFC').replace(/\s+/g, ' ').trim().slice(0, max).trim();

/**
 * Mỗi dòng một thẻ: "word | /phiên âm/ | nghĩa". Phiên âm và nghĩa không bắt buộc;
 * phần thứ hai không mở đầu bằng "/" hoặc "[" được hiểu là nghĩa.
 */
export function parseCards(text: string): Card[] {
  const cards: Card[] = [];
  for (const line of text.split(/\r?\n/)) {
    const [first = '', ...rest] = line.split('|').map((part) => part.trim());
    const word = clean(first, MAX_WORD);
    if (!word) continue;
    const hasIpa = /^[/[]/.test(rest[0] ?? '');
    cards.push({
      word,
      ipa: hasIpa ? clean(rest[0]!, MAX_IPA) : '',
      meaning: clean(rest.slice(hasIpa ? 1 : 0).filter(Boolean).join(', '), MAX_MEANING),
    });
    if (cards.length === MAX_CARDS) break;
  }
  return cards;
}

export const toText = (entries: readonly VocabEntry[]) =>
  entries
    .map((e) => [e.word, e.ipa, e.meaning].filter(Boolean).join(' | '))
    .join('\n');

const COLOURS: Record<string, string> = {
  red: '#dc2626',
  blue: '#2563eb',
  green: '#16a34a',
  yellow: '#facc15',
  pink: '#f472b6',
  orange: '#f97316',
  black: '#111827',
  white: '#ffffff',
  purple: '#9333ea',
  brown: '#92400e',
  grey: '#9ca3af',
  gray: '#9ca3af',
};

const NUMBERS = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen',
  'nineteen', 'twenty',
];

export type Visual =
  | { kind: 'colour'; colour: string }
  | { kind: 'number'; digits: string }
  | { kind: 'icon'; icon: LucideIcon }
  | null;

/** Hình của thẻ. "orange" là màu khi nghĩa bắt đầu bằng "màu", không thì là quả cam. */
export function visualOf({ word, meaning }: Card): Visual {
  const key = word.toLowerCase();
  const colour = Object.hasOwn(COLOURS, key) ? COLOURS[key] : undefined;
  if (colour && (key !== 'orange' || /^màu/i.test(meaning) || !meaning)) {
    return { kind: 'colour', colour };
  }
  const number = NUMBERS.indexOf(key);
  if (number >= 0) return { kind: 'number', digits: String(number) };
  const icon = pictureFor(word);
  return icon ? { kind: 'icon', icon } : null;
}

export const PER_PAGE = {
  4: { columns: 2, rows: 2 },
  6: { columns: 2, rows: 3 },
  8: { columns: 2, rows: 4 },
} as const;
export type PerPage = keyof typeof PER_PAGE;

export const MARGIN_MM = 10;

export function geometry(perPage: PerPage) {
  const { columns, rows } = PER_PAGE[perPage];
  const width = (A4.portrait.width - 2 * MARGIN_MM) / columns;
  // Chừa một mm để làm tròn không đẩy hàng cuối ra ngoài trang.
  const height = Math.floor((A4.portrait.height - 2 * MARGIN_MM - 1) / rows);
  return { columns, rows, width, height };
}

export type Side = 'front' | 'back';
export type Sheet = { side: Side; slots: (Card | null)[] };

/**
 * Các trang in. Có mặt sau thì mỗi trang mặt trước đi kèm một trang mặt sau, đảo thứ tự
 * cột để in hai mặt lật theo cạnh dài vẫn đúng thẻ.
 */
export function sheets(cards: Card[], perPage: PerPage, backs: boolean): Sheet[] {
  const { columns } = PER_PAGE[perPage];
  return paginate(cards, perPage).flatMap((page) => {
    const slots = Array.from({ length: perPage }, (_, i) => page[i] ?? null);
    const front: Sheet = { side: 'front', slots };
    if (!backs) return [front];
    const mirrored = slots.map(
      (_, i) => slots[i - (i % columns) + (columns - 1 - (i % columns))] ?? null,
    );
    return [front, { side: 'back', slots: mirrored }];
  });
}

/** Chữ đậm rộng hơn chữ thường chừng này. */
const BOLD = 1.08;
const MM_PER_PT = 25.4 / 72;

/** Cỡ chữ (pt) để từ rộng nhất trong đoạn vẫn vừa bề ngang `width` mm. */
export function fitSize(text: string, width: number, base: number) {
  const widest = Math.max(0.5, ...text.split(' ').map(textWidthEm));
  return Math.min(base, Math.floor(width / (widest * BOLD * MM_PER_PT)));
}
