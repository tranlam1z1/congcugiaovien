import { useCallback, useEffect, useState } from 'react';
import { secondsLeft, tick, toggle, type Timer } from './logic';
import { ring, unlockSound } from './sound';

const IDLE: Timer = { status: 'idle' };

/**
 * Đồng hồ đếm ngược. Giữ ở cấp công cụ để chuyển sang vòng quay hay bốc thăm
 * thì đồng hồ vẫn chạy. Tính theo mốc kết thúc nên không trôi khi tab bị ẩn.
 */
export function useCountdown(durationSeconds: number, sound: boolean) {
  const duration = durationSeconds * 1000;
  const [timer, setTimer] = useState<Timer>(IDLE);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (timer.status !== 'running') return;
    const id = window.setInterval(() => {
      const time = Date.now();
      setNow(time);
      setTimer((current) => tick(current, time));
    }, 200);
    return () => window.clearInterval(id);
  }, [timer.status]);

  useEffect(() => {
    if (timer.status === 'done' && sound) ring();
    // Chỉ kêu lúc vừa hết giờ, bật âm thanh sau đó thì không kêu lại.
  }, [timer.status]);

  const startPause = useCallback(() => {
    unlockSound();
    const time = Date.now();
    setNow(time);
    setTimer((current) => toggle(current, time, duration));
  }, [duration]);

  const reset = useCallback(() => setTimer(IDLE), []);

  return {
    status: timer.status,
    seconds: secondsLeft(timer, now, duration),
    startPause,
    reset,
  };
}

export type Countdown = ReturnType<typeof useCountdown>;
