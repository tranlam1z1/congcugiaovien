/** Bỏ dấu tiếng Việt và chữ hoa: "Phiếu Toán Đố" thành "phieu toan do". */
export function removeDiacritics(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/** Tách thành từ đã bỏ dấu; dấu câu và gạch nối coi như khoảng trắng. */
export function toWords(text: string): string[] {
  return removeDiacritics(text)
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/** Tên file không dấu: "Phiếu Toán" thành "phieu-toan". */
export const slugify = (text: string) => toWords(text).join('-');
