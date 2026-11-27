import { CheckboxField, NumberField, SelectField, TextAreaField } from '@/components/fields';
import { COLORS } from '@/core/handwriting/style';
import {
  CELLS,
  MAX_ROWS_PER_SAMPLE,
  PAPERS,
  SAMPLES,
  SIZES,
  STYLES,
  type Options,
  type Settings,
} from './options';

type Props = {
  options: Options;
  settings: Settings;
  onChange: (patch: Partial<Options>) => void;
};

const decimal = (value: number) => String(value).replace('.', ',');

export function ContentFields({
  options,
  onChange,
  missing,
}: Omit<Props, 'settings'> & { missing: string[] }) {
  return (
    <>
      <div role="group" aria-label="Mẫu có sẵn" className="flex flex-wrap gap-2">
        {SAMPLES.map((sample) => (
          <button
            key={sample.label}
            type="button"
            className="toggle px-3"
            aria-pressed={options.text === sample.text}
            onClick={() => onChange({ text: sample.text })}
          >
            {sample.label}
          </button>
        ))}
      </div>
      <TextAreaField
        label="Nội dung (mỗi dòng một mẫu)"
        value={options.text}
        rows={8}
        hint="Bấm một mẫu có sẵn sẽ thay nội dung đang nhập. Câu dài tự xuống dòng."
        onChange={(text) => onChange({ text })}
      />
      {missing.length > 0 && (
        <p role="alert" className="font-medium">
          Font tập viết không có ký tự: {missing.join(' ')}. Các ký tự này sẽ bị bỏ trống.
        </p>
      )}
    </>
  );
}

export function SizeFields({ settings, onChange }: Props) {
  return (
    <>
      <SelectField
        label="Chiều cao chữ thường"
        value={String(settings.size)}
        options={SIZES.map((s) => ({ value: String(s), label: `${decimal(s)} ô` }))}
        onChange={(size) => onChange({ size: Number(size) })}
      />
      <SelectField
        label="Cạnh một ô"
        value={String(settings.cell)}
        options={CELLS.map((c) => ({ value: String(c), label: `${c} mm` }))}
        onChange={(cell) => onChange({ cell: Number(cell) })}
      />
      <SelectField
        label="Loại giấy"
        value={settings.paper}
        options={PAPERS}
        onChange={(paper) => onChange({ paper })}
      />
      <CheckboxField
        label="Đường chân và đường cao chữ"
        checked={settings.guides}
        onChange={(guides) => onChange({ guides })}
      />
    </>
  );
}

export function StyleFields({ options, settings, onChange }: Props) {
  return (
    <>
      <SelectField
        label="Kiểu chữ để tô"
        value={settings.style}
        options={STYLES}
        onChange={(style) => onChange({ style })}
      />
      <NumberField
        label="Độ mờ (%)"
        value={settings.fade}
        min={0}
        max={90}
        hint="Số càng lớn, chữ để tô càng nhạt."
        onChange={(fade) => onChange({ fade })}
      />
      <SelectField
        label="Màu chữ"
        value={options.color}
        options={COLORS}
        onChange={(color) => onChange({ color })}
      />
      <CheckboxField
        label="Chữ mẫu đầu dòng in đậm"
        checked={settings.boldFirst}
        onChange={(boldFirst) => onChange({ boldFirst })}
      />
      <CheckboxField
        label="Lặp chữ cho đầy dòng"
        checked={settings.repeat}
        onChange={(repeat) => onChange({ repeat })}
      />
    </>
  );
}

export function RowFields({ settings, onChange }: Props) {
  return (
    <>
      <NumberField
        label="Số dòng cho mỗi mẫu"
        value={settings.rows}
        min={1}
        max={MAX_ROWS_PER_SAMPLE}
        onChange={(rows) => onChange({ rows })}
      />
      <NumberField
        label="Dòng trống sau mỗi mẫu"
        value={settings.blanks}
        min={0}
        max={MAX_ROWS_PER_SAMPLE}
        onChange={(blanks) => onChange({ blanks })}
      />
    </>
  );
}
