import { Minimize } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';

const PresentingContext = createContext(false);

/** true khi nội dung trong sân khấu đang được trình chiếu toàn màn hình. */
export const usePresenting = () => useContext(PresentingContext);

/** Điều khiển toàn màn hình; trình duyệt không hỗ trợ (iPhone) thì phủ kín cửa sổ. */
export function useFullscreen() {
  const ref = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [active, setActive] = useState(false);

  const enter = useCallback(() => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    // Hiện sân khấu ngay trong cú bấm để trình duyệt còn cho phép toàn màn hình.
    flushSync(() => setActive(true));
    ref.current?.requestFullscreen?.().catch(() => {});
  }, []);

  const exit = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setActive(false);
  }, []);

  useEffect(() => {
    if (!active) return;
    const onChange = () => !document.fullscreenElement && setActive(false);
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && exit();
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      returnFocus.current?.focus();
    };
  }, [active, exit]);

  return { ref, active, enter, exit };
}

/**
 * Sân khấu trình chiếu. Khi toàn màn hình che header và cột tùy chọn,
 * chữ tối thiểu 48 px (class `stage-full`).
 */
export function PresentStage({
  fullscreen,
  inline,
  children,
}: {
  fullscreen: ReturnType<typeof useFullscreen>;
  /** Hiện ngay trong trang khi chưa toàn màn hình (công cụ chỉ trình chiếu). */
  inline: boolean;
  children: ReactNode;
}) {
  const { ref, active, exit } = fullscreen;
  return (
    <div
      ref={ref}
      role={active ? 'dialog' : undefined}
      aria-modal={active || undefined}
      aria-label={active ? 'Trình chiếu' : undefined}
      className={
        active
          ? 'stage stage-full'
          : inline
            ? 'stage min-h-[60dvh] rounded-xl border border-line'
            : 'hidden'
      }
    >
      {active && (
        <button type="button" className="btn absolute top-3 right-3" autoFocus onClick={exit}>
          <Minimize aria-hidden className="size-5" />
          Thoát toàn màn hình
        </button>
      )}
      <PresentingContext.Provider value={active}>{children}</PresentingContext.Provider>
    </div>
  );
}
