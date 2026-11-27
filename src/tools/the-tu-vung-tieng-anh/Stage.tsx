/** Trình chiếu lật thẻ: Space hoặc bút trình chiếu lật rồi sang thẻ kế. */
import { ChevronLeft, ChevronRight, FlipHorizontal2, Shuffle, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { canSpeak, speak } from '@/core/present/speech';
import { usePresenterKeys } from '@/core/present/usePresenterKeys';
import { createRng, randomSeed } from '@/core/rng';
import { useIsClient } from '@/core/useMediaQuery';
import { visualOf, type Card } from './cards';
import { frontParts, IPA_FONT, Picture } from './Faces';
import type { Front } from './options';

export function Stage({
  cards,
  front,
  autoSpeak,
}: {
  cards: Card[];
  front: Front;
  autoSpeak: boolean;
}) {
  const [position, setPosition] = useState(0);
  const [flipped, setFlipped] = useState(false);
  /** null: theo thứ tự danh sách. */
  const [seed, setSeed] = useState<number | null>(null);
  // HTML dựng sẵn không biết máy đọc được hay không nên nút “Nghe” thêm sau khi hydrate.
  const isClient = useIsClient();

  const indices = cards.map((_, i) => i);
  const order = seed === null ? indices : createRng(seed).shuffle(indices);
  // Danh sách có thể vừa bị sửa ngắn lại.
  const at = Math.min(position, Math.max(0, cards.length - 1));
  const card = cards[order[at] ?? 0];

  const go = (step: number) => {
    if (cards.length === 0) return;
    setPosition((at + step + cards.length) % cards.length);
    setFlipped(false);
  };
  const { presenting, primary } = usePresenterKeys(
    () => (flipped ? go(1) : setFlipped(true)),
    () => go(-1),
  );

  const word = card?.word;
  useEffect(() => {
    if (presenting && autoSpeak && word) speak(word);
  }, [presenting, autoSpeak, word, at]);

  if (!card) return <p role="status">Nhập từ ở mục “Từ vựng” để bắt đầu.</p>;

  const parts = frontParts(card, visualOf(card), front);

  return (
    <div className="flex w-full flex-col items-center gap-4 [.stage-full_&]:pt-20">
      <p className="text-muted [.stage-full_&]:text-[1.5rem]">
        Thẻ {at + 1}/{cards.length}
      </p>
      <button
        type="button"
        data-stage-card
        aria-label={flipped ? 'Mặt sau, bấm để xem mặt trước' : 'Mặt trước, bấm để lật'}
        className="flex min-h-[16rem] w-full max-w-[40rem] flex-col items-center justify-center gap-4 rounded-2xl border-4 border-accent bg-surface p-6 text-ink [.stage-full_&]:min-h-[55dvh] [.stage-full_&]:max-w-[80vw]"
        onClick={() => setFlipped(!flipped)}
      >
        {flipped ? (
          <>
            <span className="text-[2.5em] font-bold leading-tight break-words">{card.word}</span>
            {card.ipa && (
              <span className="text-[1.5em]" style={{ fontFamily: IPA_FONT }}>
                {card.ipa}
              </span>
            )}
            {card.meaning && <span className="text-[1.75em] text-accent">{card.meaning}</span>}
          </>
        ) : (
          <>
            {parts.visual && <Picture visual={parts.visual} size="min(5em, 35dvh)" />}
            {parts.text && (
              <span className="text-[2.75em] font-bold leading-tight break-words">
                {parts.text}
              </span>
            )}
          </>
        )}
      </button>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" className="btn" onClick={() => go(-1)}>
          <ChevronLeft aria-hidden className="size-[1.2em]" />
          Trước
        </button>
        <button
          ref={primary}
          type="button"
          className="btn btn-primary"
          onClick={() => setFlipped(!flipped)}
        >
          <FlipHorizontal2 aria-hidden className="size-[1.2em]" />
          Lật thẻ
        </button>
        <button type="button" className="btn" onClick={() => go(1)}>
          Tiếp
          <ChevronRight aria-hidden className="size-[1.2em]" />
        </button>
        {isClient && canSpeak() && (
          <button type="button" className="btn" onClick={() => speak(card.word)}>
            <Volume2 aria-hidden className="size-[1.2em]" />
            Nghe
          </button>
        )}
        <button
          type="button"
          className="btn"
          aria-pressed={seed !== null}
          onClick={() => {
            setSeed(seed === null ? randomSeed() : null);
            setPosition(0);
            setFlipped(false);
          }}
        >
          <Shuffle aria-hidden className="size-[1.2em]" />
          {seed === null ? 'Xáo thẻ' : 'Theo thứ tự'}
        </button>
      </div>
    </div>
  );
}
