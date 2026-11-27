import { useRef, useState } from 'react';
import { SelectField, TextField } from '@/components/fields';
import { everyPage, formatSize, parseRanges } from './ranges';
import { confirmSize, FilePicker, isPdf, RunBar } from './shared';
import { openPdf } from './thumbnails';
import { useJob } from './useJob';

export type SplitMode = 'khoang' | 'tung-trang';

type Chosen = { file: File; pages: number | null; error: string };

export function SplitPanel({
  mode,
  onMode,
}: {
  mode: SplitMode;
  onMode: (mode: SplitMode) => void;
}) {
  const [chosen, setChosen] = useState<Chosen | null>(null);
  const [ranges, setRanges] = useState('');
  const latest = useRef<File | null>(null);
  const job = useJob();

  const pick = async ([file]: File[]) => {
    if (!file || !confirmSize(file.size)) return;
    latest.current = file;
    setChosen({ file, pages: null, error: '' });
    setRanges('');
    job.reset();
    let next: Chosen;
    try {
      const pdf = await openPdf(file);
      next = { file, pages: pdf.pages, error: '' };
      pdf.close();
    } catch (cause) {
      console.warn(cause);
      next = { file, pages: null, error: (cause as Error).message };
    }
    // Đã chọn file khác trong lúc đọc thì bỏ kết quả cũ.
    if (latest.current === file) setChosen(next);
  };

  const total = chosen?.pages ?? 0;
  const parsed =
    mode === 'tung-trang' ? { groups: everyPage(total), error: '' } : parseRanges(ranges, total);
  const ready = total > 0 && parsed.groups.length > 0 && !parsed.error;

  return (
    <div className="flex flex-col gap-4">
      <FilePicker
        label="Chọn file cần tách"
        accept=".pdf,application/pdf"
        multiple={false}
        filter={isPdf}
        onFiles={(files) => void pick(files)}
      />
      {chosen && (
        <p>
          <b className="break-all">{chosen.file.name}</b>{' '}
          <span className="text-muted">
            {chosen.error
              ? ''
              : chosen.pages === null
                ? 'Đang đọc…'
                : `${chosen.pages} trang · ${formatSize(chosen.file.size)}`}
          </span>
        </p>
      )}
      {chosen?.error && (
        <p role="alert" className="font-medium text-accent">
          {chosen.error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField
          label="Cách tách"
          value={mode}
          options={[
            { value: 'khoang', label: 'Theo khoảng trang' },
            { value: 'tung-trang', label: 'Mỗi trang một file' },
          ]}
          onChange={(next) => {
            onMode(next);
            job.reset();
          }}
        />
        {mode === 'khoang' && (
          <TextField
            label="Khoảng trang"
            value={ranges}
            placeholder="1-3, 5, 8-"
            hint="Mỗi khoảng thành một file. “8-” là từ trang 8 đến hết."
            onChange={(next) => {
              setRanges(next);
              job.reset();
            }}
          />
        )}
      </div>
      {total > 0 && (
        <p>
          {parsed.error
            ? parsed.error
            : parsed.groups.length === 1
              ? `Sẽ tạo 1 file PDF gồm ${parsed.groups[0]!.length} trang.`
              : `Sẽ tạo ${parsed.groups.length} file PDF, tải về trong một file .zip.`}
        </p>
      )}
      <RunBar
        label="Tách PDF"
        disabled={!ready}
        state={job.state}
        onStop={job.reset}
        onRun={() => job.start({ kind: 'split', file: chosen!.file, groups: parsed.groups })}
      />
    </div>
  );
}
