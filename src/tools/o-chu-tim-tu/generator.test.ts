import { describe, expect, it } from 'vitest';
import { createRng } from '@/core/rng';
import {
  cellsOf,
  DIRECTIONS,
  generate,
  LEVELS,
  MAX_ENTRIES,
  MAX_SIZE,
  MIN_SIZE,
  parseEntries,
  SAMPLE_WORDS,
  toConfig,
  wordCount,
  type Crossword,
  type Entry,
  type WordSearch,
} from './generator';

const sample = parseEntries(SAMPLE_WORDS).entries;

const POOL = parseEntries(
  [
    'con mèo', 'con chó', 'quả na', 'lá cờ', 'bó hoa', 'ghế gỗ', 'nhà lá', 'tổ chim', 'xe đạp',
    'sư tử', 'chú khỉ', 'thỏ trắng', 'nghiêng', 'khuỷu tay', 'mẹ', 'bố', 'ông bà', 'đồng hồ',
    'ba ba', 'cá', 'ca', 'an', 'bàn', 'chuồn chuồn', 'hoa hướng dương', 'apple', 'school', 'book',
  ]
    .map((word, i) => `${word} | gợi ý số ${i}`)
    .join('\n'),
).entries;

/** 1.000 cấu hình ngẫu nhiên: mọi cỡ lưới, độ khó, tập từ. */
function* cases(kind: 'tim-tu' | 'o-chu') {
  const rng = createRng(2026);
  for (let i = 0; i < 1000; i++) {
    const entries: Entry[] = rng.shuffle(POOL).slice(0, rng.int(1, 16));
    const config = { kind, size: rng.int(MIN_SIZE, MAX_SIZE), level: rng.pick(LEVELS) };
    yield { entries, config, seed: rng.int(0, 999999) };
  }
}

describe('parseEntries', () => {
  it('giữ dấu, viết hoa, bỏ khoảng trắng và dấu câu', () => {
    const [entry] = parseEntries('  Trường   học! | Nơi em học ').entries;
    expect(entry).toEqual({
      word: 'Trường học!',
      clue: 'Nơi em học',
      letters: ['T', 'R', 'Ư', 'Ờ', 'N', 'G', 'H', 'Ọ', 'C'],
    });
  });

  it('chữ gõ dạng dấu rời vẫn là một ô mỗi chữ', () => {
    expect(parseEntries('ớt'.normalize('NFD')).entries[0]!.letters).toEqual(['Ớ', 'T']);
  });

  it('bỏ trùng, đếm dòng không dùng được và dòng vượt giới hạn', () => {
    const many = Array.from({ length: MAX_ENTRIES + 3 }, (_, i) => `từ${i}`);
    expect(parseEntries('cá\n\nCÁ | gì\na\n???').entries).toHaveLength(1);
    expect(parseEntries('cá\n\nCÁ | gì\na\n???').dropped).toBe(2);
    expect(parseEntries(many.join('\n')).dropped).toBe(3);
  });
});

describe('tìm từ', () => {
  it('1.000 lần sinh: lưới đúng cỡ, chứa đủ từ đúng hướng, từ bị loại được báo', () => {
    for (const { entries, config, seed } of cases('tim-tu')) {
      const puzzle = generate(entries, config, seed) as WordSearch;
      expect(puzzle.grid).toHaveLength(config.size);
      for (const line of puzzle.grid) {
        expect(line).toHaveLength(config.size);
        expect(line.every((c) => c !== '')).toBe(puzzle.words.length > 0);
      }
      for (const word of puzzle.words) {
        expect(DIRECTIONS[config.level]).toContainEqual(word.step);
        expect(cellsOf(word).map(([r, c]) => puzzle.grid[r]![c])).toEqual(word.letters);
      }
      expect(puzzle.words.length + puzzle.rejected.length).toBe(entries.length);
      for (const { word, reason } of puzzle.rejected) {
        const long = entries.find((e) => e.word === word)!.letters.length > config.size;
        expect(reason).toBe(long ? 'long' : 'space');
      }
    }
  });

  it('danh sách mẫu xếp đủ trên lưới 12 ô ở mọi độ khó', () => {
    for (const level of LEVELS) {
      for (let seed = 0; seed < 100; seed++) {
        const puzzle = generate(sample, { kind: 'tim-tu', size: 12, level }, seed);
        expect(puzzle.rejected).toEqual([]);
      }
    }
  });
});

describe('ô chữ', () => {
  it('1.000 lần sinh: chữ đúng chỗ, mọi dãy ô liền nhau là một từ, các từ nối liền', () => {
    for (const { entries, config, seed } of cases('o-chu')) {
      const puzzle = generate(entries, config, seed) as Crossword;
      expect(Math.max(puzzle.rows, puzzle.columns)).toBeLessThanOrEqual(config.size);
      expect(wordCount(puzzle) + puzzle.rejected.length).toBe(entries.length);

      const covered = new Set<string>();
      const runs = (clues: typeof puzzle.across, dr: number, dc: number) => {
        const found: string[] = [];
        for (let r = 0; r < puzzle.rows; r++) {
          for (let c = 0; c < puzzle.columns; c++) {
            if (!puzzle.grid[r]![c] || puzzle.grid[r - dr]?.[c - dc]) continue;
            let n = 0;
            while (puzzle.grid[r + dr * n]?.[c + dc * n]) n++;
            if (n > 1) found.push(`${r},${c},${n}`);
          }
        }
        for (const clue of clues) {
          clue.letters.forEach((letter, i) => {
            const [r, c] = [clue.row + dr * i, clue.column + dc * i];
            expect(puzzle.grid[r]![c]).toBe(letter);
            covered.add(`${r},${c}`);
          });
        }
        expect(found.sort()).toEqual(
          clues.map((k) => `${k.row},${k.column},${k.letters.length}`).sort(),
        );
      };
      runs(puzzle.across, 0, 1);
      runs(puzzle.down, 1, 0);

      const filled = puzzle.grid.flat().filter(Boolean).length;
      expect(covered.size).toBe(filled);
      if (filled) {
        // Loang từ một ô phải tới được mọi ô.
        const [start] = covered;
        const seen = new Set([start!]);
        const queue = [start!];
        while (queue.length) {
          const [r, c] = queue.pop()!.split(',').map(Number) as [number, number];
          for (const key of [`${r + 1},${c}`, `${r - 1},${c}`, `${r},${c + 1}`, `${r},${c - 1}`]) {
            if (covered.has(key) && !seen.has(key)) {
              seen.add(key);
              queue.push(key);
            }
          }
        }
        expect(seen.size).toBe(filled);
      }

      const numbers = [...puzzle.across, ...puzzle.down].map((c) => c.number);
      const unique = [...new Set(numbers)].sort((a, b) => a - b);
      expect(unique).toEqual(unique.map((_, i) => i + 1));
    }
  });

  it('từ không có gợi ý bị loại và được báo', () => {
    const entries = parseEntries('con cá | bơi\ncon gà').entries;
    const puzzle = generate(entries, { kind: 'o-chu', size: 10, level: 'de' }, 1);
    expect(puzzle.rejected).toEqual([{ word: 'con gà', reason: 'no-clue' }]);
  });

  it('danh sách mẫu xếp được phần lớn số từ', () => {
    for (let seed = 0; seed < 50; seed++) {
      const puzzle = generate(sample, { kind: 'o-chu', size: 15, level: 'de' }, seed);
      expect(wordCount(puzzle)).toBeGreaterThanOrEqual(10);
    }
  });
});

it('cùng seed cho cùng kết quả, khác seed cho lưới khác', () => {
  for (const kind of ['tim-tu', 'o-chu'] as const) {
    const config = { kind, size: 14, level: 'kho' as const };
    expect(generate(sample, config, 7)).toEqual(generate(sample, config, 7));
    expect(generate(sample, config, 7)).not.toEqual(generate(sample, config, 8));
  }
});

it('ép tùy chọn đã lưu về hợp lệ', () => {
  expect(toConfig({ kind: 'x', level: 3, size: 99 })).toEqual({
    kind: 'tim-tu',
    level: 'vua',
    size: MAX_SIZE,
  });
  expect(toConfig({ size: 'abc' }).size).toBe(12);
});

it('danh sách rỗng không gây lỗi', () => {
  for (const kind of ['tim-tu', 'o-chu'] as const) {
    expect(wordCount(generate([], { kind, size: 10, level: 'de' }, 1))).toBe(0);
  }
});
