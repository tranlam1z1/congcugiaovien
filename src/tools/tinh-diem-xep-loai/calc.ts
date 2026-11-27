/**
 * Tính điểm và gợi ý xếp loại kết quả học tập theo Thông tư 22/2021/TT-BGDĐT.
 * Công thức: Điều 9 khoản 1; xếp mức: khoản 2; điều chỉnh khi vướng một môn: khoản 3.
 * Điểm tính bằng số nguyên "phần mười" (8,5 = 85) để làm tròn không sai số.
 */

/** Điểm theo phần mười, từ 0 đến 100. */
export type Tenths = number;

export type ParsedScore = { value: Tenths | null; error: string | null };

/** Đọc một điểm: "8", "7,5" (chấp nhận cả "7.5"). Ô trống không phải lỗi. */
export function parseScore(text: string): ParsedScore {
  const token = text.trim();
  if (token === '') return { value: null, error: null };
  const match = /^(\d{1,2})(?:[,.](\d))?$/.exec(token);
  const value = match ? Number(match[1]) * 10 + Number(match[2] ?? 0) : NaN;
  if (!match || value > 100) {
    return {
      value: null,
      error: `“${token}” không phải điểm từ 0 đến 10, tối đa một chữ số sau dấu phẩy.`,
    };
  }
  return { value, error: null };
}

/** Điểm thường xuyên cách nhau bằng dấu cách. */
export function parseScoreList(text: string): { values: Tenths[]; error: string | null } {
  const values: Tenths[] = [];
  for (const token of text.split(/[\s;]+/).filter(Boolean)) {
    const { value, error } = parseScore(token);
    if (error) return { values: [], error };
    values.push(value!);
  }
  return { values, error: null };
}

/** Chia hai số nguyên, làm tròn nửa lên. */
const roundedDivide = (total: number, divisor: number) =>
  Math.floor((2 * total + divisor) / (2 * divisor));

/** ĐTBmhk = (Σ ĐĐGtx + 2·ĐĐGgk + 3·ĐĐGck) / (số ĐĐGtx + 5) */
export function semesterAverage(regular: Tenths[], midterm: Tenths, final: Tenths): Tenths {
  const total = regular.reduce((sum, v) => sum + v, 0) + 2 * midterm + 3 * final;
  return roundedDivide(total, regular.length + 5);
}

/** ĐTBmcn = (ĐTBmhk I + 2·ĐTBmhk II) / 3 */
export const yearAverage = (first: Tenths, second: Tenths): Tenths =>
  roundedDivide(first + 2 * second, 3);

export const formatScore = (value: Tenths) =>
  `${Math.floor(value / 10)},${value % 10}`;

export const LEVELS = ['Chưa đạt', 'Đạt', 'Khá', 'Tốt'] as const;
/** 0 = Chưa đạt ... 3 = Tốt. */
export type Level = 0 | 1 | 2 | 3;

/** Kết quả một môn: điểm trung bình, hoặc đạt/chưa đạt với môn đánh giá bằng nhận xét. */
export type SubjectResult =
  | { name: string; kind: 'score'; average: Tenths }
  | { name: string; kind: 'comment'; passed: boolean };

const SUBJECTS_NEEDED = 6;

/** Điều 9 khoản 2. */
export function baseLevel(results: SubjectResult[]): Level {
  const scores = results.flatMap((r) => (r.kind === 'score' ? [r.average] : []));
  const failedComments = results.filter((r) => r.kind === 'comment' && !r.passed).length;
  const atLeast = (limit: Tenths) => scores.filter((s) => s >= limit).length;
  const all = (limit: Tenths) => atLeast(limit) === scores.length;

  if (failedComments === 0 && all(65) && atLeast(80) >= SUBJECTS_NEEDED) return 3;
  if (failedComments === 0 && all(50) && atLeast(65) >= SUBJECTS_NEEDED) return 2;
  if (failedComments <= 1 && atLeast(50) >= SUBJECTS_NEEDED && all(35)) return 1;
  return 0;
}

export type Classification = {
  level: Level;
  /** Mức theo khoản 2, trước khi điều chỉnh. */
  base: Level;
  /** Môn khiến mức bị hạ, khi được điều chỉnh theo khoản 3. */
  adjustedFor: string | null;
};

const best = (result: SubjectResult): SubjectResult =>
  result.kind === 'score' ? { ...result, average: 100 } : { ...result, passed: true };

/**
 * Khoản 3: nếu mức bị thấp từ 2 mức trở lên so với Tốt hoặc Khá chỉ do kết quả của duy nhất
 * một môn thì được nâng lên mức liền kề. "Chỉ do một môn" nghĩa là riêng môn đó đủ tốt thì
 * học sinh đạt được mức Tốt hoặc Khá ấy.
 */
export function classify(results: SubjectResult[]): Classification {
  const base = baseLevel(results);
  for (const target of [3, 2] as const) {
    if (target - base < 2) continue;
    const culprit = results.find(
      (result) => baseLevel(results.map((r) => (r === result ? best(r) : r))) >= target,
    );
    if (culprit) {
      return { level: (base + 1) as Level, base, adjustedFor: culprit.name };
    }
  }
  return { level: base, base, adjustedFor: null };
}
