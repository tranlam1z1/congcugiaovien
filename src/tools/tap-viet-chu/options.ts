/** Tùy chọn, mẫu có sẵn và cách ép tùy chọn đã lưu về giá trị hợp lệ. */
import { COLORS, type Color } from '@/core/handwriting/style';

export const SIZES = [1, 1.5, 2, 3] as const;
export const CELLS = [4, 5, 6, 8] as const;

export const PAPERS = [
  { value: 'o-ly', label: 'Ô ly' },
  { value: 'dong-ke', label: 'Dòng kẻ ngang' },
  { value: 'trang', label: 'Giấy trắng' },
] as const;
export type Paper = (typeof PAPERS)[number]['value'];

export const STYLES = [
  { value: 'mo', label: 'Tô mờ' },
  { value: 'cham', label: 'Nét chấm' },
  { value: 'rong', label: 'Viền rỗng' },
] as const;
export type TraceStyle = (typeof STYLES)[number]['value'];

const list = (text: string) => text.split(' ').join('\n');

export const SAMPLES = [
  { label: 'Chữ thường', text: list('a ă â b c d đ e ê g h i k l m n o ô ơ p q r s t u ư v x y') },
  { label: 'Chữ hoa', text: list('A Ă Â B C D Đ E Ê G H I K L M N O Ô Ơ P Q R S T U Ư V X Y') },
  { label: 'Chữ số', text: list('0 1 2 3 4 5 6 7 8 9') },
  {
    label: 'Dấu thanh',
    text: ['a á à ả ã ạ', 'e é è ẻ ẽ ẹ', 'o ó ò ỏ õ ọ', 'ba bá bà bả bã bạ'].join('\n'),
  },
  {
    label: 'Câu mẫu',
    text: [
      'Công cha như núi Thái Sơn',
      'Nghĩa mẹ như nước trong nguồn chảy ra',
      'Uống nước nhớ nguồn',
      'Bé chăm ngoan, học giỏi.',
    ].join('\n'),
  },
] as const;

export const DEFAULT_TITLE = 'Luyện viết chữ';
export const MAX_ROWS_PER_SAMPLE = 10;

export const DEFAULTS = {
  text: ['a', 'ă', 'â', 'bé', 'Bà bế bé.'].join('\n'),
  /** Chiều cao chữ thường, tính bằng số ô. */
  size: 2 as number,
  /** Cạnh một ô (mm). */
  cell: 5 as number,
  paper: 'o-ly' as Paper,
  /** Đường chân chữ và đường cao chữ. */
  guides: true,
  style: 'mo' as TraceStyle,
  /** Độ mờ của chữ để tô, phần trăm. */
  fade: 65,
  color: 'den' as Color,
  boldFirst: true,
  repeat: true,
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
    size: oneOf<number>(options.size, SIZES, DEFAULTS.size),
    cell: oneOf<number>(options.cell, CELLS, DEFAULTS.cell),
    paper: oneOf(
      options.paper,
      PAPERS.map((p) => p.value),
      DEFAULTS.paper,
    ),
    guides: Boolean(options.guides),
    style: oneOf(
      options.style,
      STYLES.map((s) => s.value),
      DEFAULTS.style,
    ),
    fade: within(options.fade, 0, 90, DEFAULTS.fade),
    color: (COLORS.find((c) => c.value === options.color) ?? COLORS[0]).hex,
    boldFirst: Boolean(options.boldFirst),
    repeat: Boolean(options.repeat),
    rows: within(options.rows, 1, MAX_ROWS_PER_SAMPLE, DEFAULTS.rows),
    blanks: within(options.blanks, 0, MAX_ROWS_PER_SAMPLE, DEFAULTS.blanks),
    title: String(options.title).trim() || DEFAULT_TITLE,
    school: String(options.school).trim(),
    showNameLine: Boolean(options.showNameLine),
  };
}

export type Settings = ReturnType<typeof resolve>;
