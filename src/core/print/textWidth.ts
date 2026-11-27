/** Ước lượng dư bề rộng chữ để dàn trang trước khi trình duyệt vẽ. */

/** Bề rộng ký tự của Be Vietnam Pro tính theo em, làm tròn lên theo nhóm. */
const WIDTHS: [string, number][] = [
  [" '`ijlI.:!,;\"", 0.35],
  ['frt1()J*[]{}|~“”®', 0.5],
  ['szehknuvxy7?^_<>/', 0.6],
  ['acgo-', 0.65],
  ['CGĐOQƠ#%™©¼½¾', 0.85],
  ['mwM—', 0.9],
  ['W@', 1.05],
  ['‰', 1.25],
];
const BY_CHAR = new Map(WIDTHS.flatMap(([chars, width]) => [...chars].map((c) => [c, width])));

export function charWidth(char: string) {
  // Dấu thanh không làm chữ rộng ra nên tra theo chữ gốc.
  const base = char.normalize('NFD')[0]!;
  const known = BY_CHAR.get(char) ?? BY_CHAR.get(base);
  if (known !== undefined) return known;
  // Chữ ngoài bảng Latinh dùng font khác của máy, tính rộng nhất.
  if (base.codePointAt(0)! > 0x24f && !/[\u2000-\u20cf]/.test(base)) return 1.25;
  return /\p{Lu}/u.test(base) ? 0.75 : 0.7;
}

/** Bề rộng cả đoạn chữ thường (không đậm), tính theo em. */
export const textWidthEm = (text: string) =>
  [...text].reduce((sum, char) => sum + charWidth(char), 0);
