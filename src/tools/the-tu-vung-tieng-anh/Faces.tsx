/** Nội dung hai mặt thẻ, dùng chung cho bản in (đơn vị mm) và màn hình (đơn vị em). */
import type { Card, Visual } from './cards';
import type { Front } from './options';

export const IPA_FONT = "'Andika', sans-serif";

/** Những gì mặt trước hiện ra theo lựa chọn của giáo viên. */
export function frontParts(card: Card, visual: Visual, front: Front) {
  if (front === 'nghia') return { visual: null, text: card.meaning || card.word };
  if (front === 'tu') return { visual: null, text: card.word };
  if (front === 'hinh') return { visual, text: visual ? '' : card.word };
  return { visual, text: card.word };
}

export function Picture({ visual, size }: { visual: NonNullable<Visual>; size: string }) {
  if (visual.kind === 'colour') {
    return (
      <span
        data-visual="colour"
        role="img"
        aria-label="Ô màu"
        className="block rounded-full border-[0.6mm] border-[#374151]"
        style={{ width: size, height: size, background: visual.colour }}
      />
    );
  }
  if (visual.kind === 'number') {
    return (
      <span
        data-visual="number"
        className="block font-bold leading-none"
        style={{ fontSize: `calc(${size} * 0.9)` }}
      >
        {visual.digits}
      </span>
    );
  }
  const Icon = visual.icon;
  return (
    <Icon
      data-visual="icon"
      aria-hidden
      strokeWidth={1.4}
      style={{ width: size, height: size }}
    />
  );
}
