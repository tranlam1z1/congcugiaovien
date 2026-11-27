export const TABS = ['vong-quay', 'dem-nguoc', 'tieng-on', 'boc-tham'] as const;
export type Tab = (typeof TABS)[number];

export const TAB_NAMES: Record<Tab, string> = {
  'vong-quay': 'Vòng quay gọi tên',
  'dem-nguoc': 'Đếm ngược',
  'tieng-on': 'Đo tiếng ồn',
  'boc-tham': 'Bốc thăm',
};

export const MAX_MINUTES = 180;
export const MAX_DRAW_NUMBER = 200;
export const MAX_DRAW_ITEMS = 100;
export const MAX_ITEM_LENGTH = 60;
export const MAX_HISTORY = 200;

export const DEFAULTS = {
  tab: 'vong-quay' as Tab,
  sound: true,
  minutes: 5,
  seconds: 0,
  sensitivity: 50,
  source: 'so' as 'so' | 'danh-sach',
  maxNumber: 10,
  items: '',
  once: true,
  /** Tên đã gọi, theo mã lớp. */
  called: {} as Record<string, string[]>,
  /** Các mục đã bốc, theo thứ tự. */
  drawn: [] as string[],
};

export type Options = typeof DEFAULTS;

const clamp = (value: unknown, min: number, max: number, fallback: number) => {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

const strings = (value: unknown) =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : [];

/** Dữ liệu lưu trên máy có thể cũ hoặc hỏng: ép về giá trị hợp lệ. */
export function toOptions(input: Partial<Record<keyof Options, unknown>>): Options {
  const called =
    typeof input.called === 'object' && input.called !== null ? input.called : {};
  return {
    tab: TABS.includes(input.tab as Tab) ? (input.tab as Tab) : 'vong-quay',
    sound: input.sound !== false,
    minutes: clamp(input.minutes, 0, MAX_MINUTES, 5),
    seconds: clamp(input.seconds, 0, 59, 0),
    sensitivity: clamp(input.sensitivity, 1, 100, 50),
    source: input.source === 'danh-sach' ? 'danh-sach' : 'so',
    maxNumber: clamp(input.maxNumber, 2, MAX_DRAW_NUMBER, 10),
    items: typeof input.items === 'string' ? input.items : '',
    once: input.once !== false,
    called: Object.fromEntries(Object.entries(called).map(([id, list]) => [id, strings(list)])),
    drawn: strings(input.drawn).slice(-MAX_HISTORY),
  };
}

/** Các mục để bốc: dãy số, hoặc mỗi dòng một mục. */
export function drawItems({ source, maxNumber, items }: Options): string[] {
  if (source === 'so') return Array.from({ length: maxNumber }, (_, i) => String(i + 1));
  return items
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim().slice(0, MAX_ITEM_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_DRAW_ITEMS);
}
