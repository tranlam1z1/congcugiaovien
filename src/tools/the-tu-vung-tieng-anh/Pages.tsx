import { A4Page } from '@/core/print/A4Page';
import { fitSize, geometry, MARGIN_MM, visualOf, type Card, type PerPage, type Sheet } from './cards';
import { frontParts, IPA_FONT, Picture } from './Faces';
import type { Front } from './options';

/** Cỡ chữ gốc (pt) theo số thẻ mỗi trang. */
const BASE = { 4: 40, 6: 34, 8: 28 } as const;

function FrontFace({ card, perPage, front }: { card: Card; perPage: PerPage; front: Front }) {
  const { width, height } = geometry(perPage);
  const parts = frontParts(card, visualOf(card), front);
  // Có cả hình và chữ thì hình chiếm khoảng nửa thẻ.
  const picture = Math.min(width - 20, parts.text ? height * 0.5 : height * 0.7);
  return (
    <>
      {parts.visual && <Picture visual={parts.visual} size={`${picture}mm`} />}
      {parts.text && (
        <p
          className="font-bold leading-tight"
          style={{ fontSize: `${fitSize(parts.text, width - 10, BASE[perPage])}pt` }}
        >
          {parts.text}
        </p>
      )}
    </>
  );
}

function BackFace({ card, perPage }: { card: Card; perPage: PerPage }) {
  const { width } = geometry(perPage);
  const base = BASE[perPage];
  return (
    <>
      <p
        className="font-bold leading-tight"
        style={{ fontSize: `${fitSize(card.word, width - 10, base * 0.75)}pt` }}
      >
        {card.word}
      </p>
      {card.ipa && (
        <p
          className="leading-snug"
          // Be Vietnam Pro thiếu ký hiệu phiên âm nên dùng Andika.
          style={{ fontFamily: IPA_FONT, fontSize: `${Math.round(base * 0.55)}pt` }}
        >
          {card.ipa}
        </p>
      )}
      {card.meaning && (
        <p
          className="leading-snug"
          style={{ fontSize: `${fitSize(card.meaning, width - 10, base * 0.65)}pt` }}
        >
          {card.meaning}
        </p>
      )}
    </>
  );
}

export function CardPage({
  sheet,
  perPage,
  front,
}: {
  sheet: Sheet;
  perPage: PerPage;
  front: Front;
}) {
  const { columns, width, height } = geometry(perPage);
  return (
    <A4Page margin={MARGIN_MM}>
      <div
        data-side={sheet.side}
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${columns}, ${width}mm)`,
          gridAutoRows: `${height}mm`,
        }}
      >
        {sheet.slots.map((card, i) => (
          <div
            key={i}
            data-card={card?.word ?? ''}
            // Đường cắt nét đứt quanh mỗi thẻ.
            className={`flex flex-col items-center justify-center gap-[2.5mm] overflow-hidden px-[4mm] text-center break-words ${
              card ? 'border-[0.3mm] border-dashed border-[#6b7280]' : ''
            }`}
          >
            {card &&
              (sheet.side === 'front' ? (
                <FrontFace card={card} perPage={perPage} front={front} />
              ) : (
                <BackFace card={card} perPage={perPage} />
              ))}
          </div>
        ))}
      </div>
    </A4Page>
  );
}
