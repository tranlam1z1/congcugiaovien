import { useEffect, useRef } from 'react';
import { usePresenting } from '@/components/PresentStage';

/**
 * Điều khiển khi trình chiếu bằng phím hoặc bút trình chiếu: `next` chạy việc chính
 * (Space, mũi tên phải, PageDown), `back` cho mũi tên trái và PageUp.
 * Trả về ref gắn vào nút chính để vào toàn màn hình là bấm Space được ngay.
 */
export function usePresenterKeys(next: () => void, back?: () => void) {
  const presenting = usePresenting();
  const primary = useRef<HTMLButtonElement>(null);
  const actions = useRef({ next, back });
  actions.current = { next, back };

  useEffect(() => {
    if (!presenting) return;
    primary.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      const run = ['ArrowRight', 'PageDown', ' '].includes(event.key)
        ? actions.current.next
        : ['ArrowLeft', 'PageUp'].includes(event.key)
          ? actions.current.back
          : undefined;
      if (!run || event.repeat) return;
      // Space trên nút đang focus là bấm nút đó.
      if (event.key === ' ' && (event.target as HTMLElement).closest('button')) return;
      event.preventDefault();
      run();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [presenting]);

  return { presenting, primary };
}
