/** Tùy chọn của công cụ giấy in và cách đổi thành kích thước thật (mm). */
import type { Orientation, PageSize } from '@/core/print/paper';
import { orientPage } from '@/core/print/paper';
import { effectiveSize, getPaperType } from './papers';
import type { Area } from './pen';

export const PAGE_SIZES: (PageSize & { id: string })[] = [
  { id: 'a4', label: 'A4', width: 210, height: 297 },
  { id: 'a3', label: 'A3', width: 297, height: 420 },
  { id: 'a5', label: 'A5', width: 148, height: 210 },
  { id: 'a6', label: 'A6', width: 105, height: 148 },
  { id: 'b4', label: 'B4', width: 250, height: 353 },
  { id: 'b5', label: 'B5', width: 176, height: 250 },
  { id: 'letter', label: 'Letter', width: 215.9, height: 279.4 },
  { id: 'legal', label: 'Legal', width: 215.9, height: 355.6 },
];

export const MIN_CUSTOM_MM = 50;
export const MAX_CUSTOM_MM = 600;
export const MAX_PAGES = 50;

export const COLORS = [
  { id: 'xam', label: 'Xám', value: '#4b5563' },
  { id: 'den', label: 'Đen', value: '#000000' },
  { id: 'xanh-duong', label: 'Xanh dương', value: '#1d4ed8' },
  { id: 'xanh-la', label: 'Xanh lá', value: '#15803d' },
  { id: 'do', label: 'Đỏ', value: '#dc2626' },
  { id: 'tim', label: 'Tím', value: '#7c3aed' },
] as const;

export const POSITIONS = [
  { value: 'top-left', label: 'Trên, trái' },
  { value: 'top-center', label: 'Trên, giữa' },
  { value: 'top-right', label: 'Trên, phải' },
  { value: 'middle-left', label: 'Giữa, trái' },
  { value: 'middle-center', label: 'Chính giữa' },
  { value: 'middle-right', label: 'Giữa, phải' },
  { value: 'bottom-left', label: 'Dưới, trái' },
  { value: 'bottom-center', label: 'Dưới, giữa' },
  { value: 'bottom-right', label: 'Dưới, phải' },
] as const;
export type Position = (typeof POSITIONS)[number]['value'];

export const DEFAULTS = {
  type: 'o-ly',
  /** 0: theo mặc định của loại giấy. */
  size: 0,
  /** -1: theo mặc định của loại giấy. */
  major: -1,
  columns: 2,
  color: 'xanh-duong',
  /** Độ đậm nét, phần trăm. */
  opacity: 45,
  page: 'a4',
  customWidth: 200,
  customHeight: 200,
  orientation: 'portrait' as Orientation,
  margin: 10,
  pages: 1,
  redMargin: false,
  watermark: '',
  logo: '',
  logoSize: 40,
  logoOpacity: 30,
  logoRotate: 0,
  logoPosition: 'middle-center' as Position,
  title: '',
  school: '',
  showNameLine: false,
};

export type Options = typeof DEFAULTS;

const clamp = (value: number, min: number, max: number, fallback: number) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;

export function pageSize(options: Options): PageSize {
  if (options.page === 'custom') {
    const width = clamp(options.customWidth, MIN_CUSTOM_MM, MAX_CUSTOM_MM, 200);
    const height = clamp(options.customHeight, MIN_CUSTOM_MM, MAX_CUSTOM_MM, 200);
    return { width, height, label: `${width}×${height} mm` };
  }
  return PAGE_SIZES.find((p) => p.id === options.page) ?? PAGE_SIZES[0]!;
}

/** Khổ tùy chỉnh giữ đúng chiều rộng và cao đã nhập; khổ chuẩn xoay theo hướng chọn. */
export function pageDimensions(options: Options) {
  const paper = pageSize(options);
  const orientation: Orientation =
    options.page === 'custom'
      ? paper.width > paper.height
        ? 'landscape'
        : 'portrait'
      : options.orientation === 'landscape'
        ? 'landscape'
        : 'portrait';
  return { paper, orientation, ...orientPage(paper, orientation) };
}

/** Số dòng ước lượng dư của một đoạn chữ, `charMm` là bề rộng một ký tự. */
const lines = (text: string, charMm: number, width: number) =>
  Math.ceil((text.trim().length * charMm) / Math.max(1, width));

/** Chiều cao dành cho đầu phiếu (trường, họ tên, tiêu đề); khổ nhỏ thì chữ xuống dòng. */
export const headerHeight = ({ title, school, showNameLine }: Options, width: number) => {
  const height =
    lines(school, 2.8, width) * 6 +
    (showNameLine ? 9 : 0) +
    (title.trim() ? 4 + lines(title, 3.8, width) * 9 : 0);
  return height ? height + 3 : 0;
};

export function resolve(options: Options) {
  const type = getPaperType(options.type);
  const dimensions = pageDimensions(options);
  const margin = clamp(options.margin, 0, 30, 10);
  const header = headerHeight(options, dimensions.width - 2 * margin);
  const area: Area = {
    x: margin,
    y: margin + header,
    width: Math.max(0, dimensions.width - 2 * margin),
    height: Math.max(0, dimensions.height - 2 * margin - header),
  };
  return {
    type,
    ...dimensions,
    margin,
    header,
    area,
    size: effectiveSize(type, options.size),
    major: options.major >= 0 ? options.major : (type.major ?? 0),
    columns: clamp(options.columns, 2, 4, 2),
    pages: Math.round(clamp(options.pages, 1, MAX_PAGES, 1)),
    color: (COLORS.find((c) => c.id === options.color) ?? COLORS[0]).value,
    opacity: clamp(options.opacity, 10, 100, 45) / 100,
  };
}

export type Resolved = ReturnType<typeof resolve>;

/** Góc trên trái của logo (mm) theo vị trí đã chọn. */
export function placeLogo(
  position: Position,
  box: { width: number; height: number },
  page: { width: number; height: number },
  margin: number,
) {
  const [row, column] = position.split('-') as [string, string];
  const along = (key: string, size: number, total: number) =>
    key === 'top' || key === 'left'
      ? margin
      : key === 'bottom' || key === 'right'
        ? total - margin - size
        : (total - size) / 2;
  return {
    left: along(column, box.width, page.width),
    top: along(row, box.height, page.height),
  };
}
