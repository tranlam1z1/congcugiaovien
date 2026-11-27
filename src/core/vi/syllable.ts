/** Tách một tiếng (âm tiết) tiếng Việt thành âm đầu và vần (kèm dấu thanh). */

/** Dài xếp trước để "ngh" không bị nhận thành "ng" hay "n". */
const ONSETS = [
  'ngh',
  'ch',
  'gh',
  'gi',
  'kh',
  'ng',
  'nh',
  'ph',
  'qu',
  'th',
  'tr',
  'b',
  'c',
  'd',
  'đ',
  'g',
  'h',
  'k',
  'l',
  'm',
  'n',
  'p',
  'r',
  's',
  't',
  'v',
  'x',
];

/** Vần (đã bỏ dấu): một đến ba nguyên âm, có thể kèm âm cuối. */
const RIME = /^[aeiouy]{1,3}(ch|ng|nh|c|m|n|p|t)?$/;

const baseLetter = (char: string) =>
  char.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export type Syllable = {
  /** Rỗng với tiếng bắt đầu bằng nguyên âm ("áo", "yêu"). */
  onset: string;
  rime: string;
};

/** Trả về null nếu không phải một tiếng tiếng Việt (số, dấu câu, từ nước ngoài). */
export function splitSyllable(text: string): Syllable | null {
  const syllable = text.normalize('NFC');
  const letters = [...syllable];
  const base = letters.map(baseLetter);
  // Mỗi ký tự dựng sẵn ứng đúng một chữ cái.
  if (base.some((b) => !/^[a-zđ]$/.test(b))) return null;
  const plain = base.join('');

  let onset = ONSETS.find((o) => plain.startsWith(o)) ?? '';
  // "gì", "gìn": chữ i vừa thuộc "gi" vừa là vần, nên âm đầu chỉ viết "g".
  if (onset === 'gi' && !/^[aeiouy]/.test(plain.slice(2))) onset = 'g';
  if (!RIME.test(plain.slice(onset.length))) return null;

  return {
    onset: letters.slice(0, onset.length).join(''),
    rime: letters.slice(onset.length).join(''),
  };
}
