import { RotateCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SelectField } from '@/components/fields';
import type { ImageSettings } from './pdfOps';
import { formatSize } from './ranges';
import { confirmSize, FilePicker, isImage, RunBar, SortableList } from './shared';
import { useJob } from './useJob';

type Item = { id: number; file: File; url: string; rotation: number };

export function ImagesPanel({
  settings,
  onSettings,
}: {
  settings: ImageSettings;
  onSettings: (patch: Partial<ImageSettings>) => void;
}) {
  const [items, setItems] = useState<Item[]>([]);
  const nextId = useRef(0);
  const job = useJob();

  // Giữ danh sách hiện tại để thu hồi địa chỉ ảnh khi rời công cụ.
  const latest = useRef(items);
  latest.current = items;
  useEffect(() => () => latest.current.forEach((i) => URL.revokeObjectURL(i.url)), []);

  const change = (next: Item[]) => {
    for (const item of items) {
      if (!next.some((i) => i.id === item.id)) URL.revokeObjectURL(item.url);
    }
    setItems(next);
    job.reset();
  };

  const add = (files: File[]) => {
    const total = [...items.map((i) => i.file), ...files].reduce((sum, f) => sum + f.size, 0);
    if (!confirmSize(total)) return;
    change([
      ...items,
      ...files.map((file) => ({
        id: nextId.current++,
        file,
        url: URL.createObjectURL(file),
        rotation: 0,
      })),
    ]);
  };

  return (
    <div className="flex flex-col gap-4">
      <FilePicker label="Chọn ảnh" accept="image/*" filter={isImage} onFiles={add} />
      {items.length > 0 && (
        <SortableList
          label="Ảnh đã chọn"
          grid
          className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3"
          items={items}
          nameOf={(item) => item.file.name}
          onChange={change}
          actions={(item) => (
            <button
              type="button"
              className="btn btn-icon"
              aria-label={`Xoay ${item.file.name}`}
              title="Xoay phải"
              onClick={() =>
                change(
                  items.map((i) =>
                    i.id === item.id ? { ...i, rotation: (i.rotation + 90) % 360 } : i,
                  ),
                )
              }
            >
              <RotateCw aria-hidden className="size-5" />
            </button>
          )}
        >
          {(item) => (
            <>
              <span className="flex size-40 items-center justify-center overflow-hidden">
                <img
                  alt=""
                  src={item.url}
                  draggable={false}
                  className="max-h-full max-w-full object-contain"
                  style={{ transform: `rotate(${item.rotation}deg)` }}
                />
              </span>
              <span className="w-full truncate text-center" title={item.file.name}>
                {item.file.name}
              </span>
              <span className="text-muted">{formatSize(item.file.size)}</span>
            </>
          )}
        </SortableList>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SelectField
          label="Khổ trang"
          value={settings.size}
          options={[
            { value: 'a4', label: 'A4' },
            { value: 'a5', label: 'A5' },
            { value: 'letter', label: 'Letter' },
            { value: 'anh', label: 'Theo cỡ ảnh' },
          ]}
          onChange={(size) => onSettings({ size })}
        />
        {settings.size !== 'anh' && (
          <SelectField
            label="Hướng trang"
            value={settings.orientation}
            options={[
              { value: 'auto', label: 'Theo từng ảnh' },
              { value: 'portrait', label: 'Dọc' },
              { value: 'landscape', label: 'Ngang' },
            ]}
            onChange={(orientation) => onSettings({ orientation })}
          />
        )}
        <SelectField
          label="Lề"
          value={String(settings.margin)}
          options={[0, 5, 10, 20].map((mm) => ({
            value: String(mm),
            label: mm ? `${mm} mm` : 'Không lề',
          }))}
          onChange={(margin) => onSettings({ margin: Number(margin) })}
        />
        {settings.size !== 'anh' && (
          <SelectField
            label="Cách đặt ảnh"
            value={settings.fit}
            options={[
              { value: 'contain', label: 'Vừa trang, giữ cả ảnh' },
              { value: 'cover', label: 'Phủ kín, cắt bớt mép' },
            ]}
            onChange={(fit) => onSettings({ fit })}
          />
        )}
      </div>
      <RunBar
        label="Tạo PDF"
        disabled={items.length === 0}
        state={job.state}
        onStop={job.reset}
        onRun={() =>
          job.start({
            kind: 'images',
            files: items.map((i) => i.file),
            rotations: items.map((i) => i.rotation),
            settings,
          })
        }
      />
    </div>
  );
}
