import { describe, expect, it } from 'vitest';
import { createRng } from '@/core/rng';
import {
  baseLevel,
  classify,
  formatScore,
  parseScore,
  parseScoreList,
  semesterAverage,
  yearAverage,
  type SubjectResult,
} from './calc';
import { DEFAULT_STATE, summarize, toClipboardText, toState, type State } from './state';

/** Điểm viết theo thang 10 cho dễ đọc: marks(8, 6.5) */
const marks = (...values: number[]): SubjectResult[] =>
  values.map((v, i) => ({ name: `M${i + 1}`, kind: 'score', average: Math.round(v * 10) }));

const comments = (...passed: boolean[]): SubjectResult[] =>
  passed.map((p, i) => ({ name: `N${i + 1}`, kind: 'comment', passed: p }));

const repeat = (value: number, times: number) => Array<number>(times).fill(value);

describe('đọc điểm', () => {
  it('nhận dấu phẩy và dấu chấm', () => {
    expect(parseScore('7,5').value).toBe(75);
    expect(parseScore('7.5').value).toBe(75);
    expect(parseScore(' 10 ').value).toBe(100);
    expect(parseScore('0').value).toBe(0);
    expect(parseScore('')).toEqual({ value: null, error: null });
  });

  it('báo lỗi điểm ngoài thang hoặc sai dạng', () => {
    for (const text of ['11', '10,1', '-1', '7,25', 'a', '7,', '100']) {
      expect(parseScore(text).error, text).not.toBeNull();
    }
  });

  it('đọc danh sách cách nhau dấu cách', () => {
    expect(parseScoreList(' 8  7,5 9 ').values).toEqual([80, 75, 90]);
    expect(parseScoreList('8 x').error).not.toBeNull();
    expect(parseScoreList('').values).toEqual([]);
  });
});

describe('điểm trung bình', () => {
  it('đúng công thức và làm tròn nửa lên', () => {
    // (8+9 + 2·7 + 3·8) / 7 = 55/7 = 7,857
    expect(semesterAverage([80, 90], 70, 80)).toBe(79);
    // (7+7+7 + 2·7 + 3·7,5)/8 = 57,5/8 = 7,1875
    expect(semesterAverage([70, 70, 70], 70, 75)).toBe(72);
    // Đúng nửa: (6,5+6,5+6,5 + 2·6,5 + 3·6,9)/8 = 53,2/8 = 6,65 làm tròn 6,7
    expect(semesterAverage([65, 65, 65], 65, 69)).toBe(67);
    // (6,4 + 2·6,5)/3 = 6,4666
    expect(yearAverage(64, 65)).toBe(65);
    expect(formatScore(65)).toBe('6,5');
    expect(formatScore(100)).toBe('10,0');
  });

  it('khớp phép tính phân số chính xác trên 5.000 bộ điểm ngẫu nhiên', () => {
    const rng = createRng(22);
    /** Làm tròn total/divisor (đơn vị phần mười) bằng BigInt. */
    const exact = (total: number, divisor: number) =>
      Number((BigInt(total) * 2n + BigInt(divisor)) / (BigInt(divisor) * 2n));
    for (let i = 0; i < 5000; i++) {
      const regular = Array.from({ length: rng.int(1, 6) }, () => rng.int(0, 100));
      const midterm = rng.int(0, 100);
      const final = rng.int(0, 100);
      const total = regular.reduce((a, b) => a + b, 0) + 2 * midterm + 3 * final;
      const average = semesterAverage(regular, midterm, final);
      expect(average).toBe(exact(total, regular.length + 5));
      // Kết quả cách giá trị thật không quá nửa phần mười.
      expect(Math.abs(average - total / (regular.length + 5))).toBeLessThanOrEqual(0.5 + 1e-9);
      expect(yearAverage(midterm, final)).toBe(exact(midterm + 2 * final, 3));
    }
  });
});

describe('xếp mức theo khoản 2 Điều 9', () => {
  it('Tốt: đều từ 6,5 và đủ 6 môn từ 8,0', () => {
    expect(baseLevel(marks(...repeat(8, 6), 6.5, 6.5))).toBe(3);
    expect(baseLevel(marks(...repeat(8, 5), 7.9, 6.5))).toBe(2);
    expect(baseLevel(marks(...repeat(8, 7), 6.4))).toBe(2);
  });

  it('Khá: đều từ 5,0 và đủ 6 môn từ 6,5', () => {
    expect(baseLevel(marks(...repeat(6.5, 6), 5, 5))).toBe(2);
    expect(baseLevel(marks(...repeat(6.5, 5), 6.4, 5))).toBe(1);
  });

  it('Đạt: đủ 6 môn từ 5,0 và không môn nào dưới 3,5', () => {
    expect(baseLevel(marks(...repeat(5, 6), 3.5, 3.5))).toBe(1);
    expect(baseLevel(marks(...repeat(5, 6), 3.4))).toBe(0);
    expect(baseLevel(marks(...repeat(5, 5), 4.9, 4.9))).toBe(0);
  });

  it('môn nhận xét: Tốt, Khá cần đạt hết; Đạt cho phép một môn chưa đạt', () => {
    const good = marks(...repeat(9, 8));
    expect(baseLevel([...good, ...comments(true, true)])).toBe(3);
    expect(baseLevel([...good, ...comments(false, true)])).toBe(1);
    expect(baseLevel([...good, ...comments(false, false)])).toBe(0);
  });

  it('chưa đủ 6 môn chấm điểm thì không đạt mức nào', () => {
    expect(baseLevel(marks(...repeat(10, 5)))).toBe(0);
  });
});

describe('điều chỉnh theo khoản 3 Điều 9', () => {
  const eightGood = repeat(9, 7);

  it('lẽ ra Tốt, một môn kéo xuống Đạt: được lên Khá', () => {
    expect(classify(marks(...eightGood, 4))).toEqual({
      level: 2,
      base: 1,
      adjustedFor: 'M8',
    });
  });

  it('lẽ ra Tốt, một môn kéo xuống Chưa đạt: được lên Đạt', () => {
    expect(classify(marks(...eightGood, 2))).toEqual({ level: 1, base: 0, adjustedFor: 'M8' });
  });

  it('lẽ ra Tốt, một môn nhận xét chưa đạt: được lên Khá', () => {
    const result = classify([...marks(...eightGood), ...comments(false, true)]);
    expect(result).toEqual({ level: 2, base: 1, adjustedFor: 'N1' });
  });

  it('lẽ ra Khá, một môn kéo xuống Chưa đạt: được lên Đạt', () => {
    expect(classify(marks(...repeat(7, 7), 3))).toEqual({ level: 1, base: 0, adjustedFor: 'M8' });
  });

  it('chỉ thấp một mức thì không điều chỉnh', () => {
    // Một môn 6,0: từ Tốt xuống Khá.
    expect(classify(marks(...eightGood, 6))).toEqual({ level: 2, base: 2, adjustedFor: null });
  });

  it('do hai môn thì không điều chỉnh', () => {
    expect(classify(marks(...repeat(9, 6), 4, 4))).toEqual({
      level: 1,
      base: 1,
      adjustedFor: null,
    });
    expect(classify([...marks(...eightGood), ...comments(false, false)]).level).toBe(0);
  });

  it('thuộc tính trên 5.000 bảng điểm ngẫu nhiên', () => {
    const rng = createRng(2021);
    for (let i = 0; i < 5000; i++) {
      const results = [
        ...marks(...Array.from({ length: rng.int(6, 10) }, () => rng.int(30, 100) / 10)),
        ...comments(...Array.from({ length: rng.int(0, 4) }, () => rng.next() < 0.9)),
      ];
      const { level, base, adjustedFor } = classify(results);
      expect(base).toBe(baseLevel(results));
      // Chỉ nâng đúng một mức, và không bao giờ lên Tốt nhờ điều chỉnh.
      expect(level).toBe(adjustedFor ? base + 1 : base);
      if (adjustedFor) expect(level).toBeLessThanOrEqual(2);
      // Tăng điểm một môn không bao giờ làm mức xếp loại thấp đi.
      const pick = rng.int(0, results.length - 1);
      const better = results.map((r, j) =>
        j !== pick
          ? r
          : r.kind === 'score'
            ? { ...r, average: Math.min(100, r.average + rng.int(1, 40)) }
            : { ...r, passed: true },
      );
      expect(classify(better).level, JSON.stringify(results)).toBeGreaterThanOrEqual(level);
    }
  });
});

describe('dữ liệu nhập', () => {
  const filled: State = {
    mode: 'semester',
    subjects: DEFAULT_STATE.subjects.map((s) => ({
      ...s,
      regular: '8 9',
      midterm: '8,5',
      final: '9',
    })),
  };

  it('đủ điểm thì có xếp loại, thiếu thì đếm số môn thiếu', () => {
    expect(summarize(filled).classification?.level).toBe(3);
    const empty = summarize(DEFAULT_STATE);
    expect(empty.classification).toBeNull();
    expect(empty.missing).toBe(8);
  });

  it('nội dung chép có từng môn, mức xếp loại và lời nhắc tham khảo', () => {
    const text = toClipboardText(filled, summarize(filled));
    expect(text).toContain('chỉ để tham khảo');
    expect(text).toContain('Toán: 8,7');
    expect(text).toContain('Nghệ thuật: Đạt');
    expect(text).toContain('Gợi ý xếp loại: Tốt');
  });

  it('dữ liệu hỏng không làm sập', () => {
    expect(toState({ subjects: 'x', mode: 5 }).subjects).toHaveLength(12);
    const state = toState({ subjects: [null, { name: 3, kind: 'zz', passed: 'no' }] });
    expect(state.subjects.map((s) => [s.id, s.name, s.kind, s.passed])).toEqual([
      [1, '', 'score', true],
      [2, '', 'score', true],
    ]);
  });
});
