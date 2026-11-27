import { Download, Eraser, FileUp, ListPlus } from 'lucide-react';
import { useState } from 'react';
import { CheckboxField, NumberField, TextAreaField } from '@/components/fields';
import { MAX_SURPRISES, MAX_TEAMS, type Options, type Settings } from './options';
import { MAX_QUESTIONS, SAMPLE } from './questions';

const MAX_FILE_BYTES = 1024 * 1024;

type Props = {
  options: Options;
  settings: Settings;
  onChange: (patch: Partial<Options>) => void;
};

export function QuestionFields({
  options,
  onChange,
  count,
  total,
  errors,
}: Omit<Props, 'settings'> & { count: number; total: number; errors: string[] }) {
  const [status, setStatus] = useState('');
  const text = options.text;

  /** Hỏi trước khi mất câu hỏi đã soạn. */
  const replace = (next: string) => {
    const typed = text.trim() && text !== SAMPLE && text !== next;
    if (typed && !window.confirm('Bộ câu hỏi đang soạn sẽ bị thay. Tiếp tục?')) return false;
    onChange({ text: next });
    return true;
  };

  const save = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cau-hoi-on-tap.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const open = async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setStatus('File quá lớn. Hãy dùng file .txt dưới 1 MB.');
      return;
    }
    try {
      const content = (await file.text()).replace(/^﻿/, '');
      setStatus(replace(content) ? `Đã mở ${file.name}.` : '');
    } catch (cause) {
      console.error(cause);
      setStatus('Chưa đọc được file. Hãy chọn file .txt khác.');
    }
  };

  return (
    <>
      <TextAreaField
        label="Bộ câu hỏi"
        value={text}
        rows={14}
        placeholder={'Câu hỏi?\nA. …\n*B. …\n\nCâu hỏi ngắn? | Đáp án'}
        hint="Các câu cách nhau một dòng trống. Dấu * trước phương án đúng, hoặc dòng “Đáp án: B”. Câu trả lời ngắn: Câu hỏi | Đáp án."
        onChange={(next) => onChange({ text: next })}
      />
      <p role="status" className="font-medium">
        Đọc được {count} câu hỏi.
        {total > MAX_QUESTIONS && ` Chỉ dùng ${MAX_QUESTIONS} câu đầu.`}
      </p>
      {errors.length > 0 && (
        <div role="alert" className="rounded-lg border-2 border-accent p-3">
          <p className="font-medium">{errors.length} chỗ chưa đọc được:</p>
          <ul className="list-disc pl-5">
            {errors.slice(0, 5).map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn" onClick={() => replace(SAMPLE)}>
          <ListPlus aria-hidden className="size-5" />
          Dùng câu mẫu
        </button>
        <button type="button" className="btn" disabled={!text} onClick={() => replace('')}>
          <Eraser aria-hidden className="size-5" />
          Xoá hết
        </button>
        <button type="button" className="btn" disabled={!text.trim()} onClick={save}>
          <Download aria-hidden className="size-5" />
          Lưu file .txt
        </button>
        <label className="btn cursor-pointer focus-within:outline-3 focus-within:outline-accent">
          <FileUp aria-hidden className="size-5" />
          Mở file .txt
          <input
            type="file"
            accept=".txt,text/plain"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              // Cho phép chọn lại cùng file.
              event.target.value = '';
              if (file) void open(file);
            }}
          />
        </label>
      </div>
      {status && <p role="status">{status}</p>}
    </>
  );
}

export function GiftFields({ options, settings, onChange }: Props) {
  return (
    <>
      <NumberField
        label="Số đội"
        value={settings.teams}
        min={1}
        max={MAX_TEAMS}
        onChange={(teams) => onChange({ teams })}
      />
      <TextAreaField
        label="Tên đội (mỗi dòng một tên)"
        value={options.teamNames}
        rows={4}
        hint="Bỏ trống thì là Đội 1, Đội 2…"
        onChange={(teamNames) => onChange({ teamNames })}
      />
      <NumberField
        label="Điểm mỗi câu đúng"
        value={settings.points}
        min={1}
        max={1000}
        onChange={(points) => onChange({ points })}
      />
      <NumberField
        label="Số hộp bất ngờ"
        value={settings.surprises}
        min={0}
        max={MAX_SURPRISES}
        hint="Hộp không có câu hỏi, cộng hoặc trừ điểm đội mở trúng. Đổi số đội, số hộp hay câu hỏi sẽ bắt đầu ván mới."
        onChange={(surprises) => onChange({ surprises })}
      />
    </>
  );
}

export function BellFields({ settings, onChange }: Props) {
  return (
    <NumberField
      label="Số giây mỗi câu"
      value={settings.seconds}
      min={3}
      max={600}
      onChange={(seconds) => onChange({ seconds })}
    />
  );
}

export function SoundFields({ settings, onChange }: Props) {
  return (
    <CheckboxField
      label="Bật âm thanh"
      checked={settings.sound}
      onChange={(sound) => onChange({ sound })}
    />
  );
}
