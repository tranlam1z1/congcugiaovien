export type Orientation = 'portrait' | 'landscape';

/** Kích thước A4 tính bằng mm. */
export const A4: Record<Orientation, { width: number; height: number }> = {
  portrait: { width: 210, height: 297 },
  landscape: { width: 297, height: 210 },
};

/** Khổ giấy ở hướng dọc (mm). */
export type PageSize = { width: number; height: number; label: string };

export const A4_PAGE: PageSize = { ...A4.portrait, label: 'A4' };

/** Đổi khổ dọc sang hướng đang chọn. */
export function orientPage({ width, height }: PageSize, orientation: Orientation) {
  const short = Math.min(width, height);
  const long = Math.max(width, height);
  return orientation === 'portrait'
    ? { width: short, height: long }
    : { width: long, height: short };
}

export const DEFAULT_MARGIN_MM = 12;

export const MM_PER_PX = 25.4 / 96;
export const PT_PER_MM = 72 / 25.4;

/** Xếp các khối cao thấp khác nhau vào trang, không cắt khối nào làm đôi. */
export function packByHeight<T>(
  items: readonly T[],
  heightOf: (item: T) => number,
  maxHeight: number,
): T[][] {
  const pages: T[][] = [];
  let used = 0;
  for (const item of items) {
    const height = heightOf(item);
    if (pages.length === 0 || used + height > maxHeight) {
      pages.push([]);
      used = 0;
    }
    pages[pages.length - 1]!.push(item);
    used += height;
  }
  return pages;
}

/** Chia mục vào các trang để không cắt ngang câu hỏi khi sang trang. */
export function paginate<T>(items: readonly T[], perPage: number): T[][] {
  const size = Math.max(1, Math.floor(perPage));
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
  return pages;
}
