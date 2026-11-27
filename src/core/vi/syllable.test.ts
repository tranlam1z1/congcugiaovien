import { describe, expect, it } from 'vitest';
import { splitSyllable } from './syllable';

const split = (text: string) => {
  const result = splitSyllable(text);
  return result && `${result.onset}|${result.rime}`;
};

describe('tách âm tiết', () => {
  it.each([
    ['ba', 'b|a'],
    ['cá', 'c|á'],
    ['đỏ', 'đ|ỏ'],
    ['nghé', 'ngh|é'],
    ['ngủ', 'ng|ủ'],
    ['nhà', 'nh|à'],
    ['ghế', 'gh|ế'],
    ['gà', 'g|à'],
    ['chó', 'ch|ó'],
    ['trường', 'tr|ường'],
    ['khuya', 'kh|uya'],
    ['phượng', 'ph|ượng'],
    ['thuyền', 'th|uyền'],
    ['quả', 'qu|ả'],
    ['quyển', 'qu|yển'],
    ['già', 'gi|à'],
    ['giếng', 'gi|ếng'],
    ['giữ', 'gi|ữ'],
    ['gì', 'g|ì'],
    ['gìn', 'g|ìn'],
    ['hươu', 'h|ươu'],
    ['xoong', 'x|oong'],
    ['huỳnh', 'h|uỳnh'],
    ['sách', 's|ách'],
    ['áo', '|áo'],
    ['yêu', '|yêu'],
    ['anh', '|anh'],
    ['Nghỉ', 'Ngh|ỉ'],
    ['Đường', 'Đ|ường'],
  ])('%s thành %s', (word, expected) => {
    expect(split(word)).toBe(expected);
  });

  it('nhận cả chữ dạng tổ hợp', () => {
    expect(split('trường'.normalize('NFD'))).toBe('tr|ường');
  });

  it('từ chối thứ không phải tiếng Việt', () => {
    for (const text of ['', 'ng', 'b', '123', 'cá.', 'con cá', 'book', 'star']) {
      expect(split(text), text).toBeNull();
    }
  });

  it('ghép lại đúng tiếng ban đầu', () => {
    for (const word of ['nghiêng', 'khuỷu', 'giường', 'quạt', 'ưa']) {
      const { onset, rime } = splitSyllable(word)!;
      expect(onset + rime).toBe(word);
    }
  });
});
