import { ListOrdered, RotateCcw, Shuffle } from 'lucide-react';
import { pickIndex, remaining, shuffled } from './logic';
import { usePresenterKeys } from '@/core/present/usePresenterKeys';

export function DrawPanel({
  items,
  drawn,
  once,
  onDraw,
  onRestart,
}: {
  items: string[];
  /** Các mục đã bốc (đã lọc theo danh sách hiện tại). */
  drawn: string[];
  once: boolean;
  onDraw: (picked: string[]) => void;
  onRestart: () => void;
}) {
  const waiting = once ? remaining(items, drawn) : items;
  const draw = () => {
    if (waiting.length) onDraw([waiting[pickIndex(waiting.length)]!]);
  };
  const { presenting, primary } = usePresenterKeys(draw);

  if (items.length === 0) {
    return <p role="status">Chưa có mục nào. Nhập danh sách ở mục “Bốc thăm”.</p>;
  }

  const last = drawn.at(-1);
  return (
    <div className="flex w-full flex-col items-center gap-5">
      <p
        aria-live="assertive"
        data-result
        className="min-h-[1.4em] max-w-full text-[3.5em] leading-tight font-bold break-words text-accent"
      >
        {last ?? '?'}
      </p>
      <p role="status">
        {!once
          ? `${items.length} mục, mục đã bốc vẫn có thể ra lại.`
          : waiting.length === 0
            ? `Đã bốc hết ${items.length} mục.`
            : `Còn ${waiting.length}/${items.length} mục.`}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          ref={primary}
          type="button"
          className={`btn ${presenting ? 'btn-primary' : ''}`}
          disabled={waiting.length === 0}
          onClick={draw}
        >
          <Shuffle aria-hidden className="size-[1.2em]" />
          Rút thăm
        </button>
        {once && (
          <button
            type="button"
            className="btn"
            disabled={waiting.length === 0}
            onClick={() => onDraw(shuffled(waiting))}
          >
            <ListOrdered aria-hidden className="size-[1.2em]" />
            Xếp thứ tự cả lượt
          </button>
        )}
        <button type="button" className="btn" disabled={drawn.length === 0} onClick={onRestart}>
          <RotateCcw aria-hidden className="size-[1.2em]" />
          Bốc lại từ đầu
        </button>
      </div>
      {drawn.length > 0 && (
        <ol aria-label="Thứ tự đã bốc" className="flex max-w-4xl flex-wrap justify-center gap-2">
          {drawn.map((item, i) => (
            <li key={i} className="rounded-lg border border-line px-3 py-1">
              <span className="text-muted">{i + 1}.</span> <b>{item}</b>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
