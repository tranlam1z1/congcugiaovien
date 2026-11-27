import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import type { PrintFontId } from '@/core/print/fonts';
import { A4_PAGE, type Orientation, type PageSize } from '@/core/print/paper';
import { PrintSheet } from '@/core/print/PrintSheet';

const PADDING = 24;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 2;

/** Xem trước trang A4 thật: thu phóng, lật trang, đếm trang. */
export function PrintPreview({
  orientation,
  font,
  paper = A4_PAGE,
  sheetRef,
  onPageCount,
  children,
}: {
  orientation: Orientation;
  font?: PrintFontId;
  paper?: PageSize;
  /** Phần tử chứa các trang, dùng để xuất PDF. */
  sheetRef: RefObject<HTMLDivElement>;
  onPageCount: (count: number) => void;
  children: ReactNode;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ available: 0, width: 0, height: 0, pages: 0 });
  /** null = vừa khung. */
  const [zoom, setZoom] = useState<number | null>(null);
  const [current, setCurrent] = useState(1);

  useEffect(() => {
    const scroller = scrollRef.current!;
    const sheet = sheetRef.current!;
    const measure = () => {
      const next = {
        available: scroller.clientWidth - PADDING,
        width: sheet.offsetWidth,
        height: sheet.offsetHeight,
        pages: sheet.querySelectorAll('[data-a4-page]').length,
      };
      setBox((previous) =>
        previous.available === next.available &&
        previous.width === next.width &&
        previous.height === next.height &&
        previous.pages === next.pages
          ? previous
          : next,
      );
    };
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    observer.observe(sheet);
    measure();
    return () => observer.disconnect();
  }, [sheetRef]);

  useEffect(() => onPageCount(box.pages), [box.pages, onPageCount]);

  const fit = box.width ? Math.min(1, box.available / box.width) : 1;
  const scale = zoom ?? fit;
  const page = Math.min(current, Math.max(1, box.pages));

  const changeZoom = (step: number) =>
    setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((scale + step) * 10) / 10)));

  const pageElements = () => [
    ...sheetRef.current!.querySelectorAll<HTMLElement>('[data-a4-page]'),
  ];

  const offsetOf = (element: HTMLElement) =>
    element.getBoundingClientRect().top - scrollRef.current!.getBoundingClientRect().top;

  const goTo = (target: number) => {
    const element = pageElements()[target - 1];
    if (!element) return;
    const scroller = scrollRef.current!;
    scroller.scrollTo({ top: scroller.scrollTop + offsetOf(element) - PADDING / 2 });
    setCurrent(target);
  };

  const trackScroll = () => {
    const middle = scrollRef.current!.clientHeight / 2;
    const index = pageElements().findLastIndex((element) => offsetOf(element) <= middle);
    setCurrent(Math.max(0, index) + 1);
  };

  return (
    <section aria-label="Xem trước" className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p aria-live="polite" className="font-medium">
          {box.pages} trang {paper.label}
        </p>
        {box.pages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="btn btn-icon"
              aria-label="Trang trước"
              disabled={page <= 1}
              onClick={() => goTo(page - 1)}
            >
              <ChevronLeft aria-hidden className="size-5" />
            </button>
            <span className="min-w-24 text-center">
              Trang {page}/{box.pages}
            </span>
            <button
              type="button"
              className="btn btn-icon"
              aria-label="Trang sau"
              disabled={page >= box.pages}
              onClick={() => goTo(page + 1)}
            >
              <ChevronRight aria-hidden className="size-5" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="btn btn-icon"
            aria-label="Thu nhỏ"
            disabled={scale <= MIN_ZOOM}
            onClick={() => changeZoom(-0.1)}
          >
            <ZoomOut aria-hidden className="size-5" />
          </button>
          <button
            type="button"
            className="btn min-w-20"
            title="Về vừa khung"
            aria-label={`Mức thu phóng ${Math.round(scale * 100)}%, bấm để vừa khung`}
            onClick={() => setZoom(null)}
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            type="button"
            className="btn btn-icon"
            aria-label="Phóng to"
            disabled={scale >= MAX_ZOOM}
            onClick={() => changeZoom(0.1)}
          >
            <ZoomIn aria-hidden className="size-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={trackScroll}
        tabIndex={0}
        role="group"
        aria-label="Các trang in"
        className="max-h-[75dvh] overflow-auto rounded-xl border border-line bg-desk p-3"
      >
        {box.width > 0 && box.pages === 0 && (
          <p className="p-6 text-center">Chưa có trang nào. Kiểm tra lại tùy chọn bên cạnh.</p>
        )}
        <div
          className="mx-auto"
          style={box.width ? { width: box.width * scale, height: box.height * scale } : undefined}
        >
          <div
            ref={sheetRef}
            className="w-max origin-top-left"
            style={{ transform: `scale(${scale})` }}
          >
            <PrintSheet orientation={orientation} font={font} paper={paper}>
              {children}
            </PrintSheet>
          </div>
        </div>
      </div>

      <p className="text-muted">
        Khi in, chọn khổ {paper.label}, tỉ lệ 100% (tắt “Vừa với trang”).
      </p>
    </section>
  );
}
