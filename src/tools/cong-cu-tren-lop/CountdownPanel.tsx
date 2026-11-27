import { Pause, Play, RotateCcw } from 'lucide-react';
import { formatTime } from './logic';
import type { Countdown } from '@/core/present/useCountdown';
import { usePresenterKeys } from '@/core/present/usePresenterKeys';

const PRESETS = [1, 2, 3, 5, 10, 15];

export function CountdownPanel({
  countdown,
  minutes,
  seconds: extraSeconds,
  onPreset,
}: {
  countdown: Countdown;
  minutes: number;
  seconds: number;
  onPreset: (minutes: number) => void;
}) {
  const { status, seconds, startPause, reset } = countdown;
  const { presenting, primary } = usePresenterKeys(startPause, reset);
  const empty = minutes === 0 && extraSeconds === 0;
  const time = formatTime(seconds);

  return (
    <div className="flex w-full flex-col items-center gap-5 [.stage-full_&]:gap-3">
      <div role="group" aria-label="Chọn nhanh thời gian" className="flex flex-wrap justify-center gap-2">
        {PRESETS.map((value) => (
          <button
            key={value}
            type="button"
            className="toggle rounded-full px-4 [.stage-full_&]:text-[1.25rem]"
            aria-pressed={minutes === value && extraSeconds === 0}
            onClick={() => onPreset(value)}
          >
            {value} phút
          </button>
        ))}
      </div>
      <p
        role="timer"
        aria-label="Thời gian còn lại"
        className={`text-[clamp(4rem,18vw,10rem)] font-bold tabular-nums leading-none ${status === 'done' ? 'text-accent' : ''}`}
        // Trình chiếu: to hết cỡ mà "180:00" vẫn vừa bề ngang.
        style={
          presenting
            ? { fontSize: `min(${Math.floor(130 / Math.max(4, time.length))}vw, 36dvh)` }
            : undefined
        }
      >
        {time}
      </p>
      <p role="status" className="min-h-[1.5em] text-[1em] font-bold">
        {status === 'done' ? 'Hết giờ!' : status === 'paused' ? 'Đang tạm dừng' : ''}
        {status === 'idle' && empty ? 'Đặt thời gian ở mục “Đếm ngược”.' : ''}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          ref={primary}
          type="button"
          className={`btn ${presenting ? 'btn-primary' : ''}`}
          disabled={status === 'idle' && empty}
          onClick={startPause}
        >
          {status === 'running' ? (
            <Pause aria-hidden className="size-[1.2em]" />
          ) : (
            <Play aria-hidden className="size-[1.2em]" />
          )}
          {status === 'running' ? 'Tạm dừng' : status === 'paused' ? 'Chạy tiếp' : 'Bắt đầu'}
        </button>
        <button type="button" className="btn" disabled={status === 'idle'} onClick={reset}>
          <RotateCcw aria-hidden className="size-[1.2em]" />
          Đặt lại
        </button>
      </div>
    </div>
  );
}
