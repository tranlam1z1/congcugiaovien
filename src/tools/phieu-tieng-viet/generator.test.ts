import { describe, expect, it } from 'vitest';
import { PRINT_FONTS } from '@/core/print/fonts';
import { createRng } from '@/core/rng';
import { splitSyllable } from '@/core/vi/syllable';
import {
  answersOf,
  countUnusable,
  fillChoices,
  generate,
  HIDES,
  pairOf,
  PAIRS_PER_BLOCK,
  parseLines,
  SAMPLE_SENTENCES,
  SAMPLE_WORDS,
  sentenceParts,
} from './generator';
import {
  blockRowHeight,
  contentHeight,
  layoutFill,
  layoutMatch,
  layoutOrder,
  maxColumns,
  orderHeight,
} from './layout';

const words = parseLines(SAMPLE_WORDS, 60, 30).items;
const sentences = parseLines(SAMPLE_SENTENCES, 30, 120).items;

/** Nguồn từ ngẫu nhiên, có cả từ trùng vế, từ nước ngoài, số. */
const VOCABULARY = [
  ...words,
  'con gà',
  'con bò',
  'quả cam',
  'cái ghế',
  'áo',
  'yêu',
  'nghé',
  'gì',
  'ba',
  'bà',
  'ABC',
  '123',
  'bông hoa | màu đỏ',
  'Hà Nội',
];

const randomList = (rng: ReturnType<typeof createRng>) =>
  rng.shuffle(VOCABULARY).slice(0, rng.int(0, VOCABULARY.length));

const multiset = (items: string[]) => [...items].sort();

describe('đọc danh sách', () => {
  it('bỏ dòng trống, dòng trùng và gộp khoảng trắng', () => {
    expect(parseLines(' con  cá \n\nCon cá\nlá cờ\n', 10, 30)).toEqual({
      items: ['con cá', 'lá cờ'],
      dropped: 0,
    });
  });

  it('đếm dòng quá dài hoặc vượt giới hạn', () => {
    expect(parseLines('a\nb\nc\n' + 'x'.repeat(40), 2, 30)).toEqual({
      items: ['a', 'b'],
      dropped: 2,
    });
  });
});

describe('điền âm, vần', () => {
  it('ghép chỗ trống lại đúng từ gốc trên 3.000 phiếu ngẫu nhiên', () => {
    const rng = createRng(1);
    for (let i = 0; i < 3000; i++) {
      const items = randomList(rng);
      const hide = rng.pick(HIDES);
      const sheet = generate({ form: 'dien', hide, items }, rng.int(0, 999999));
      if (sheet.form !== 'dien') throw new Error('sai dạng');
      expect(sheet.questions).toHaveLength(items.length - countUnusable(items, 'dien', hide));
      expect(new Set(sheet.questions.map((q) => q.word)).size).toBe(sheet.questions.length);
      for (const q of sheet.questions) {
        expect(q.before + q.hidden + q.after).toBe(q.word);
        expect(q.hidden).not.toBe('');
        if (hide !== 'both') expect(q.part).toBe(hide);
        expect(sheet.bank).toContain(q.hidden.toLocaleLowerCase('vi'));
      }
      expect(new Set(sheet.bank).size).toBe(sheet.bank.length);
    }
  }, 60_000);

  it('chỉ ẩn đúng một phần của một tiếng', () => {
    for (const choice of fillChoices('quả na', 'both')) {
      const whole = ['quả', 'na'].map((w) => splitSyllable(w)!);
      expect(whole.flatMap((s) => [s.onset, s.rime])).toContain(choice.hidden);
    }
    expect(fillChoices('quả na', 'onset').map((c) => c.hidden)).toEqual(['qu', 'n']);
  });

  it('từ không có âm đầu bị bỏ khi ẩn âm đầu, vẫn dùng được khi ẩn vần', () => {
    expect(countUnusable(['áo', '123'], 'dien', 'onset')).toBe(2);
    expect(countUnusable(['áo', '123'], 'dien', 'rime')).toBe(1);
  });
});

describe('nối từ', () => {
  it('tách vế theo dấu |, theo tiếng, hoặc theo âm vần', () => {
    expect(pairOf('bông hoa | màu đỏ')).toEqual({
      left: 'bông hoa',
      right: 'màu đỏ',
      word: 'bông hoa màu đỏ',
    });
    expect(pairOf('mẹ bế bé')).toMatchObject({ left: 'mẹ', right: 'bế bé' });
    expect(pairOf('nghé')).toMatchObject({ left: 'ngh', right: 'é', word: 'nghé' });
    expect(pairOf('áo')).toBeNull();
    expect(pairOf('cá |')).toBeNull();
  });

  it('nhóm nối hợp lệ trên 3.000 phiếu ngẫu nhiên', () => {
    const rng = createRng(2);
    for (let i = 0; i < 3000; i++) {
      const items = randomList(rng);
      const sheet = generate({ form: 'noi', hide: 'onset', items }, rng.int(0, 999999));
      if (sheet.form !== 'noi') throw new Error('sai dạng');
      const used = answersOf(sheet);
      expect(new Set(used).size).toBe(used.length);
      for (const { pairs, right } of sheet.blocks) {
        expect(pairs.length).toBeGreaterThanOrEqual(2);
        expect(pairs.length).toBeLessThanOrEqual(PAIRS_PER_BLOCK);
        // Cột phải đúng là các vế phải, và không vế nào lặp trong nhóm.
        expect(multiset(right)).toEqual(multiset(pairs.map((p) => p.right)));
        for (const side of ['left', 'right'] as const) {
          expect(new Set(pairs.map((p) => p[side].toLowerCase())).size).toBe(pairs.length);
        }
        expect(right).not.toEqual(pairs.map((p) => p.right));
      }
    }
  }, 60_000);

  it('danh sách mẫu dùng hết mọi từ', () => {
    for (let seed = 0; seed < 200; seed++) {
      const sheet = generate({ form: 'noi', hide: 'onset', items: words }, seed);
      expect(answersOf(sheet)).toHaveLength(words.length);
    }
  });
});

describe('sắp xếp câu', () => {
  it('đủ từ, khác thứ tự gốc', () => {
    for (let seed = 0; seed < 1000; seed++) {
      const sheet = generate({ form: 'sap-xep', hide: 'onset', items: sentences }, seed);
      if (sheet.form !== 'sap-xep') throw new Error('sai dạng');
      expect(sheet.questions).toHaveLength(sentences.length);
      for (const q of sheet.questions) {
        const original = sentenceParts(q.sentence).words;
        expect(multiset(q.words)).toEqual(multiset(original));
        expect(q.words).not.toEqual(original);
        expect(`${original.join(' ')}${q.ending}`).toBe(q.sentence);
      }
    }
  });

  it('bỏ câu một từ, giữ nguyên dấu cuối câu', () => {
    expect(sentenceParts('Bé đi học chưa?')).toEqual({
      words: ['Bé', 'đi', 'học', 'chưa'],
      ending: '?',
    });
    expect(countUnusable(['Chào!', 'Bé ngủ'], 'sap-xep', 'onset')).toBe(1);
  });

  it('cùng seed ra cùng phiếu', () => {
    for (const form of ['dien', 'noi', 'sap-xep'] as const) {
      const config = { form, hide: 'both' as const, items: form === 'sap-xep' ? sentences : words };
      expect(generate(config, 5)).toEqual(generate(config, 5));
      expect(generate(config, 5)).not.toEqual(generate(config, 6));
    }
  });
});

describe('chia trang', () => {
  const long = Array.from({ length: 30 }, (_, i) =>
    `Hôm nay bé ${i} theo mẹ ra vườn hái rau, tưới cây và bắt sâu cho đàn gà con ăn.`.slice(0, 120),
  );

  it('không mất mục và mỗi trang vừa chiều cao, với mọi font và cỡ chữ', () => {
    for (const font of PRINT_FONTS) {
      for (const large of [false, true]) {
        const style = { font, large };
        const fill = generate({ form: 'dien', hide: 'both', items: words }, 1);
        const match = generate({ form: 'noi', hide: 'both', items: words }, 1);
        const order = generate({ form: 'sap-xep', hide: 'both', items: long }, 1);
        if (fill.form !== 'dien' || match.form !== 'noi' || order.form !== 'sap-xep') continue;

        const columns = maxColumns([fill], style);
        expect(columns).toBeGreaterThanOrEqual(1);
        expect(columns).toBeLessThanOrEqual(3);
        const filled = layoutFill(fill.questions, columns, true, style);
        expect(filled.pages.flat()).toEqual(fill.questions);

        const matched = layoutMatch(match.blocks, maxColumns([match], style), style);
        expect(matched.flat(2)).toEqual(match.blocks);
        for (const page of matched) {
          const height = page.reduce((sum, row) => sum + blockRowHeight(row, large), 0);
          expect(height).toBeLessThanOrEqual(contentHeight(style));
        }

        const ordered = layoutOrder(order.questions, style);
        expect(ordered.flat()).toEqual(order.questions);
        for (const page of ordered) {
          const height = page.reduce((sum, q) => sum + orderHeight(q, style), 0);
          expect(height).toBeLessThanOrEqual(contentHeight(style));
        }
      }
    }
  });
});
