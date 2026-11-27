import { useToolOptions } from '@/core/storage/useToolOptions';
import type { ToolMeta } from '@/core/types';
import { ImagesPanel } from './ImagesPanel';
import { MergePanel } from './MergePanel';
import { PagesPanel } from './PagesPanel';
import type { ImageSettings } from './pdfOps';
import { SplitPanel, type SplitMode } from './SplitPanel';

const TABS = [
  { id: 'anh', label: 'Ảnh sang PDF' },
  { id: 'ghep', label: 'Ghép PDF' },
  { id: 'tach', label: 'Tách PDF' },
  { id: 'trang', label: 'Xoay, xoá, sắp xếp trang' },
] as const;
type Tab = (typeof TABS)[number]['id'];

const DEFAULTS = {
  tab: 'anh' as Tab,
  size: 'a4' as ImageSettings['size'],
  orientation: 'auto' as ImageSettings['orientation'],
  margin: 10,
  fit: 'contain' as ImageSettings['fit'],
  splitMode: 'khoang' as SplitMode,
};

const oneOf = <T,>(value: T, allowed: readonly T[], fallback: T) =>
  allowed.includes(value) ? value : fallback;

export default function CongCuPdfAnh({ tool }: { tool: ToolMeta }) {
  const [options, patch] = useToolOptions(tool.slug, DEFAULTS);
  const tab = oneOf(
    options.tab,
    TABS.map((t) => t.id),
    DEFAULTS.tab,
  );
  const settings: ImageSettings = {
    size: oneOf(options.size, ['a4', 'a5', 'letter', 'anh'], 'a4'),
    orientation: oneOf(options.orientation, ['auto', 'portrait', 'landscape'], 'auto'),
    margin: oneOf(options.margin, [0, 5, 10, 20], 10),
    fit: oneOf(options.fit, ['contain', 'cover'], 'contain'),
  };

  const panels: Record<Tab, JSX.Element> = {
    anh: <ImagesPanel settings={settings} onSettings={patch} />,
    ghep: <MergePanel />,
    tach: (
      <SplitPanel
        mode={oneOf(options.splitMode, ['khoang', 'tung-trang'], 'khoang')}
        onMode={(splitMode) => patch({ splitMode })}
      />
    ),
    trang: <PagesPanel />,
  };

  return (
    <div className="flex flex-col gap-5">
      <div role="group" aria-label="Chọn việc cần làm" className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className="toggle rounded-full px-4"
            aria-pressed={tab === item.id}
            onClick={() => patch({ tab: item.id })}
          >
            {item.label}
          </button>
        ))}
      </div>
      {/* Giữ cả bốn mục để chuyển qua lại không mất file đã chọn. */}
      {TABS.map((item) => (
        <section key={item.id} aria-label={item.label} hidden={tab !== item.id}>
          {panels[item.id]}
        </section>
      ))}
    </div>
  );
}
