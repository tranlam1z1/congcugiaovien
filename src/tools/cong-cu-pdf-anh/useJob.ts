import { useCallback, useEffect, useRef, useState } from 'react';
import type { Job, Message, Output } from './jobs';

export type JobState =
  | { status: 'idle' }
  | { status: 'working'; done: number; total: number }
  | { status: 'done'; fileName: string; size: number }
  | { status: 'error'; message: string };

const FAILED = 'Chưa xử lý được. Bạn tải lại trang rồi thử lại.';

function download({ name, type, data }: Output) {
  const url = URL.createObjectURL(new Blob([data as BlobPart], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Chạy một việc trong Web Worker, báo tiến độ và tải file kết quả về máy. */
export function useJob() {
  const [state, setState] = useState<JobState>({ status: 'idle' });
  const worker = useRef<Worker | null>(null);

  const stop = useCallback(() => {
    worker.current?.terminate();
    worker.current = null;
  }, []);
  useEffect(() => stop, [stop]);

  const start = useCallback(
    (job: Job) => {
      stop();
      setState({ status: 'working', done: 0, total: 0 });
      const next = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
      worker.current = next;
      next.onmessage = ({ data }: MessageEvent<Message>) => {
        if (data.type === 'progress') {
          setState({ status: 'working', done: data.done, total: data.total });
          return;
        }
        stop();
        if (data.type === 'done') {
          download(data.output);
          setState({ status: 'done', fileName: data.output.name, size: data.output.data.length });
        } else {
          setState({ status: 'error', message: data.message });
        }
      };
      next.onerror = (event) => {
        console.error(event);
        stop();
        setState({ status: 'error', message: FAILED });
      };
      next.postMessage(job);
    },
    [stop],
  );

  const reset = useCallback(() => {
    stop();
    setState({ status: 'idle' });
  }, [stop]);

  return { state, start, reset };
}
