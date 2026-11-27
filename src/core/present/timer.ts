/** Đồng hồ đếm ngược: logic thuần. */

export type Timer =
  | { status: 'idle' }
  | { status: 'running'; endAt: number }
  | { status: 'paused'; left: number }
  | { status: 'done' };

export function tick(timer: Timer, now: number): Timer {
  return timer.status === 'running' && now >= timer.endAt ? { status: 'done' } : timer;
}

/** Bắt đầu, tạm dừng hoặc chạy tiếp; hết giờ rồi thì chạy lại từ đầu. */
export function toggle(timer: Timer, now: number, duration: number): Timer {
  if (timer.status === 'running') {
    const left = timer.endAt - now;
    return left > 0 ? { status: 'paused', left } : { status: 'done' };
  }
  if (timer.status === 'paused') return { status: 'running', endAt: now + timer.left };
  return duration > 0 ? { status: 'running', endAt: now + duration } : timer;
}

/** Số giây còn lại để hiển thị (làm tròn lên: còn 0,2 giây vẫn hiện 1). */
export function secondsLeft(timer: Timer, now: number, duration: number) {
  if (timer.status === 'done') return 0;
  const ms =
    timer.status === 'idle'
      ? duration
      : timer.status === 'paused'
        ? timer.left
        : timer.endAt - now;
  return Math.max(0, Math.ceil(ms / 1000));
}

export const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
