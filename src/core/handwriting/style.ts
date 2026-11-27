/** Màu chữ và cỡ nét dùng chung cho các công cụ tập viết. */

export const COLORS = [
  { value: 'den', label: 'Xám đen', hex: '#1f2937' },
  { value: 'xanh-duong', label: 'Xanh dương', hex: '#1d4ed8' },
  { value: 'do', label: 'Đỏ', hex: '#dc2626' },
  { value: 'xanh-la', label: 'Xanh lá', hex: '#15803d' },
] as const;
export type Color = (typeof COLORS)[number]['value'];

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Bề dày nét viền, cỡ chấm và khoảng cách chấm (mm) theo chiều cao chữ thường. */
export const pens = (xHeight: number) => ({
  outline: clamp(xHeight * 0.025, 0.2, 0.45),
  dot: clamp(0.4 + (xHeight - 4) * 0.025, 0.4, 0.9),
  spacing: clamp(0.9 + (xHeight - 4) * 0.08, 0.9, 2.4),
});
