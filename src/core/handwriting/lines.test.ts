import { describe, expect, it } from 'vitest';
import { MAX_LINES, MAX_PAGES, MAX_TOTAL_PAGES, parseLines, studentLimit, wrap } from './lines';

describe('đọc nội dung', () => {
  it('bỏ dòng trống, gộp khoảng trắng, chuẩn hoá dấu', () => {
    expect(parseLines('  bé   yêu \r\n\r\n\tmẹ ')).toEqual(['bé yêu', 'mẹ']);
    expect(parseLines('á')).toEqual(['á']);
    expect(parseLines('a\n'.repeat(MAX_LINES + 20))).toHaveLength(MAX_LINES);
  });

  it('ngắt dòng theo từ, từ quá dài thì ngắt theo ký tự', () => {
    const fits = (text: string) => text.length <= 6;
    expect(wrap('bé đi học về nhà', fits)).toEqual(['bé đi', 'học về', 'nhà']);
    expect(wrap('abcdefghij kl', fits)).toEqual(['abcdef', 'ghij', 'kl']);
    expect(wrap('ab', () => false)).toEqual(['a', 'b']);
  });
});

describe('giới hạn trang', () => {
  it('số học sinh không làm vượt tổng số trang', () => {
    expect(studentLimit(1)).toBe(60);
    for (let pages = 1; pages <= MAX_PAGES; pages++) {
      expect(studentLimit(pages) * pages).toBeLessThanOrEqual(MAX_TOTAL_PAGES);
    }
  });
});
