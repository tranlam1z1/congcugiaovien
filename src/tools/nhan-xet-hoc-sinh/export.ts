/** Chép và tải bảng nhận xét. Mọi việc làm trên máy. */
import { QUALITIES, STUDIES, type Line } from './state';

const HEADERS = ['STT', 'Họ và tên', 'Học tập', 'Phẩm chất', 'Nhận xét'];

const labelOf = <T extends string>(list: { value: T; label: string }[], value: T) =>
  list.find((item) => item.value === value)!.label;

export const toTable = (lines: Line[]): string[][] => [
  HEADERS,
  ...lines.map((line, i) => [
    String(i + 1),
    line.name,
    labelOf(STUDIES, line.study),
    labelOf(QUALITIES, line.quality),
    line.comment.replace(/\s+/g, ' ').trim(),
  ]),
];

/** Ô mở đầu bằng = + - @ bị phần mềm bảng tính hiểu là công thức. */
const safe = (cell: string) => (/^[=+\-@]/.test(cell) ? `'${cell}` : cell);

/** Dán thẳng vào Excel hoặc Google Sheets thành các cột. */
export const toClipboardText = (lines: Line[]) =>
  toTable(lines)
    .map((row) => row.map(safe).join('\t'))
    .join('\n');

/** Có BOM để Excel đọc đúng tiếng Việt. */
export const toCsv = (lines: Line[]) =>
  '﻿' +
  toTable(lines)
    .map((row) => row.map((cell) => `"${safe(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');

export function downloadCsv(lines: Line[], fileName: string) {
  const url = URL.createObjectURL(new Blob([toCsv(lines)], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function downloadExcel(lines: Line[], fileName: string) {
  const { default: writeXlsxFile } = await import('write-excel-file/browser');
  const data = toTable(lines).map((row, index) =>
    row.map((value) => ({
      value,
      type: String,
      wrap: true,
      alignVertical: 'top' as const,
      ...(index === 0 ? { fontWeight: 'bold' as const } : {}),
    })),
  );
  await writeXlsxFile(data, {
    columns: [{ width: 6 }, { width: 28 }, { width: 18 }, { width: 14 }, { width: 80 }],
  }).toFile(`${fileName}.xlsx`);
}
