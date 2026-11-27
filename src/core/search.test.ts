import { describe, expect, it } from 'vitest';
import { TOOLS } from './registry';
import { searchTools } from './search';
import { removeDiacritics, slugify } from './vi/normalize';

const slugs = (query: string) => searchTools(TOOLS, query).map((t) => t.slug);

describe('chuẩn hóa tiếng Việt', () => {
  it('bỏ dấu, kể cả đ và chữ dạng tổ hợp', () => {
    expect(removeDiacritics('Đề Ôn Tập Ữ')).toBe('de on tap u');
    expect(removeDiacritics('Phiếu'.normalize('NFD'))).toBe('phieu');
    expect(slugify('  Phiếu toán (lớp 1–3) ')).toBe('phieu-toan-lop-1-3');
  });
});

describe('tìm kiếm', () => {
  it('không phân biệt dấu và hoa thường', () => {
    for (const query of ['phieu toan', 'Phiếu Toán', 'PHIẾU TOÁN']) {
      expect(slugs(query)[0]).toMatch(/^phieu-toan/);
    }
    expect(slugs('phieu toan')).toContain('phieu-toan');
  });

  it('khớp khi đang gõ dở', () => {
    expect(slugs('sudo')).toEqual(['sudoku']);
    expect(slugs('giay kh')).toContain('giay-khen');
  });

  it('khớp theo từ khóa, nhóm và lớp', () => {
    expect(slugs('crossword')).toEqual(['o-chu-tim-tu']);
    expect(slugs('to mau ve')).toContain('to-mau-theo-so');
    expect(slugs('thcs')).toContain('tron-de-trac-nghiem');
    expect(slugs('phieu toan lop 5')).toContain('phieu-toan-lop-4-5');
  });

  it('số lớp phải khớp trọn', () => {
    expect(slugs('lop 5')).not.toContain('phieu-tieng-viet');
    // "1" không được khớp "10" hay "120".
    expect(slugs('phieu tra loi 1')).toEqual([]);
  });

  it('từ rỗng hoặc không có kết quả', () => {
    expect(slugs('   ')).toEqual([]);
    expect(slugs('xyzkhongco')).toEqual([]);
  });
});
