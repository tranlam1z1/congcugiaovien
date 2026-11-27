import { CheckboxField, NumberField, SelectField, TextAreaField } from '@/components/fields';
import {
  MAX_DRAW_ITEMS,
  MAX_DRAW_NUMBER,
  MAX_ITEM_LENGTH,
  MAX_MINUTES,
  type Options,
} from './options';

type Props = { options: Options; onChange: (changes: Partial<Options>) => void };

export function TimeFields({ options, onChange }: Props) {
  return (
    <>
      <NumberField
        label="Số phút"
        value={options.minutes}
        min={0}
        max={MAX_MINUTES}
        onChange={(minutes) => onChange({ minutes })}
      />
      <NumberField
        label="Thêm số giây"
        hint="Đổi thời gian lúc đang đếm thì bấm “Đặt lại” để áp dụng."
        value={options.seconds}
        min={0}
        max={59}
        onChange={(seconds) => onChange({ seconds })}
      />
      <CheckboxField
        label="Chuông khi hết giờ"
        checked={options.sound}
        onChange={(sound) => onChange({ sound })}
      />
    </>
  );
}

export function SensitivityField({ options, onChange }: Props) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-medium">Độ nhạy: {options.sensitivity}</span>
      <input
        type="range"
        min={1}
        max={100}
        className="min-h-11 w-full accent-accent"
        value={options.sensitivity}
        onChange={(event) => onChange({ sensitivity: Number(event.target.value) })}
      />
      <span className="text-muted">
        Kéo sang phải nếu lớp ồn mà đèn vẫn xanh, sang trái nếu đèn đỏ quá sớm.
      </span>
    </label>
  );
}

export function DrawFields({ options, onChange }: Props) {
  return (
    <>
      <SelectField
        label="Bốc từ"
        value={options.source}
        options={[
          { value: 'so', label: 'Dãy số từ 1' },
          { value: 'danh-sach', label: 'Danh sách tự nhập' },
        ]}
        onChange={(source) => onChange({ source })}
      />
      {options.source === 'so' ? (
        <NumberField
          label="Số lớn nhất"
          hint="Ví dụ số câu hỏi hoặc số nhóm thuyết trình."
          value={options.maxNumber}
          min={2}
          max={MAX_DRAW_NUMBER}
          onChange={(maxNumber) => onChange({ maxNumber })}
        />
      ) : (
        <TextAreaField
          label="Mỗi dòng một mục"
          rows={8}
          value={options.items}
          hint={`Tối đa ${MAX_DRAW_ITEMS} mục, mỗi mục ${MAX_ITEM_LENGTH} ký tự.`}
          onChange={(items) => onChange({ items })}
        />
      )}
      <CheckboxField
        label="Mỗi mục chỉ bốc một lần"
        checked={options.once}
        onChange={(once) => onChange({ once })}
      />
    </>
  );
}
