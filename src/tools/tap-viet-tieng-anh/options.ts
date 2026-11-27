/** Tùy chọn và cách ép tùy chọn đã lưu về giá trị hợp lệ. */
import { COLORS, type Color } from '@/core/handwriting/style';

/** Khoảng cách giữa hai dòng kẻ liền nhau (mm), cũng là chiều cao chữ thường. */
export const SIZES = [4, 5, 6, 8, 10] as const;
export const MAX_ROWS_PER_SAMPLE = 10;
export const DEFAULT_TITLE = 'Luyện viết tiếng Anh';

export const LETTERINGS = [
  { value: 'print', label: 'Chữ in (print)' },
  { value: 'cursive', label: 'Chữ nghiêng nối nét (cursive)' },
] as const;
export type Lettering = (typeof LETTERINGS)[number]['value'];

export const STYLES = [
  { value: 'mo', label: 'Tô mờ' },
  { value: 'cham', label: 'Nét chấm' },
] as const;
export type TraceStyle = (typeof STYLES)[number]['value'];

export const DEFAULTS = {
  text: ['Aa', 'Bb', 'cat', 'apple', 'I like my school.'].join('\n'),
  /** Không đặt tên `font`: tên đó là font chữ trong tùy chọn chung. */
  lettering: 'print' as Lettering,
  size: 6 as number,
  style: 'cham' as TraceStyle,
  /** Độ mờ của chữ để tô, phần trăm. */
  fade: 20,
  color: 'den' as Color,
  boldFirst: true,
  repeat: true,
  pictures: true,
  /** Số dòng có chữ mẫu cho mỗi mẫu. */
  rows: 2,
  /** Số dòng trống để tự viết sau mỗi mẫu. */
  blanks: 1,
  title: '',
  school: '',
  showNameLine: true,
  students: '',
};

export type Options = typeof DEFAULTS;

const within = (value: number, min: number, max: number, fallback: number) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;

const oneOf = <T>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

export function resolve(options: Options) {
  return {
    lettering: oneOf(
      options.lettering,
      LETTERINGS.map((l) => l.value),
      DEFAULTS.lettering,
    ),
    size: oneOf<number>(options.size, SIZES, DEFAULTS.size),
    style: oneOf(
      options.style,
      STYLES.map((s) => s.value),
      DEFAULTS.style,
    ),
    fade: within(options.fade, 0, 90, DEFAULTS.fade),
    color: (COLORS.find((c) => c.value === options.color) ?? COLORS[0]).hex,
    boldFirst: Boolean(options.boldFirst),
    repeat: Boolean(options.repeat),
    pictures: Boolean(options.pictures),
    rows: within(options.rows, 1, MAX_ROWS_PER_SAMPLE, DEFAULTS.rows),
    blanks: within(options.blanks, 0, MAX_ROWS_PER_SAMPLE, DEFAULTS.blanks),
    title: String(options.title).trim() || DEFAULT_TITLE,
    school: String(options.school).trim(),
    showNameLine: Boolean(options.showNameLine),
  };
}

export type Settings = ReturnType<typeof resolve>;
