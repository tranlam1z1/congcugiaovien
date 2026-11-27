import { CheckboxField, NumberField, SelectField, TextAreaField } from '@/components/fields';
import { COLORS } from '@/core/handwriting/style';
import {
  LETTERINGS,
  MAX_ROWS_PER_SAMPLE,
  SIZES,
  STYLES,
  type Options,
  type Settings,
} from './options';
import { PACKS, SAMPLES } from './words';

type Props = {
  options: Options;
  settings: Settings;
  onChange: (patch: Partial<Options>) => void;
};

export function ContentFields({
  options,
  onChange,
  missing,
}: Omit<Props, 'settings'> & { missing: string[] }) {
  const pack = PACKS.find((p) => p.text === options.text)?.id ?? '';
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
      <SelectField
        label="Gói từ vựng theo lớp"
        value={pack}
        options={[
          { value: '', label: 'Chọn một gói từ…' },
          ...PACKS.map((p) => ({ value: p.id, label: p.label })),
        ]}
        onChange={(id) => {
          const chosen = PACKS.find((p) => p.id === id);
          if (chosen) onChange({ text: chosen.text });
        }}
      />
      <TextAreaField
        label="Nội dung (mỗi dòng một mẫu)"
        value={options.text}
        rows={8}
        hint="Chọn mẫu hoặc gói từ sẽ thay nội dung đang nhập. Câu dài tự xuống dòng."
        onChange={(text) => onChange({ text })}
      />
      <CheckboxField
        label="Kèm hình minh họa từ vựng"
        checked={options.pictures}
        onChange={(pictures) => onChange({ pictures })}
      />
      {missing.length > 0 && (
        <p role="alert" className="font-medium">
          Kiểu chữ đang chọn không có ký tự: {missing.join(' ')}. Các ký tự này sẽ bị bỏ trống.
        </p>
      )}
    </>
  );
}

export function StyleFields({ options, settings, onChange }: Props) {
  return (
    <>
      <SelectField
        label="Kiểu chữ"
        value={settings.lettering}
        options={LETTERINGS}
        onChange={(lettering) => onChange({ lettering })}
      />
      <SelectField
        label="Khoảng cách dòng kẻ"
        value={String(settings.size)}
        options={SIZES.map((s) => ({ value: String(s), label: `${s} mm` }))}
        onChange={(size) => onChange({ size: Number(size) })}
      />
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
