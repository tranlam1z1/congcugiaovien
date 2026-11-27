/** Đổi bảng tính (Excel, CSV) thành danh sách "Tên, Giới tính". */
import { removeDiacritics } from '../vi/normalize';
import { toGender, type Gender } from './model';

const fold = (text: string) => removeDiacritics(text).replace(/\s+/g, ' ').trim();

const cellText = (cell: unknown) =>
  typeof cell === 'string' || typeof cell === 'number'
    ? String(cell).replace(/\s+/g, ' ').trim()
    : '';

const FULL_NAME = /^(ho va ten|ho ten|ten hoc sinh|ho va ten hoc sinh|ho, ten)\b/;
const SURNAME = /^(ho dem|ho va ten dem|ho lot|ho)$/;
const GIVEN = /^ten$/;

const isNumber = (text: string) => /^[\d.,/-]+$/.test(text);

type Columns = {
  /** Dòng dữ liệu đầu tiên. */
  start: number;
  name: number[];
  gender: (row: string[]) => Gender;
};

function fromHeader(rows: string[][]): Columns | null {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const header = rows[i]!.map(fold);
    let name: number[] = [];
    const full = header.findIndex((h) => FULL_NAME.test(h));
    if (full >= 0) {
      name = [full];
      // "Họ và tên" gộp hai cột: cột sau không có tiêu đề, chứa tên gọi.
      const next = rows.slice(i + 1).map((row) => row[full + 1] ?? '');
      const filled = next.filter(Boolean);
      if (!header[full + 1] && filled.length && filled.every((t) => !isNumber(t) && !toGender(t))) {
        name.push(full + 1);
      }
    } else {
      const surname = header.findIndex((h) => SURNAME.test(h));
      const given = header.findIndex((h) => GIVEN.test(h));
      if (surname >= 0 && given >= 0) name = [surname, given];
      else if (given >= 0) name = [given];
    }
    if (!name.length) continue;

    const genderColumn = header.findIndex((h) => h === 'gioi tinh' || h === 'phai');
    const femaleMark = header.indexOf('nu');
    return {
      start: i + 1,
      name,
      gender: (row) => {
        if (genderColumn >= 0) return toGender(row[genderColumn] ?? '');
        // Cột "Nữ" đánh dấu x.
        if (femaleMark >= 0) return row[femaleMark] ? 'nu' : 'nam';
        return null;
      },
    };
  }
  return null;
}

/** Không có dòng tiêu đề: lấy cột chữ đầu tiên làm tên. */
function guess(rows: string[][]): Columns {
  const width = Math.max(0, ...rows.map((r) => r.length));
  const columns = Array.from({ length: width }, (_, c) =>
    rows.map((r) => r[c] ?? '').filter(Boolean),
  );
  const genderColumn = columns.findIndex(
    (cells) => cells.length > 0 && cells.every((t) => toGender(t)),
  );
  const name = columns.findIndex(
    (cells, c) => c !== genderColumn && cells.filter((t) => !isNumber(t)).length > cells.length / 2,
  );
  return {
    start: 0,
    name: [Math.max(0, name)],
    gender: (row) => (genderColumn >= 0 ? toGender(row[genderColumn] ?? '') : null),
  };
}

export function rowsToText(input: unknown[][]): string {
  const rows = input.map((row) => row.map(cellText));
  const { start, name, gender } = fromHeader(rows) ?? guess(rows);
  return rows
    .slice(start)
    .flatMap((row) => {
      const full = name
        .map((c) => row[c] ?? '')
        .filter(Boolean)
        .join(' ')
        // Dấu phẩy trong tên sẽ bị hiểu là ngăn cách giới tính.
        .replace(/[,;|]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (!full || isNumber(full)) return [];
      const sex = gender(row);
      return [sex ? `${full}, ${sex === 'nam' ? 'Nam' : 'Nữ'}` : full];
    })
    .join('\n');
}

/** Tách dòng CSV/TXT; tự nhận dấu ngăn cách tab, chấm phẩy hoặc phẩy. */
export function delimitedToRows(text: string): string[][] {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim());
  const delimiter = ['\t', ';', ','].find((d) => lines.some((l) => l.includes(d)));
  return lines.map((line) =>
    delimiter ? line.split(delimiter).map((cell) => cell.replace(/^"|"$/g, '')) : [line],
  );
}
