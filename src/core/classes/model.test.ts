import { describe, expect, it } from 'vitest';
import { delimitedToRows, rowsToText } from './importRows';
import {
  activeClass,
  addClass,
  emptyStore,
  parseStudents,
  removeActiveClass,
  toStore,
  updateClass,
} from './model';

describe('đọc danh sách lớp', () => {
  it('nhận giới tính với nhiều cách viết', () => {
    expect(
      parseStudents('Lê An, Nam\nPhạm  Bình\tNữ\n Võ Chi - nữ\nHồ Dũng; M\n\nMai Em'),
    ).toEqual([
      { name: 'Lê An', gender: 'nam' },
      { name: 'Phạm Bình', gender: 'nu' },
      { name: 'Võ Chi', gender: 'nu' },
      { name: 'Hồ Dũng', gender: 'nam' },
      { name: 'Mai Em', gender: null },
    ]);
  });

  it('giới hạn 80 em', () => {
    expect(parseStudents('An\n'.repeat(100))).toHaveLength(80);
  });
});

describe('nhập từ bảng tính', () => {
  it('bảng của trường: có tiêu đề, số thứ tự, cột giới tính', () => {
    const rows = [
      ['TRƯỜNG TIỂU HỌC A'],
      ['STT', 'Họ và tên', 'Ngày sinh', 'Giới tính'],
      [1, 'Lê Văn An', '01/02/2018', 'Nam'],
      [2, 'Phạm Thị Bình', '03/04/2018', 'Nữ'],
      [null, '', null, ''],
    ];
    expect(rowsToText(rows)).toBe('Lê Văn An, Nam\nPhạm Thị Bình, Nữ');
  });

  it('cột họ đệm và tên tách riêng, cột Nữ đánh dấu x', () => {
    const rows = [
      ['TT', 'Họ đệm', 'Tên', 'Nữ'],
      [1, 'Lê Văn', 'An', ''],
      [2, 'Phạm Thị', 'Bình', 'x'],
    ];
    expect(rowsToText(rows)).toBe('Lê Văn An, Nam\nPhạm Thị Bình, Nữ');
  });

  it('"Họ và tên" gộp hai cột', () => {
    const rows = [
      ['STT', 'Họ và tên', '', 'Ghi chú'],
      [1, 'Lê Văn', 'An', ''],
      [2, 'Phạm Thị', 'Bình', ''],
    ];
    expect(rowsToText(rows)).toBe('Lê Văn An\nPhạm Thị Bình');
  });

  it('không có tiêu đề', () => {
    expect(rowsToText([[1, 'Lê An', 'nam'], [2, 'Võ Chi', 'nữ']])).toBe('Lê An, Nam\nVõ Chi, Nữ');
    expect(rowsToText([['Lê An'], ['Võ Chi']])).toBe('Lê An\nVõ Chi');
    expect(rowsToText([])).toBe('');
  });

  it('đọc CSV có BOM và dấu chấm phẩy', () => {
    const rows = delimitedToRows('﻿Họ tên;Giới tính\r\n"Lê An";Nam\r\n');
    expect(rowsToText(rows)).toBe('Lê An, Nam');
  });
});

describe('kho nhiều lớp', () => {
  it('thêm, sửa, xoá lớp đang chọn', () => {
    let store = addClass(emptyStore());
    expect(activeClass(store).name).toBe('Lớp 2');
    store = updateClass(store, { text: 'An' });
    expect(activeClass(store).text).toBe('An');
    store = removeActiveClass(store);
    expect(store.classes).toHaveLength(1);
    expect(removeActiveClass(store)).toEqual(emptyStore());
  });

  it('dữ liệu hỏng về kho rỗng', () => {
    expect(toStore(null)).toEqual(emptyStore());
    expect(toStore({ classes: [{ name: 5 }], activeId: 99 })).toEqual({
      classes: [{ id: 1, name: '', text: '' }],
      activeId: 1,
    });
  });
});
