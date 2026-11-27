import { Download, Maximize, Printer, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { PrintFontId } from '@/core/print/fonts';
import type { Orientation, PageSize } from '@/core/print/paper';
import { randomSeed } from '@/core/rng';
import type { ToolMeta } from '@/core/types';
import { useMediaQuery } from '@/core/useMediaQuery';
import { CheckboxField, NumberField } from './fields';
import { OptionPanel, type OptionGroup } from './OptionPanel';
import { PresentStage, useFullscreen } from './PresentStage';
import { PrintPreview } from './PrintPreview';

export type ToolLayoutProps = {
  tool: ToolMeta;
  /** Nhóm tùy chọn ở cột trái; hai nhóm đầu mở sẵn. */
  options: OptionGroup[];
  onReset: () => void;
  /** Các <A4Page> của bản in (công cụ 'print' và 'both'). */
  children?: ReactNode;
  orientation?: Orientation;
  /** Font trên phiếu in. */
  font?: PrintFontId;
  /** Khổ giấy, mặc định A4. */
  paper?: PageSize;
  /** Màn hình trình chiếu (công cụ 'present' và 'both'). */
  stage?: ReactNode;
  /** Có seed thì hiện nút "Đổi bộ khác" và ô mã đề. */
  seed?: { value: number; onChange: (seed: number) => void };
  answerKey?: { checked: boolean; onChange: (checked: boolean) => void };
  /** Nút riêng của công cụ: Tải PNG, Xuất Word... (dùng class `btn`). */
  actions?: ReactNode;
};

/** Khung chung mọi công cụ: tùy chọn, xem trước A4, thanh hành động. */
export function ToolLayout({
  tool,
  options,
  onReset,
  children,
  orientation = 'portrait',
  font,
  paper,
  stage,
  seed,
  answerKey,
  actions,
}: ToolLayoutProps) {
  const canPrint = tool.mode === 'print' || tool.mode === 'both';
  const canPresent = (tool.mode === 'present' || tool.mode === 'both') && stage !== undefined;
  const isMobile = useMediaQuery('screen and (max-width: 1023px)');
  const sheetRef = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen();
  const [pageCount, setPageCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groups: OptionGroup[] = seed
    ? [
        ...options,
        {
          title: 'Mã đề',
          content: (
            <NumberField
              label="Mã đề"
              hint="Nhập lại mã cũ để tạo đúng bộ đã in."
              value={seed.value}
              min={0}
              max={999999999}
              onChange={seed.onChange}
            />
          ),
        },
      ]
    : options;
  const panel = <OptionPanel groups={groups} onReset={onReset} />;

  const downloadPdf = async () => {
    setExporting(true);
    setError(null);
    try {
      const { exportPdf } = await import('@/core/export/exportPdf');
      await exportPdf(sheetRef.current!, tool.slug, tool.name);
    } catch (cause) {
      console.error(cause);
      setError(
        'Chưa tạo được PDF. Bạn thử lại, hoặc bấm “In ngay” rồi chọn “Lưu dưới dạng PDF”.',
      );
    } finally {
      setExporting(false);
    }
  };

  const regenerate = seed && (
    <button type="button" className="btn" onClick={() => seed.onChange(randomSeed())}>
      <RefreshCw aria-hidden className="size-5" />
      Đổi bộ khác
    </button>
  );

  const extras = (answerKey || actions) && (
    <>
      {answerKey && (
        <CheckboxField
          label="Kèm đáp án"
          checked={answerKey.checked}
          onChange={answerKey.onChange}
        />
      )}
      {actions}
    </>
  );

  const outputs = (
    <>
      {canPrint && (
        <>
          <button
            type="button"
            className="btn"
            disabled={exporting || pageCount === 0}
            onClick={downloadPdf}
          >
            <Download aria-hidden className="size-5" />
            {exporting ? 'Đang tạo PDF…' : 'Tải PDF'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={pageCount === 0}
            onClick={() => window.print()}
          >
            <Printer aria-hidden className="size-5" />
            In ngay
          </button>
        </>
      )}
      {canPresent && (
        <button
          type="button"
          className={canPrint ? 'btn' : 'btn btn-primary'}
          onClick={fullscreen.enter}
        >
          <Maximize aria-hidden className="size-5" />
          Toàn màn hình
        </button>
      )}
    </>
  );

  const alert = error && (
    <p role="alert" className="rounded-lg border-2 border-accent bg-surface p-3">
      {error}
    </p>
  );

  return (
    <div className="flex items-start gap-6">
      {!isMobile && (
        <aside aria-label="Tùy chọn" className="hidden w-80 shrink-0 lg:block">
          {panel}
        </aside>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {!isMobile && (
          <div className="hidden flex-wrap items-center gap-3 lg:flex">
            {regenerate}
            {extras}
            <div className="ml-auto flex flex-wrap gap-3">{outputs}</div>
          </div>
        )}
        {isMobile && (
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn" onClick={() => setDrawerOpen(true)}>
              <SlidersHorizontal aria-hidden className="size-5" />
              Tùy chọn
            </button>
            {extras}
          </div>
        )}
        {alert}
        {canPrint && (
          <PrintPreview
            orientation={orientation}
            font={font}
            paper={paper}
            sheetRef={sheetRef}
            onPageCount={setPageCount}
          >
            {children}
          </PrintPreview>
        )}
        {canPresent && (
          <PresentStage fullscreen={fullscreen} inline={!canPrint}>
            {stage}
          </PresentStage>
        )}
        {isMobile && (
          <div className="sticky bottom-0 z-20 -mx-4 flex gap-2 border-t border-line bg-bg px-4 py-2 *:flex-1 *:flex-col *:gap-0.5 *:px-1">
            {regenerate}
            {outputs}
          </div>
        )}
      </div>

      {isMobile && (
        <OptionDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          {panel}
        </OptionDrawer>
      )}
    </div>
  );
}

/** Ngăn kéo "Tùy chọn" từ dưới lên trên điện thoại. */
function OptionDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current!;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label="Tùy chọn"
      className="drawer"
      onClose={onClose}
      // Bấm vào nền mờ (chính phần tử dialog) thì đóng.
      onClick={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="flex max-h-[80dvh] flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2">
          <h2 className="font-semibold">Tùy chọn</h2>
          <button type="button" className="btn" onClick={onClose}>
            Xong
          </button>
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
      </div>
    </dialog>
  );
}
