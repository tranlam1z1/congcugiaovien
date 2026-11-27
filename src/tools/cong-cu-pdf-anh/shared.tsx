/** Phần dùng chung của bốn việc: chọn file, danh sách sắp xếp được, tiến độ. */
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, FileUp, Trash2 } from 'lucide-react';
import { useRef, useState, type DragEvent, type ReactNode } from 'react';
import { formatSize } from './ranges';
import type { JobState } from './useJob';

/** Quá mức này máy yếu có thể hết bộ nhớ nên hỏi trước. */
export const SOFT_LIMIT = 200 * 1024 * 1024;

export const isPdf = (file: File) =>
  file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
export const isImage = (file: File) =>
  file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name);

export const confirmSize = (total: number) =>
  total <= SOFT_LIMIT ||
  window.confirm(
    `Tổng ${formatSize(total)}, vượt mức nên dùng ${formatSize(SOFT_LIMIT)}. Máy có thể chậm hoặc hết bộ nhớ. Tiếp tục?`,
  );

export function move<T>(items: readonly T[], from: number, to: number) {
  const next = [...items];
  if (from < 0 || from >= next.length || to < 0 || to >= next.length) return next;
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
}

/** Nút chọn file, đồng thời nhận file kéo thả vào. */
export function FilePicker({
  label,
  accept,
  multiple = true,
  filter,
  onFiles,
}: {
  label: string;
  accept: string;
  multiple?: boolean;
  filter: (file: File) => boolean;
  onFiles: (files: File[]) => void;
}) {
  const [over, setOver] = useState(false);
  const [skipped, setSkipped] = useState<string[]>([]);

  const take = (list: FileList | null) => {
    const files = [...(list ?? [])];
    const good = files.filter(filter);
    setSkipped(files.filter((f) => !filter(f)).map((f) => f.name));
    if (good.length) onFiles(multiple ? good : good.slice(0, 1));
  };
  // Kéo mục trong danh sách để đổi chỗ thì không phải kéo file vào.
  const hasFiles = (event: DragEvent) => event.dataTransfer.types.includes('Files');

  return (
    <div
      data-drop
      className={`flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-4 text-center ${
        over ? 'border-accent bg-soft' : 'border-line bg-surface'
      }`}
      onDragOver={(event) => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        if (!hasFiles(event)) return;
        event.preventDefault();
        setOver(false);
        take(event.dataTransfer.files);
      }}
    >
      <label className="btn cursor-pointer focus-within:outline-3 focus-within:outline-accent">
        <FileUp aria-hidden className="size-5" />
        {label}
        <input
          type="file"
          className="sr-only"
          accept={accept}
          multiple={multiple}
          onChange={(event) => {
            take(event.target.files);
            // Cho phép chọn lại cùng file.
            event.target.value = '';
          }}
        />
      </label>
      <p className="text-muted">hoặc kéo file thả vào đây. File không rời khỏi máy của bạn.</p>
      {skipped.length > 0 && (
        <p role="alert">Bỏ qua file không đúng loại: {skipped.join(', ')}</p>
      )}
    </div>
  );
}

/** Danh sách đổi thứ tự được bằng cách kéo thả hoặc bằng nút (dùng được bàn phím). */
export function SortableList<T extends { id: number }>({
  label,
  items,
  nameOf,
  onChange,
  className,
  children,
  actions,
  grid = false,
}: {
  label: string;
  items: T[];
  nameOf: (item: T, index: number) => string;
  onChange: (items: T[]) => void;
  className: string;
  children: (item: T, index: number) => ReactNode;
  /** Nút riêng của từng mục, ví dụ xoay. */
  actions?: (item: T, index: number) => ReactNode;
  /** Xếp dạng lưới thì mũi tên chỉ trái, phải. */
  grid?: boolean;
}) {
  const dragged = useRef<number | null>(null);
  const Back = grid ? ArrowLeft : ArrowUp;
  const Forward = grid ? ArrowRight : ArrowDown;
  return (
    <ol aria-label={label} className={className}>
      {items.map((item, index) => {
        const name = nameOf(item, index);
        return (
          <li
            key={item.id}
            data-item
            draggable
            className="card flex cursor-grab flex-col items-center gap-2 p-2"
            onDragStart={(event) => {
              dragged.current = index;
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/plain', name);
            }}
            onDragOver={(event) => dragged.current !== null && event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              if (dragged.current !== null) onChange(move(items, dragged.current, index));
              dragged.current = null;
            }}
            onDragEnd={() => (dragged.current = null)}
          >
            {children(item, index)}
            <div className="flex flex-wrap justify-center gap-1">
              <button
                type="button"
                className="btn btn-icon"
                aria-label={`Đưa ${name} lên trước`}
                title="Đưa lên trước"
                disabled={index === 0}
                onClick={() => onChange(move(items, index, index - 1))}
              >
                <Back aria-hidden className="size-5" />
              </button>
              <button
                type="button"
                className="btn btn-icon"
                aria-label={`Đưa ${name} ra sau`}
                title="Đưa ra sau"
                disabled={index === items.length - 1}
                onClick={() => onChange(move(items, index, index + 1))}
              >
                <Forward aria-hidden className="size-5" />
              </button>
              {actions?.(item, index)}
              <button
                type="button"
                className="btn btn-icon"
                aria-label={`Bỏ ${name}`}
                title="Bỏ"
                onClick={() => onChange(items.filter((other) => other.id !== item.id))}
              >
                <Trash2 aria-hidden className="size-5" />
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Nút chạy việc, thanh tiến độ và kết quả. */
export function RunBar({
  label,
  disabled,
  state,
  onRun,
  onStop,
}: {
  label: string;
  disabled: boolean;
  state: JobState;
  onRun: () => void;
  onStop: () => void;
}) {
  const working = state.status === 'working';
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="btn btn-primary"
          disabled={disabled || working}
          onClick={onRun}
        >
          {working ? 'Đang xử lý…' : label}
        </button>
        {working && (
          <>
            <progress
              aria-label="Tiến độ"
              className="h-3 w-48 accent-accent"
              {...(state.total ? { value: state.done, max: state.total } : {})}
            />
            {state.total > 0 && (
              <span className="tabular-nums">
                {state.done}/{state.total}
              </span>
            )}
            <button type="button" className="btn" onClick={onStop}>
              Dừng
            </button>
          </>
        )}
      </div>
      <p role="status">
        {state.status === 'done' && `Đã tải ${state.fileName} (${formatSize(state.size)}).`}
      </p>
      {state.status === 'error' && (
        <p role="alert" className="rounded-lg border-2 border-accent bg-surface p-3">
          {state.message}
        </p>
      )}
    </div>
  );
}
