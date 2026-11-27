import { FileText } from 'lucide-react';
import { useRef, useState } from 'react';
import { baseName, formatSize } from './ranges';
import { confirmSize, FilePicker, isPdf, RunBar, SortableList } from './shared';
import { openPdf } from './thumbnails';
import { useJob } from './useJob';

type Item = { id: number; file: File; pages: number | null; error: string };

export function MergePanel() {
  const [items, setItems] = useState<Item[]>([]);
  const nextId = useRef(0);
  const job = useJob();

  const change = (next: Item[]) => {
    setItems(next);
    job.reset();
  };

  /** Đếm trang từng file; file hỏng hoặc có mật khẩu được báo ngay trong danh sách. */
  const inspect = async (item: Item) => {
    let result: Partial<Item>;
    try {
      const pdf = await openPdf(item.file);
      result = { pages: pdf.pages };
      pdf.close();
    } catch (cause) {
      console.warn(cause);
      result = { error: (cause as Error).message };
    }
    setItems((current) => current.map((i) => (i.id === item.id ? { ...i, ...result } : i)));
  };

  const add = (files: File[]) => {
    const total = [...items.map((i) => i.file), ...files].reduce((sum, f) => sum + f.size, 0);
    if (!confirmSize(total)) return;
    const added = files.map((file) => ({ id: nextId.current++, file, pages: null, error: '' }));
    change([...items, ...added]);
    added.forEach((item) => void inspect(item));
  };

  const broken = items.some((i) => i.error);
  const pages = items.reduce((sum, i) => sum + (i.pages ?? 0), 0);

  return (
    <div className="flex flex-col gap-4">
      <FilePicker label="Chọn file PDF" accept=".pdf,application/pdf" filter={isPdf} onFiles={add} />
      {items.length > 0 && (
        <SortableList
          label="File sẽ ghép"
          className="flex flex-col gap-2"
          items={items}
          nameOf={(item) => item.file.name}
          onChange={change}
        >
          {(item, index) => (
            <p className="flex w-full flex-wrap items-center gap-2">
              <FileText aria-hidden className="size-5 shrink-0 text-accent" />
              <b>{index + 1}.</b>
              <span className="mr-auto break-all">{item.file.name}</span>
              <span className="text-muted">
                {item.error
                  ? ''
                  : item.pages === null
                    ? 'Đang đọc…'
                    : `${item.pages} trang · ${formatSize(item.file.size)}`}
              </span>
              {item.error && (
                <span role="alert" className="w-full font-medium text-accent">
                  {item.error}
                </span>
              )}
            </p>
          )}
        </SortableList>
      )}
      {items.length > 0 && !broken && (
        <p>
          {items.length < 2 ? 'Chọn thêm ít nhất một file để ghép.' : `File ghép có ${pages} trang.`}
        </p>
      )}
      {broken && <p>Bỏ file bị lỗi khỏi danh sách rồi ghép.</p>}
      <RunBar
        label="Ghép PDF"
        disabled={items.length < 2 || broken || items.some((i) => i.pages === null)}
        state={job.state}
        onStop={job.reset}
        onRun={() =>
          job.start({
            kind: 'assemble',
            files: items.map((i) => i.file),
            name: `${baseName(items[0]!.file.name)}-ghep.pdf`,
          })
        }
      />
    </div>
  );
}
