import type { PrintFontId } from '@/core/print/fonts';
import { A4, DEFAULT_MARGIN_MM } from '@/core/print/paper';
import type { ContentType, Fields, Level } from './qr';

export const DEFAULTS = {
  mode: 'single' as 'single' | 'bulk',
  type: 'link' as ContentType,
  link: '',
  text: '',
  wifiName: '',
  wifiPassword: '',
  wifiSecurity: 'WPA' as Fields['wifiSecurity'],
  wifiHidden: false,
  email: '',
  emailSubject: '',
  emailBody: '',
  phone: '',
  /** Chữ in dưới mã (chế độ một mã). */
  label: '',
  bulk: '',
  level: 'M' as Level,
  foreground: '#000000',
  background: '#ffffff',
  logo: '',
  perPage: 1,
  cutLines: true,
  title: '',
  font: 'be-vietnam-pro' as PrintFontId,
  largeText: false,
};

export type Options = typeof DEFAULTS;

/** Số mã mỗi trang → [cột, hàng]. */
export const GRIDS: Record<number, [number, number]> = {
  1: [1, 1],
  4: [2, 2],
  6: [2, 3],
  12: [3, 4],
  20: [4, 5],
  30: [5, 6],
};

export const TITLE_MM = 16;

/** Kích thước một ô, mã QR và phần nhãn (mm), cùng số ký tự nhãn vừa hai dòng. */
export function cellLayout(perPage: number, hasTitle: boolean, large: boolean, charWidth: number) {
  const [columns, rows] = GRIDS[perPage] ?? GRIDS[1]!;
  const width = (A4.portrait.width - 2 * DEFAULT_MARGIN_MM) / columns;
  // Trừ 1 mm để làm tròn không đẩy hàng cuối ra ngoài trang.
  const height =
    (A4.portrait.height - 2 * DEFAULT_MARGIN_MM - (hasTitle ? TITLE_MM : 0) - 1) / rows;
  // Lưới dày thì chữ nhỏ lại.
  const fontPt = (perPage >= 20 ? 9 : perPage >= 6 ? 11 : 14) * (large ? 1.3 : 1);
  const lineMm = fontPt * 0.3528 * 1.4;
  const labelMm = lineMm * 2.3;
  const qr = Math.min(width - 8, height - labelMm - 6, 150);
  const perLine = Math.floor((width - 6) / (fontPt * 0.3528 * charWidth * 0.95));
  return { columns, rows, width, height, fontPt, labelMm, qr, maxChars: Math.max(4, perLine * 2 - 2) };
}

export const truncate = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
