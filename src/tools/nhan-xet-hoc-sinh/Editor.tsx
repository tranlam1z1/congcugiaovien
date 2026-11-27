/** Bảng sửa nhận xét từng em và các nút làm việc với cả lớp. */
import { Copy, FileSpreadsheet, FileText, RefreshCw, Trash2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import type { Quality, Study } from './bank';
import { downloadCsv, downloadExcel, toClipboardText } from './export';
import { MAX_COMMENT, QUALITIES, STUDIES, type Line, type StudentRecord } from './state';

type Props = {
  lines: Line[];
  fileName: string;
  onChange: (key: string, record: (previous: StudentRecord) => StudentRecord) => void;
  onRewrite: (keys: Line[]) => void;
  onClear: () => void;
  hasRecords: boolean;
};

const DISCARD = 'Lời nhận xét đã sửa tay sẽ bị thay. Tiếp tục?';

function LevelSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="font-medium">
        {label}
      </label>
      <select
        id={id}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Editor({ lines, fileName, onChange, onRewrite, onClear, hasRecords }: Props) {
  const [status, setStatus] = useState('');
  const fallback = useRef<HTMLTextAreaElement>(null);
  const text = toClipboardText(lines);
  const [manual, setManual] = useState(false);
  // Sửa nội dung thì thông báo "đã chép" không còn đúng.
  useEffect(() => {
    setStatus('');
    setManual(false);
  }, [text]);
  useEffect(() => {
    if (manual) fallback.current?.select();
  }, [manual]);

  const setLevel = (line: Line, patch: { study?: Study; quality?: Quality }) => {
    if (line.edited && !window.confirm(DISCARD)) return;
    onChange(line.key, ({ text: _, ...record }) => ({ ...record, ...patch }));
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setStatus(`Đã chép ${lines.length} dòng. Dán vào Excel hoặc Google Sheets.`);
    } catch {
      setManual(true);
      setStatus('Trình duyệt không cho chép tự động. Nhấn Ctrl+C để chép phần đang bôi đen.');
    }
  };

  const excel = async () => {
    setStatus('Đang tạo file Excel…');
    try {
      await downloadExcel(lines, fileName);
      setStatus('');
    } catch (cause) {
      console.error(cause);
      setStatus('Chưa tạo được file Excel. Bạn thử lại, hoặc dùng “Tải CSV”.');
    }
  };

  const empty = lines.length === 0;

  return (
    <section aria-label="Nhận xét từng em" className="flex flex-col gap-3">
      <p className="rounded-xl border-2 border-accent bg-surface p-3">
        Đây là <strong>bản nháp, cần rà soát</strong>. Tên và lời nhận xét chỉ lưu trên máy này.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn"
          disabled={empty}
          onClick={() =>
            (!lines.some((l) => l.edited) || window.confirm(DISCARD)) && onRewrite(lines)
          }
        >
          <RefreshCw aria-hidden className="size-5" />
          Viết lại tất cả
        </button>
        <button type="button" className="btn" disabled={empty} onClick={copy}>
          <Copy aria-hidden className="size-5" />
          Chép tất cả
        </button>
        <button
          type="button"
          className="btn"
          disabled={empty}
          onClick={() => downloadCsv(lines, fileName)}
        >
          <FileText aria-hidden className="size-5" />
          Tải CSV
        </button>
        <button type="button" className="btn" disabled={empty} onClick={excel}>
          <FileSpreadsheet aria-hidden className="size-5" />
          Tải Excel
        </button>
        <button
          type="button"
          className="btn"
          disabled={!hasRecords}
          onClick={() =>
            window.confirm('Xoá mọi mức đã chọn và lời nhận xét đã sửa trên máy này?') && onClear()
          }
        >
          <Trash2 aria-hidden className="size-5" />
          Xoá hết
        </button>
      </div>
      <p role="status">{status}</p>
      {manual && (
        <textarea
          ref={fallback}
          readOnly
          aria-label="Nội dung để chép"
          className="input"
          rows={5}
          value={text}
        />
      )}

      {!empty && (
        <ol className="flex max-h-[70dvh] flex-col gap-3 overflow-y-auto pr-1">
          {lines.map((line, index) => (
            <li key={line.key} className="card flex flex-col gap-2 p-3">
              <div className="flex flex-wrap items-end gap-3">
                <h3 className="mr-auto self-center font-semibold">
                  {index + 1}. {line.name}
                  {line.edited && <span className="text-muted"> · đã sửa tay</span>}
                </h3>
                <LevelSelect
                  label="Học tập"
                  value={line.study}
                  options={STUDIES}
                  onChange={(study) => setLevel(line, { study })}
                />
                <LevelSelect
                  label="Phẩm chất"
                  value={line.quality}
                  options={QUALITIES}
                  onChange={(quality) => setLevel(line, { quality })}
                />
                <button
                  type="button"
                  className="btn"
                  aria-label={`Viết lại cho ${line.name}`}
                  onClick={() =>
                    (!line.edited || window.confirm(DISCARD)) && onRewrite([line])
                  }
                >
                  <RefreshCw aria-hidden className="size-5" />
                  Viết lại
                </button>
              </div>
              <textarea
                aria-label={`Nhận xét cho ${line.name}`}
                className="input"
                rows={3}
                maxLength={MAX_COMMENT}
                value={line.comment}
                onChange={(e) => {
                  const next = e.target.value;
                  onChange(line.key, (record) => ({ ...record, text: next }));
                }}
              />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
