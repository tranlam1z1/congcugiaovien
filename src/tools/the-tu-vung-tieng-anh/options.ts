/** Tùy chọn của flashcard. */
import { VOCAB } from '@/core/vocab/packs';
import { PER_PAGE, toText, type PerPage } from './cards';

export const FRONTS = [
  { value: 'hinh-tu', label: 'Hình và từ' },
  { value: 'tu', label: 'Chỉ từ tiếng Anh' },
  { value: 'hinh', label: 'Chỉ hình (không có hình thì hiện từ)' },
  { value: 'nghia', label: 'Nghĩa tiếng Việt' },
] as const;
export type Front = (typeof FRONTS)[number]['value'];

export const DEFAULTS = {
  text: toText(VOCAB[0]!.entries),
  perPage: 6 as number,
  /** In kèm trang mặt sau. */
  backs: true,
  front: 'hinh-tu' as Front,
  /** Trình chiếu: tự đọc từ khi hiện thẻ mới. */
  autoSpeak: false,
};

export type Options = typeof DEFAULTS;

export function resolve(options: Options) {
  return {
    perPage: (Object.hasOwn(PER_PAGE, options.perPage) ? options.perPage : 6) as PerPage,
    backs: Boolean(options.backs),
    front: FRONTS.some((f) => f.value === options.front) ? options.front : DEFAULTS.front,
    autoSpeak: Boolean(options.autoSpeak),
  };
}
