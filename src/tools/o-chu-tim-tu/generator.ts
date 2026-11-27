/**
 * Sinh bảng tìm từ và ô chữ có gợi ý (PRD 4.3). Logic thuần, cùng seed và dữ liệu cho cùng kết quả.
 * Mỗi ô giữ một chữ cái tiếng Việt có dấu; cụm từ được viết liền trong lưới.
 */
import { createRng, type Rng } from '@/core/rng';

export const KINDS = ['tim-tu', 'o-chu'] as const;
export type Kind = (typeof KINDS)[number];

export const LEVELS = ['de', 'vua', 'kho'] as const;
export type Level = (typeof LEVELS)[number];

export const MIN_SIZE = 6;
export const MAX_SIZE = 20;
export const MAX_ENTRIES = 40;
export const MAX_WORD_LENGTH = 40;
export const MAX_CLUE_LENGTH = 100;

export type Step = readonly [row: number, column: number];

/** Hướng đọc: dễ (ngang, dọc), vừa (thêm chéo đọc từ trái sang), khó (mọi hướng, kể cả ngược). */
export const DIRECTIONS: Record<Level, readonly Step[]> = {
  de: [
    [0, 1],
    [1, 0],
  ],
  vua: [
    [0, 1],
    [1, 0],
    [1, 1],
    [-1, 1],
  ],
  kho: [
    [0, 1],
    [1, 0],
    [1, 1],
    [-1, 1],
    [0, -1],
    [-1, 0],
    [-1, -1],
    [1, -1],
  ],
};

export type Entry = {
  /** Từ như giáo viên gõ. */
  word: string;
  clue: string;
  /** Chữ cái viết hoa, mỗi phần tử một ô. */
  letters: string[];
};

export type Entries = { entries: Entry[]; dropped: number };

export const lettersOf = (word: string) =>
  Array.from(word.normalize('NFC').toLocaleUpperCase('vi')).filter((c) => /[\p{L}\p{N}]/u.test(c));

/** Mỗi dòng "từ" hoặc "từ | gợi ý". Bỏ dòng trống, dòng trùng; đếm dòng không dùng được. */
export function parseEntries(text: string): Entries {
  const seen = new Set<string>();
  const entries: Entry[] = [];
  let dropped = 0;
  for (const raw of text.split(/\r?\n/)) {
    const [head = '', ...rest] = raw.normalize('NFC').split('|');
    const word = head.replace(/\s+/g, ' ').trim();
    const clue = rest.join('|').replace(/\s+/g, ' ').trim();
    if (!word && !clue) continue;
    const letters = lettersOf(word);
    const key = letters.join('');
    if (seen.has(key)) continue;
    if (
      letters.length < 2 ||
      word.length > MAX_WORD_LENGTH ||
      clue.length > MAX_CLUE_LENGTH ||
      entries.length >= MAX_ENTRIES
    ) {
      dropped++;
      continue;
    }
    seen.add(key);
    entries.push({ word, clue, letters });
  }
  return { entries, dropped };
}

export type Reason = 'long' | 'space' | 'no-clue';
export type Rejected = { word: string; reason: Reason };

export type Placement = Entry & { row: number; column: number; step: Step };

export type WordSearch = {
  kind: 'tim-tu';
  size: number;
  grid: string[][];
  words: Placement[];
  rejected: Rejected[];
};

export type Clue = Entry & { number: number; row: number; column: number };

export type Crossword = {
  kind: 'o-chu';
  rows: number;
  columns: number;
  /** null là chỗ không có ô. */
  grid: (string | null)[][];
  across: Clue[];
  down: Clue[];
  rejected: Rejected[];
};

export type Puzzle = WordSearch | Crossword;

export type Config = { kind: Kind; size: number; level: Level };

/** Dữ liệu lưu trên máy có thể cũ hoặc hỏng: ép về cấu hình hợp lệ. */
export function toConfig(input: Partial<Record<keyof Config, unknown>>): Config {
  const size = Math.round(Number(input.size));
  return {
    kind: KINDS.includes(input.kind as Kind) ? (input.kind as Kind) : 'tim-tu',
    level: LEVELS.includes(input.level as Level) ? (input.level as Level) : 'vua',
    size: Number.isFinite(size) ? Math.min(MAX_SIZE, Math.max(MIN_SIZE, size)) : 12,
  };
}

/** Xáo rồi xếp từ dài trước (sắp xếp ổn định nên từ bằng nhau vẫn ngẫu nhiên). */
const longestFirst = (rng: Rng, entries: readonly Entry[]) =>
  rng.shuffle(entries).sort((a, b) => b.letters.length - a.letters.length);

// ---------------------------------------------------------------- Tìm từ

export const cellsOf = ({ row, column, step, letters }: Placement) =>
  letters.map((_, i) => [row + step[0] * i, column + step[1] * i] as const);

/** Số đoạn ô khác nhau đọc ra đúng từ này theo các hướng cho phép. */
export function countOccurrences(
  grid: readonly (readonly string[])[],
  letters: readonly string[],
  steps: readonly Step[],
) {
  const found = new Set<string>();
  grid.forEach((line, row) =>
    line.forEach((_, column) => {
      for (const [dr, dc] of steps) {
        if (letters.every((c, i) => grid[row + dr * i]?.[column + dc * i] === c)) {
          const end = `${row + dr * (letters.length - 1)},${column + dc * (letters.length - 1)}`;
          // Từ đối xứng đọc xuôi hay ngược vẫn là một chỗ.
          found.add([`${row},${column}`, end].sort().join(';'));
        }
      }
    }),
  );
  return found.size;
}

function placeWords(rng: Rng, entries: readonly Entry[], size: number, steps: readonly Step[]) {
  const grid = Array.from({ length: size }, () => Array<string>(size).fill(''));
  const words: Placement[] = [];
  for (const entry of longestFirst(rng, entries)) {
    const free: Placement[] = [];
    const crossing: Placement[] = [];
    for (let row = 0; row < size; row++) {
      for (let column = 0; column < size; column++) {
        for (const step of steps) {
          let shared = 0;
          const fits = entry.letters.every((c, i) => {
            const cell = grid[row + step[0] * i]?.[column + step[1] * i];
            if (cell === c) shared++;
            return cell === '' || cell === c;
          });
          // Từ nằm trọn trên chữ của từ khác thì không tính là xếp được.
          if (!fits || shared === entry.letters.length) continue;
          (shared ? crossing : free).push({ ...entry, row, column, step });
        }
      }
    }
    if (!free.length && !crossing.length) continue;
    // Thỉnh thoảng ưu tiên giao nhau để lưới đan xen hơn.
    const pool = crossing.length && (!free.length || rng.next() < 0.4) ? crossing : free;
    // Chọn hướng trước để các hướng xuất hiện đều.
    const step = rng.pick([...new Set(pool.map((p) => p.step))]);
    const placed = rng.pick(pool.filter((p) => p.step === step));
    cellsOf(placed).forEach(([r, c], i) => (grid[r]![c] = placed.letters[i]!));
    words.push(placed);
  }
  return { grid, words };
}

function wordSearch(rng: Rng, entries: readonly Entry[], { size, level }: Config): WordSearch {
  const steps = DIRECTIONS[level];
  const usable = entries.filter((e) => e.letters.length <= size);
  let best = placeWords(rng, usable, size, steps);
  for (let attempt = 1; attempt < 12 && best.words.length < usable.length; attempt++) {
    const next = placeWords(rng, usable, size, steps);
    if (next.words.length > best.words.length) best = next;
  }

  // Lấp ô trống bằng chữ của chính các từ; lấp lại nếu vô tình tạo thêm một từ cần tìm.
  const pool = best.words.flatMap((w) => w.letters);
  const expected = best.words.map((w) => countOccurrences(best.grid, w.letters, steps));
  let grid = best.grid;
  for (let attempt = 0; attempt < 20 && pool.length; attempt++) {
    grid = best.grid.map((line) => line.map((c) => c || rng.pick(pool)));
    if (best.words.every((w, i) => countOccurrences(grid, w.letters, steps) === expected[i])) break;
  }

  const placed = new Set(best.words.map((w) => w.word));
  // Danh sách từ giữ đúng thứ tự giáo viên nhập.
  const order = new Map(entries.map((e, i) => [e.word, i]));
  return {
    kind: 'tim-tu',
    size,
    grid,
    words: [...best.words].sort((a, b) => order.get(a.word)! - order.get(b.word)!),
    rejected: entries
      .filter((e) => !placed.has(e.word))
      .map((e) => ({ word: e.word, reason: e.letters.length > size ? 'long' : 'space' })),
  };
}

// ---------------------------------------------------------------- Ô chữ

/** 0: hàng ngang, 1: hàng dọc. */
type Axis = 0 | 1;
const AXIS_STEP: Record<Axis, Step> = { 0: [0, 1], 1: [1, 0] };

type Cell = { row: number; column: number; letter: string; used: [boolean, boolean] };
type Word = { entry: Entry; row: number; column: number; axis: Axis };
type Bounds = { top: number; left: number; bottom: number; right: number };

const keyOf = (row: number, column: number) => `${row},${column}`;

const grow = (b: Bounds | null, row: number, column: number): Bounds => ({
  top: Math.min(b?.top ?? row, row),
  left: Math.min(b?.left ?? column, column),
  bottom: Math.max(b?.bottom ?? row, row),
  right: Math.max(b?.right ?? column, column),
});

const areaOf = (b: Bounds) => (b.bottom - b.top + 1) * (b.right - b.left + 1);

function buildCrossword(rng: Rng, entries: readonly Entry[], size: number) {
  const cells = new Map<string, Cell>();
  const words: Word[] = [];
  let bounds: Bounds | null = null;
  let crossings = 0;

  const has = (row: number, column: number) => cells.has(keyOf(row, column));

  /** Số chỗ giao và khung mới nếu đặt được, ngược lại null. */
  const check = ({ entry, row, column, axis }: Word) => {
    const [dr, dc] = AXIS_STEP[axis];
    const n = entry.letters.length;
    if (has(row - dr, column - dc) || has(row + dr * n, column + dc * n)) return null;
    const next = grow(grow(bounds, row, column), row + dr * (n - 1), column + dc * (n - 1));
    if (next.bottom - next.top >= size || next.right - next.left >= size) return null;
    let shared = 0;
    for (let i = 0; i < n; i++) {
      const r = row + dr * i;
      const c = column + dc * i;
      const cell = cells.get(keyOf(r, c));
      if (cell) {
        if (cell.letter !== entry.letters[i] || cell.used[axis]) return null;
        shared++;
      } else if (has(r + dc, c + dr) || has(r - dc, c - dr)) {
        // Ô mới không được dính cạnh với hàng khác.
        return null;
      }
    }
    return shared < n ? { shared, bounds: next } : null;
  };

  const put = (word: Word, next: Bounds, shared: number) => {
    const [dr, dc] = AXIS_STEP[word.axis];
    word.entry.letters.forEach((letter, i) => {
      const row = word.row + dr * i;
      const column = word.column + dc * i;
      const cell = cells.get(keyOf(row, column)) ?? {
        row,
        column,
        letter,
        used: [false, false] as [boolean, boolean],
      };
      cell.used[word.axis] = true;
      cells.set(keyOf(row, column), cell);
    });
    words.push(word);
    bounds = next;
    crossings += shared;
  };

  let queue = longestFirst(rng, entries);
  // Từ đầu tiên chọn trong vài từ dài nhất để mỗi lần thử ra một hình khác.
  const first = queue[rng.int(0, Math.min(3, queue.length) - 1)];
  if (first) {
    const word: Word = { entry: first, row: 0, column: 0, axis: rng.pick<Axis>([0, 1]) };
    const result = check(word);
    if (result) put(word, result.bounds, 0);
    queue = queue.filter((e) => e !== first);
  }

  for (let progress = true; progress && queue.length; ) {
    progress = false;
    const waiting: Entry[] = [];
    for (const entry of queue) {
      let bestScore = -Infinity;
      let options: { word: Word; bounds: Bounds; shared: number }[] = [];
      for (const cell of cells.values()) {
        for (const axis of [0, 1] as const) {
          if (cell.used[axis]) continue;
          const [dr, dc] = AXIS_STEP[axis];
          entry.letters.forEach((letter, i) => {
            if (letter !== cell.letter) return;
            const word = { entry, row: cell.row - dr * i, column: cell.column - dc * i, axis };
            const result = check(word);
            if (!result) return;
            // Nhiều chỗ giao trước, rồi đến khung gọn.
            const score = result.shared * 1000 - areaOf(result.bounds);
            if (score > bestScore) {
              bestScore = score;
              options = [];
            }
            if (score === bestScore) options.push({ word, ...result });
          });
        }
      }
      if (options.length) {
        const choice = rng.pick(options);
        put(choice.word, choice.bounds, choice.shared);
        progress = true;
      } else {
        waiting.push(entry);
      }
    }
    queue = waiting;
  }

  const box: Bounds = bounds ?? { top: 0, left: 0, bottom: -1, right: -1 };
  return { cells, words, bounds: box, crossings };
}

function crossword(rng: Rng, entries: readonly Entry[], { size }: Config): Crossword {
  const usable = entries.filter((e) => e.clue && e.letters.length <= size);
  const rank = (b: ReturnType<typeof buildCrossword>) =>
    [b.words.length, b.crossings, -areaOf(b.bounds)] as const;
  let best = buildCrossword(rng, usable, size);
  for (let attempt = 1; attempt < 24; attempt++) {
    const next = buildCrossword(rng, usable, size);
    const [a, b] = [rank(next), rank(best)];
    const index = a.findIndex((value, i) => value !== b[i]);
    if (index >= 0 && a[index]! > b[index]!) best = next;
  }

  const { top, left, bottom, right } = best.bounds;
  const rows = bottom - top + 1;
  const columns = right - left + 1;
  const grid = Array.from({ length: rows }, (_, r) =>
    Array.from({ length: columns }, (_, c) => best.cells.get(keyOf(r + top, c + left))?.letter ?? null),
  );

  // Đánh số theo thứ tự đọc; hàng ngang và dọc cùng ô đầu dùng chung số.
  const starts = best.words
    .map((w) => ({ ...w, row: w.row - top, column: w.column - left }))
    .sort((a, b) => a.row - b.row || a.column - b.column || a.axis - b.axis);
  const across: Clue[] = [];
  const down: Clue[] = [];
  let number = 0;
  let previous = '';
  for (const { entry, row, column, axis } of starts) {
    if (keyOf(row, column) !== previous) number++;
    previous = keyOf(row, column);
    (axis === 0 ? across : down).push({ ...entry, number, row, column });
  }

  const placed = new Set(best.words.map((w) => w.entry.word));
  return {
    kind: 'o-chu',
    rows,
    columns,
    grid,
    across,
    down,
    rejected: entries
      .filter((e) => !placed.has(e.word))
      .map((e) => ({
        word: e.word,
        reason: !e.clue ? 'no-clue' : e.letters.length > size ? 'long' : 'space',
      })),
  };
}

export function generate(entries: readonly Entry[], config: Config, seed: number): Puzzle {
  const rng = createRng(seed);
  return config.kind === 'o-chu'
    ? crossword(rng, entries, config)
    : wordSearch(rng, entries, config);
}

export const wordCount = (puzzle: Puzzle) =>
  puzzle.kind === 'tim-tu' ? puzzle.words.length : puzzle.across.length + puzzle.down.length;

export const defaultTitle = (kind: Kind) => (kind === 'o-chu' ? 'Giải ô chữ' : 'Tìm từ ẩn');

export const SAMPLE_WORDS = [
  'trường học | Nơi em đến học mỗi ngày',
  'cô giáo | Người dạy em ở lớp',
  'bảng đen | Thầy cô viết chữ lên đó',
  'phấn trắng | Dùng để viết lên bảng',
  'bút chì | Viết xong có thể tẩy được',
  'thước kẻ | Dùng để kẻ đường thẳng',
  'quyển vở | Em viết bài vào đây',
  'cặp sách | Đựng sách vở mang đi học',
  'bạn bè | Những người cùng học, cùng chơi',
  'học sinh | Người đi học',
  'lớp học | Căn phòng có bàn ghế và bảng',
  'sân chơi | Nơi em vui đùa giờ ra chơi',
].join('\n');
