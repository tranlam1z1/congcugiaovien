/** Xoay, bỏ và đổi thứ tự trang, thêm được trang từ nhiều file. */
import { Eraser, RotateCw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { baseName } from './ranges';
import { confirmSize, FilePicker, isPdf, RunBar, SortableList } from './shared';
import { openPdf } from './thumbnails';
import { useJob } from './useJob';

type Item = { id: number; file: File; page: number; rotation: number };

/** Quá số này thì trình duyệt chậm hẳn khi sắp xếp. */
const MAX_PAGES = 500;

export function PagesPanel() {
  const [items, setItems] = useState<Item[]>([]);
  const [images, setImages] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [reading, setReading] = useState(0);
  const nextId = useRef(0);
  const count = useRef(0);
  count.current = items.length;
  /** Đổi khi xoá hết hoặc rời công cụ, để việc vẽ hình đang chạy dừng lại. */
  const generation = useRef(0);
  const job = useJob();
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );

  const change = (next: Item[]) => {
    setItems(next);
    job.reset();
  };

  const read = async (file: File, current: number) => {
    const pdf = await openPdf(file);
    try {
      if (generation.current !== current) return;
      const space = Math.max(0, MAX_PAGES - count.current);
      if (pdf.pages > space) {
        setErrors((list) => [
          ...list,
          `“${file.name}”: chỉ lấy ${space} trang đầu để không quá ${MAX_PAGES} trang.`,
        ]);
      }
      const added = Array.from({ length: Math.min(pdf.pages, space) }, (_, page) => ({
        id: nextId.current++,
        file,
        page,
        rotation: 0,
      }));
      count.current += added.length;
      setItems((list) => [...list, ...added]);
      job.reset();
      for (const item of added) {
        if (generation.current !== current) return;
        // Trang vẽ hỏng vẫn giữ, chỉ thiếu hình xem trước.
        const image = await pdf.thumbnail(item.page).catch(() => '');
        setImages((map) => ({ ...map, [item.id]: image }));
      }
    } finally {
      pdf.close();
    }
  };

  const add = async (files: File[]) => {
    const used = new Set(items.map((i) => i.file));
    const total = [...used, ...files].reduce((sum, f) => sum + f.size, 0);
    if (!confirmSize(total)) return;
    const current = generation.current;
    setErrors([]);
    setReading((n) => n + 1);
    // Đọc lần lượt để thứ tự trang đúng thứ tự file đã chọn.
    for (const file of files) {
      try {
        await read(file, current);
      } catch (cause) {
        console.warn(cause);
        setErrors((list) => [...list, (cause as Error).message]);
      }
    }
    setReading((n) => n - 1);
  };

  const rotate = (ids: number[]) =>
    change(
      items.map((i) => (ids.includes(i.id) ? { ...i, rotation: (i.rotation + 90) % 360 } : i)),
    );

  const save = () => {
    const files = [...new Set(items.map((i) => i.file))];
    job.start({
      kind: 'assemble',
      files,
      pages: items.map((i) => ({
        source: files.indexOf(i.file),
        page: i.page,
        rotation: i.rotation,
      })),
      name: `${baseName(files[0]!.name)}-sua.pdf`,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <FilePicker
        label="Chọn file PDF"
        accept=".pdf,application/pdf"
        filter={isPdf}
        onFiles={(files) => void add(files)}
      />
      {errors.map((error, i) => (
        <p key={i} role="alert" className="font-medium text-accent">
          {error}
        </p>
      ))}
      {reading > 0 && items.length === 0 && <p role="status">Đang đọc file…</p>}
      {items.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <p className="mr-auto font-medium">{items.length} trang</p>
            <button type="button" className="btn" onClick={() => rotate(items.map((i) => i.id))}>
              <RotateCw aria-hidden className="size-5" />
              Xoay tất cả
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                generation.current++;
                change([]);
                setImages({});
                setErrors([]);
              }}
            >
              <Eraser aria-hidden className="size-5" />
              Xoá hết
            </button>
          </div>
          <SortableList
            label="Các trang"
            grid
            className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3"
            items={items}
            nameOf={(_, index) => `trang ${index + 1}`}
            onChange={change}
            actions={(item, index) => (
              <button
                type="button"
                className="btn btn-icon"
                aria-label={`Xoay trang ${index + 1}`}
                title="Xoay phải"
                onClick={() => rotate([item.id])}
              >
                <RotateCw aria-hidden className="size-5" />
              </button>
            )}
          >
            {(item, index) => (
              <>
                <span className="flex size-40 items-center justify-center">
                  {images[item.id] ? (
                    <img
                      alt=""
                      src={images[item.id]}
                      draggable={false}
                      data-rotation={item.rotation}
                      className="max-h-full max-w-full border border-line"
                      style={{ transform: `rotate(${item.rotation}deg)` }}
                    />
                  ) : (
                    <span className="text-muted">
                      {images[item.id] === '' ? 'Không xem trước được' : 'Đang vẽ…'}
                    </span>
                  )}
                </span>
                <b>{index + 1}</b>
                <span className="w-full truncate text-center text-muted" title={item.file.name}>
                  {item.file.name} · tr. {item.page + 1}
                </span>
              </>
            )}
          </SortableList>
        </>
      )}
      <RunBar
        label="Lưu PDF"
        disabled={items.length === 0}
        state={job.state}
        onStop={job.reset}
        onRun={save}
      />
    </div>
  );
}
