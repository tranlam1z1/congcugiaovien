/** Đọc khoảng trang giáo viên nhập để tách file. */

/**
 * "1-3, 5, 8-" trên file 10 trang cho ra ba file: trang 1–3, trang 5, trang 8–10.
 * Số trang trả về tính từ 0.
 */
export function parseRanges(text: string, total: number) {
  const groups: number[][] = [];
  for (const part of text.split(/[,;\n]/).map((p) => p.trim()).filter(Boolean)) {
    const match = /^(\d+)(?:\s*[-–]\s*(\d*))?$/.exec(part);
    if (!match) return { groups: [], error: `Không hiểu “${part}”. Viết dạng 1-3, 5, 8-10.` };
    const from = Number(match[1]);
    const to = match[2] === undefined ? from : match[2] === '' ? total : Number(match[2]);
    if (from < 1 || to > total || from > to) {
      return { groups: [], error: `“${part}” ngoài phạm vi. File có ${total} trang.` };
    }
    groups.push(Array.from({ length: to - from + 1 }, (_, i) => from - 1 + i));
  }
  return { groups, error: groups.length ? '' : 'Nhập khoảng trang cần tách, ví dụ 1-3, 5.' };
}

export const everyPage = (total: number) => Array.from({ length: total }, (_, i) => [i]);

/** Tên phần đuôi file theo các trang trong nhóm: "trang-5" hoặc "trang-1-3". */
export const groupName = (group: number[]) =>
  group.length === 1 ? `trang-${group[0]! + 1}` : `trang-${group[0]! + 1}-${group.at(-1)! + 1}`;

export const baseName = (fileName: string) =>
  fileName.replace(/\.[^.]+$/, '').trim() || 'tai-lieu';

/** Hai nhóm trùng trang vẫn phải ra hai file khác tên. */
export function uniqueNames(names: string[]) {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const count = (seen.get(name) ?? 0) + 1;
    seen.set(name, count);
    return count === 1 ? name : name.replace(/(\.[^.]+)$/, ` (${count})$1`);
  });
}

export const formatSize = (bytes: number) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
