/**
 * Sinh phiếu tiếng Việt lớp 1 từ danh sách của giáo viên (PRD 4.1).
 * Logic thuần, cùng seed và dữ liệu cho cùng kết quả; không trùng câu trong một phiếu.
 */
import { createRng, type Rng } from '@/core/rng';
import { splitSyllable } from '@/core/vi/syllable';

export const FORMS = ['dien', 'noi', 'sap-xep'] as const;
export type Form = (typeof FORMS)[number];

/** Phần bị ẩn khi điền: 'both' chọn ngẫu nhiên âm đầu hoặc vần cho từng từ. */
export const HIDES = ['onset', 'rime', 'both'] as const;
export type Hide = (typeof HIDES)[number];
export type Part = 'onset' | 'rime';

export const MAX_WORDS = 60;
export const MAX_WORD_LENGTH = 30;
export const MAX_SENTENCES = 30;
export const MAX_SENTENCE_LENGTH = 120;
export const PAIRS_PER_BLOCK = 5;

export type FillQuestion = {
  /** Phần chữ trước và sau chỗ chấm. */
  before: string;
  after: string;
  hidden: string;
  part: Part;
  word: string;
};

export type Pair = { left: string; right: string; word: string };
export type MatchBlock = { pairs: Pair[]; right: string[] };

export type OrderQuestion = {
  /** Các từ đã xáo trộn. */
  words: string[];
  /** Dấu cuối câu, in sẵn cuối dòng viết. */
  ending: string;
  sentence: string;
};

export type Worksheet =
  | { form: 'dien'; questions: FillQuestion[]; bank: string[] }
  | { form: 'noi'; blocks: MatchBlock[] }
  | { form: 'sap-xep'; questions: OrderQuestion[] };

export type Lines = {
  /** Dòng dùng được, đã bỏ trùng. */
  items: string[];
  /** Số dòng bị bỏ vì quá dài hoặc vượt giới hạn. */
  dropped: number;
};

/** Mỗi dòng một mục; gộp khoảng trắng, bỏ dòng trống và dòng trùng. */
export function parseLines(text: string, maxItems: number, maxLength: number): Lines {
  const seen = new Set<string>();
  const items: string[] = [];
  let dropped = 0;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.normalize('NFC').replace(/\s+/g, ' ').trim();
    const key = line.toLocaleLowerCase('vi');
    if (!line || seen.has(key)) continue;
    seen.add(key);
    if (line.length > maxLength || items.length >= maxItems) dropped++;
    else items.push(line);
  }
  return { items, dropped };
}

/** Các cách ẩn một phần của từ; rỗng nếu từ không tách được theo yêu cầu. */
export function fillChoices(word: string, hide: Hide): FillQuestion[] {
  const text = word.split('|').join(' ').replace(/\s+/g, ' ').trim();
  // Giữ cả khoảng trắng và dấu câu để ghép lại đúng nguyên văn.
  const tokens = text.split(/(\p{L}+)/u);
  const choices: FillQuestion[] = [];
  tokens.forEach((token, index) => {
    const syllable = splitSyllable(token);
    if (!syllable) return;
    const head = tokens.slice(0, index).join('');
    const tail = tokens.slice(index + 1).join('');
    if (hide !== 'rime' && syllable.onset) {
      choices.push({
        before: head,
        after: syllable.rime + tail,
        hidden: syllable.onset,
        part: 'onset',
        word: text,
      });
    }
    if (hide !== 'onset') {
      choices.push({
        before: head + syllable.onset,
        after: tail,
        hidden: syllable.rime,
        part: 'rime',
        word: text,
      });
    }
  });
  return choices;
}

/**
 * Cặp để nối: "trái | phải" do giáo viên tách, hoặc tiếng đầu với phần còn lại,
 * hoặc âm đầu với vần khi từ chỉ có một tiếng.
 */
export function pairOf(line: string): Pair | null {
  if (line.includes('|')) {
    const [left = '', ...rest] = line.split('|').map((s) => s.trim());
    const right = rest.join(' ').trim();
    return left && right ? { left, right, word: `${left} ${right}` } : null;
  }
  const space = line.indexOf(' ');
  if (space > 0) {
    return { left: line.slice(0, space), right: line.slice(space + 1), word: line };
  }
  const syllable = splitSyllable(line);
  return syllable?.onset ? { left: syllable.onset, right: syllable.rime, word: line } : null;
}

export function sentenceParts(sentence: string) {
  const match = /^(.*?)\s*([.!?…]*)$/u.exec(sentence)!;
  return { words: match[1]!.split(' ').filter(Boolean), ending: match[2]! };
}

/** Số dòng trong danh sách không dùng được cho dạng bài này. */
export function countUnusable(items: string[], form: Form, hide: Hide) {
  return items.filter((item) => {
    if (form === 'dien') return fillChoices(item, hide).length === 0;
    if (form === 'noi') return pairOf(item) === null;
    return sentenceParts(item).words.length < 2;
  }).length;
}

/** Xáo cho tới khi khác thứ tự gốc (nếu có thể). */
function scramble(rng: Rng, items: string[]) {
  let shuffled = rng.shuffle(items);
  for (let i = 0; i < 20 && shuffled.join('\n') === items.join('\n'); i++) {
    shuffled = rng.shuffle(items);
  }
  return shuffled;
}

const fold = (text: string) => text.toLocaleLowerCase('vi');

/** Chia cặp thành nhóm; trong một nhóm không lặp vế trái hay vế phải. */
function matchBlocks(rng: Rng, pairs: Pair[]): MatchBlock[] {
  const groups: Pair[][] = [];
  const fits = (group: Pair[], pair: Pair) =>
    group.every((p) => fold(p.left) !== fold(pair.left) && fold(p.right) !== fold(pair.right));

  for (const pair of rng.shuffle(pairs)) {
    const group = groups.find((g) => g.length < PAIRS_PER_BLOCK && fits(g, pair));
    if (group) group.push(pair);
    else groups.push([pair]);
  }
  // Nhóm một cặp thì không có gì để nối: mượn thêm từ nhóm đông hơn.
  for (const lonely of groups.filter((g) => g.length === 1)) {
    for (const donor of groups.filter((g) => g.length > 2)) {
      const index = donor.findIndex((p) => fits(lonely, p));
      if (index >= 0) {
        lonely.push(...donor.splice(index, 1));
        break;
      }
    }
  }
  return groups
    .filter((group) => group.length > 1)
    .map((group) => ({
      pairs: group,
      right: scramble(
        rng,
        group.map((p) => p.right),
      ),
    }));
}

export type Config = { form: Form; hide: Hide; items: string[] };

export function generate({ form, hide, items }: Config, seed: number): Worksheet {
  const rng = createRng(seed);
  if (form === 'noi') {
    const pairs = items.map(pairOf).filter((p): p is Pair => p !== null);
    return { form, blocks: matchBlocks(rng, pairs) };
  }
  if (form === 'sap-xep') {
    const questions = rng.shuffle(items).flatMap((sentence) => {
      const { words, ending } = sentenceParts(sentence);
      return words.length < 2 ? [] : [{ words: scramble(rng, words), ending, sentence }];
    });
    return { form, questions };
  }
  const questions = rng.shuffle(items).flatMap((item) => {
    const choices = fillChoices(item, hide);
    if (!choices.length) return [];
    // "Cả hai": chia đều âm đầu và vần trước, rồi mới chọn tiếng.
    const parts = [...new Set(choices.map((c) => c.part))];
    const part = rng.pick(parts);
    return [rng.pick(choices.filter((c) => c.part === part))];
  });
  const bank = rng.shuffle([...new Set(questions.map((q) => fold(q.hidden)))]);
  return { form, questions, bank };
}

export function answersOf(sheet: Worksheet): string[] {
  if (sheet.form === 'noi') return sheet.blocks.flatMap((b) => b.pairs.map((p) => p.word));
  if (sheet.form === 'sap-xep') return sheet.questions.map((q) => q.sentence);
  return sheet.questions.map((q) => q.word);
}

export function defaultTitle(form: Form, hide: Hide) {
  if (form === 'noi') return 'Nối từ';
  if (form === 'sap-xep') return 'Sắp xếp từ thành câu';
  return hide === 'onset' ? 'Điền âm đầu' : hide === 'rime' ? 'Điền vần' : 'Điền âm đầu, vần';
}

export const SAMPLE_WORDS = [
  'con cá',
  'quả na',
  'lá cờ',
  'bó hoa',
  'ghế gỗ',
  'nhà lá',
  'tổ chim',
  'xe đạp',
  'cái ca',
  'mẹ bế bé',
  'sư tử',
  'chú khỉ',
  'quê nhà',
  'giá sách',
  'nghỉ hè',
  'thỏ trắng',
].join('\n');

export const SAMPLE_SENTENCES = [
  'Bé đi học.',
  'Mẹ mua cá ở chợ.',
  'Bà kể chuyện cho bé nghe.',
  'Con mèo trèo lên cây cau.',
  'Em rất yêu trường em.',
  'Bố đưa bé đi chơi.',
  'Đàn gà theo mẹ ra vườn.',
  'Trời hôm nay nắng đẹp.',
].join('\n');
