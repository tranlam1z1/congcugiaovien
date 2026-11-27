/**
 * Đo tiếng ồn bằng micro. Âm thanh chỉ được đọc biên độ ngay trên máy:
 * không ghi âm, không lưu, không gửi đi.
 */
import { Mic, MicOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { lightOf, noiseLevel, rms, smooth, type Light } from './logic';
import { usePresenterKeys } from './usePresenterKeys';

type Status = 'off' | 'asking' | 'on';

const LIGHTS: { id: Light; color: string; label: string }[] = [
  { id: 'red', color: '#dc2626', label: 'Quá ồn' },
  { id: 'yellow', color: '#facc15', label: 'Hơi ồn' },
  { id: 'green', color: '#16a34a', label: 'Yên tĩnh' },
];

function errorMessage(cause: unknown) {
  const name = cause instanceof DOMException ? cause.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'Chưa được dùng micro. Bấm biểu tượng ổ khoá cạnh địa chỉ trang, cho phép Micro rồi bấm “Bật micro”.';
  }
  if (name === 'NotFoundError') return 'Không thấy micro. Cắm micro rồi bấm “Bật micro”.';
  return 'Chưa mở được micro. Đóng ứng dụng khác đang dùng micro rồi thử lại.';
}

function useMicrophone(sensitivity: number) {
  const [status, setStatus] = useState<Status>('off');
  const [level, setLevel] = useState(0);
  const [error, setError] = useState('');
  const close = useRef<(() => void) | null>(null);
  /** Tăng mỗi lần bật hoặc tắt, để bỏ lượt xin quyền đã cũ. */
  const attempt = useRef(0);
  const sensitivityRef = useRef(sensitivity);
  sensitivityRef.current = sensitivity;

  const stop = () => {
    attempt.current++;
    close.current?.();
    close.current = null;
    setStatus('off');
    setLevel(0);
  };

  const start = async () => {
    const id = ++attempt.current;
    setError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Trình duyệt này không cho dùng micro. Mở trang bằng Chrome, Edge hoặc Safari mới.');
      return;
    }
    setStatus('asking');
    let stream: MediaStream | undefined;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        // Tắt các bộ lọc tự động, nếu không tiếng ồn bị giảm bớt trước khi đo.
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      const tracks = stream.getTracks();
      // Đã rời trang hoặc bấm tắt trong lúc chờ cho phép.
      if (id !== attempt.current) {
        tracks.forEach((track) => track.stop());
        return;
      }
      const context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      context.createMediaStreamSource(stream).connect(analyser);
      const samples = new Float32Array(analyser.fftSize);
      let current = 0;
      const timer = window.setInterval(() => {
        analyser.getFloatTimeDomainData(samples);
        current = smooth(current, noiseLevel(rms(samples), sensitivityRef.current));
        setLevel(Math.round(current));
      }, 100);
      close.current = () => {
        window.clearInterval(timer);
        tracks.forEach((track) => track.stop());
        void context.close();
      };
      void context.resume();
      setStatus('on');
    } catch (cause) {
      console.warn(cause);
      stream?.getTracks().forEach((track) => track.stop());
      if (id !== attempt.current) return;
      setError(errorMessage(cause));
      setStatus('off');
    }
  };

  // Rời công cụ là tắt micro.
  useEffect(
    () => () => {
      attempt.current++;
      close.current?.();
    },
    [],
  );

  return { status, level, error, start, stop };
}

export function NoisePanel({ sensitivity }: { sensitivity: number }) {
  const { status, level, error, start, stop } = useMicrophone(sensitivity);
  const toggle = () => (status === 'off' ? void start() : stop());
  const { presenting, primary } = usePresenterKeys(toggle);
  const light = status === 'on' ? lightOf(level) : null;

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <div className="flex flex-wrap items-center justify-center gap-8">
        <ul aria-hidden className="flex flex-col gap-3 rounded-[2rem] bg-[#1c1917] p-4">
          {LIGHTS.map((item) => (
            <li
              key={item.id}
              data-light={item.id}
              data-on={light === item.id || undefined}
              className={`rounded-full ${presenting ? 'size-[16dvh]' : 'size-20'}`}
              style={{ background: item.color, opacity: light === item.id ? 1 : 0.18 }}
            />
          ))}
        </ul>
        <div className="flex flex-col items-center gap-3">
          <p role="status" className="min-w-[6em] text-[2.2em] font-bold">
            {light
              ? LIGHTS.find((l) => l.id === light)!.label
              : status === 'asking'
                ? 'Đang xin quyền…'
                : 'Micro đang tắt'}
          </p>
          <div
            role="meter"
            aria-label="Mức ồn"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={level}
            className="h-[1.2em] w-[min(10em,80vw)] overflow-hidden rounded-full border-2 border-line"
          >
            <div className="h-full bg-ink" style={{ width: `${level}%` }} />
          </div>
        </div>
      </div>
      {error && (
        <p role="alert" className="max-w-xl rounded-lg border-2 border-accent bg-surface p-3">
          {error}
        </p>
      )}
      <button
        ref={primary}
        type="button"
        className={`btn ${presenting ? 'btn-primary' : ''}`}
        onClick={toggle}
      >
        {status === 'off' ? (
          <Mic aria-hidden className="size-[1.2em]" />
        ) : (
          <MicOff aria-hidden className="size-[1.2em]" />
        )}
        {status === 'off' ? 'Bật micro' : 'Tắt micro'}
      </button>
      {!presenting && (
        <p className="text-muted">Chỉ đo độ to ngay trên máy này, không ghi âm.</p>
      )}
    </div>
  );
}
