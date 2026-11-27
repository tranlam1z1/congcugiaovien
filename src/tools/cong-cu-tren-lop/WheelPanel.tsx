import { Play, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { pickIndex, remaining, spinTo, wheelLabel } from './logic';
import { unlockSound } from './sound';
import { usePresenterKeys } from './usePresenterKeys';

const SPIN_MS = 4000;
const FILLS = ['#fde68a', '#bfdbfe', '#bbf7d0', '#fbcfe8', '#ddd6fe', '#fed7aa', '#a7f3d0'];

/** Điểm trên vòng, góc tính từ đỉnh theo chiều kim đồng hồ. */
const point = (angle: number, radius = 100) => {
  const rad = (angle * Math.PI) / 180;
  return `${radius * Math.sin(rad)} ${-radius * Math.cos(rad)}`;
};

function Wheel({ names }: { names: string[] }) {
  const slice = 360 / Math.max(1, names.length);
  const fontSize = Math.max(3, Math.min(10, (slice * Math.PI * 65) / 180 / 1.3));
  // Hai ô đầu và cuối đứng cạnh nhau không được trùng màu.
  const fill = (i: number) =>
    FILLS[i === names.length - 1 && i % FILLS.length === 0 ? 3 : i % FILLS.length];
  return (
    <svg viewBox="-102 -102 204 204" className="block size-full" aria-hidden>
      {names.length <= 1 ? (
        <circle r="100" fill={FILLS[0]} />
      ) : (
        names.map((_, i) => (
          <path
            key={i}
            d={`M0 0L${point(i * slice)}A100 100 0 ${slice > 180 ? 1 : 0} 1 ${point((i + 1) * slice)}Z`}
            fill={fill(i)}
            stroke="#fff"
            strokeWidth="0.5"
          />
        ))
      )}
      {names.map((name, i) => (
        <text
          key={i}
          x="94"
          transform={`rotate(${(i + 0.5) * slice - 90})`}
          textAnchor="end"
          dominantBaseline="central"
          fontSize={fontSize}
          fontWeight="600"
          fill="#1c1917"
        >
          {wheelLabel(name)}
        </text>
      ))}
      <circle r="100" fill="none" stroke="#c2410c" strokeWidth="2" />
      <circle r="9" fill="#fff" stroke="#c2410c" strokeWidth="2" />
    </svg>
  );
}

type Spin = { names: string[]; winner: string; done: boolean };

export function WheelPanel({
  names,
  called,
  sound,
  onCalled,
  onRestart,
}: {
  names: string[];
  /** Các em đã gọi (đã lọc theo danh sách hiện tại). */
  called: string[];
  sound: boolean;
  onCalled: (name: string) => void;
  onRestart: () => void;
}) {
  const [rotation, setRotation] = useState(0);
  const [duration, setDuration] = useState(0);
  const [spin, setSpin] = useState<Spin | null>(null);
  const timeout = useRef(0);
  useEffect(() => () => window.clearTimeout(timeout.current), []);
  // Đổi danh sách hoặc gọi lại từ đầu thì bỏ kết quả cũ.
  const listKey = names.join('\n');
  useEffect(() => {
    window.clearTimeout(timeout.current);
    setSpin(null);
  }, [listKey]);

  const waiting = remaining(names, called);
  const spinning = spin !== null && !spin.done;
  // Lịch sử bị xoá (vd "Về mặc định") thì kết quả cũ không còn đúng.
  const shown = spin?.done && !called.includes(spin.winner) ? null : spin;

  const start = () => {
    if (spinning || waiting.length === 0) return;
    if (sound) unlockSound();
    const index = pickIndex(waiting.length);
    const winner = waiting[index]!;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const time = reduced ? 0 : SPIN_MS;
    setDuration(time);
    setRotation((previous) => spinTo(previous, index, waiting.length, Math.random() * 0.7 - 0.35));
    setSpin({ names: waiting, winner, done: false });
    timeout.current = window.setTimeout(() => {
      setSpin({ names: waiting, winner, done: true });
      onCalled(winner);
    }, time);
  };

  const restart = () => {
    window.clearTimeout(timeout.current);
    setSpin(null);
    onRestart();
  };

  const { presenting, primary } = usePresenterKeys(start);

  if (names.length === 0) {
    return <p role="status">Chưa có học sinh. Dán danh sách ở mục “Danh sách lớp”.</p>;
  }

  return (
    <div className="flex w-full flex-wrap items-center justify-center gap-8">
      <div
        className={`relative aspect-square shrink-0 ${presenting ? 'w-[min(60dvh,90vw)]' : 'w-[min(24rem,100%)]'}`}
      >
        {/* Cắt các góc của khung vuông khi xoay, nếu không trang bị cuộn. */}
        <div className="size-full overflow-hidden">
          <div
            data-wheel
            className="size-full"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: `transform ${duration}ms cubic-bezier(0.15, 0.7, 0.1, 1)`,
            }}
          >
            <Wheel names={shown?.names ?? waiting} />
          </div>
        </div>
        {/* Kim chỉ ở đỉnh vòng. */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 border-x-[0.9rem] border-t-[1.8rem] border-x-transparent border-t-accent" />
      </div>

      <div className="flex min-w-0 flex-[1_1_12em] flex-col items-center gap-4">
        <p aria-live="assertive" className="min-h-[1.3em] text-[2.2em] leading-tight font-bold">
          {shown?.done ? shown.winner : spinning ? '…' : ''}
        </p>
        <p role="status">
          {waiting.length === 0
            ? `Đã gọi đủ ${names.length} em.`
            : `Đã gọi ${called.length}/${names.length} em.`}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            ref={primary}
            type="button"
            className={`btn ${presenting ? 'btn-primary' : ''}`}
            disabled={spinning || waiting.length === 0}
            onClick={start}
          >
            <Play aria-hidden className="size-[1.2em]" />
            Quay
          </button>
          <button type="button" className="btn" disabled={called.length === 0} onClick={restart}>
            <RotateCcw aria-hidden className="size-[1.2em]" />
            Gọi lại từ đầu
          </button>
        </div>
        {!presenting && called.length > 0 && (
          <p className="max-w-sm text-muted">Đã gọi: {called.join(', ')}</p>
        )}
      </div>
    </div>
  );
}
