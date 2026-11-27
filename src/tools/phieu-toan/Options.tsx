import { useState } from 'react';
import { CheckboxField, NumberField, SelectField } from '@/components/fields';
import {
  availableCount,
  MAX_COUNT,
  matchesPreset,
  OP_NAME,
  OP_SIGN,
  OPS,
  PRESETS,
  RANGES,
  usesRange,
  type Form,
  type MathConfig,
  type Op,
  type Table,
} from './generator';

type Props = {
  config: MathConfig;
  onChange: (patch: Partial<MathConfig>) => void;
};

const FORM_OPTIONS: { value: Form; label: string }[] = [
  { value: 'ngang', label: 'Tính ngang' },
  { value: 'doc', label: 'Đặt tính dọc' },
  { value: 'o-trong', label: 'Điền số vào ô trống' },
  { value: 'so-sanh', label: 'So sánh >, <, =' },
];

const TABLE_OPTIONS: { value: Table; label: string }[] = [
  { value: 'none', label: 'Theo phạm vi' },
  { value: '2-5', label: 'Bảng 2–5' },
  { value: '6-9', label: 'Bảng 6–9' },
  { value: '2-9', label: 'Bảng 2–9' },
];

export function PresetButtons({ config, onChange }: Props) {
  return (
    <>
      {([1, 2, 3] as const).map((grade) => (
        <div key={grade} role="group" aria-label={`Lớp ${grade}`} className="flex flex-col gap-2">
          <p className="font-medium">Lớp {grade}</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.filter((p) => p.grade === grade).map((preset) => (
              <button
                key={preset.id}
                type="button"
                // Nút đang chọn chỉ viền đậm: trang công cụ chỉ "In ngay" được tô màu.
                className="btn aria-pressed:border-2 aria-pressed:border-accent aria-pressed:font-semibold aria-pressed:text-accent"
                aria-pressed={matchesPreset(config, preset)}
                onClick={() => onChange(preset.config)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}

export function ContentFields({ config, onChange }: Props) {
  const [needOne, setNeedOne] = useState(false);
  const numbersOnly = config.form === 'so-sanh' && !config.compareExpressions;
  const hasTableOps = !numbersOnly && config.ops.some((op) => op === 'mul' || op === 'div');

  const toggle = (op: Op, checked: boolean) => {
    const ops = OPS.filter((o) => (o === op ? checked : config.ops.includes(o)));
    // Bắt buộc còn ít nhất một phép tính.
    setNeedOne(ops.length === 0);
    if (ops.length) onChange({ ops });
  };

  return (
    <>
      <fieldset>
        <legend className="font-medium">Phép tính</legend>
        <div className="grid grid-cols-2 gap-x-3">
          {OPS.map((op) => (
            <CheckboxField
              key={op}
              label={`${OP_SIGN[op]} ${OP_NAME[op]}`}
              checked={config.ops.includes(op)}
              onChange={(checked) => toggle(op, checked)}
            />
          ))}
        </div>
        <p role="status" className="text-accent">
          {needOne ? 'Cần giữ ít nhất một phép tính.' : ''}
        </p>
        {numbersOnly && (
          <p className="text-muted">Đang so sánh hai số nên phép tính chưa dùng tới.</p>
        )}
      </fieldset>

      <SelectField
        label="Dạng bài"
        value={config.form}
        options={FORM_OPTIONS}
        onChange={(form) => onChange({ form })}
      />
      {config.form === 'so-sanh' && (
        <CheckboxField
          label="So sánh kết quả phép tính"
          checked={config.compareExpressions}
          onChange={(compareExpressions) => onChange({ compareExpressions })}
        />
      )}
      {usesRange(config) && (
        <SelectField
          label="Phạm vi"
          value={String(config.range)}
          options={RANGES.map((range) => ({ value: String(range), label: `Trong ${range}` }))}
          onChange={(value) => onChange({ range: Number(value) as MathConfig['range'] })}
        />
      )}
      {hasTableOps && (
        <SelectField
          label="Nhân, chia"
          value={config.table}
          options={TABLE_OPTIONS}
          onChange={(table) => onChange({ table })}
        />
      )}
    </>
  );
}

export function LayoutFields({
  config,
  onChange,
  columns,
  columnLimit,
  onColumnsChange,
}: Props & {
  columns: number;
  columnLimit: number;
  onColumnsChange: (columns: number) => void;
}) {
  const available = availableCount(config);
  return (
    <>
      <NumberField
        label="Số câu"
        value={config.count}
        min={1}
        max={MAX_COUNT}
        hint={
          available < config.count
            ? `Lựa chọn này chỉ có ${available} câu không trùng nên phiếu có ${available} câu.`
            : undefined
        }
        onChange={(count) => onChange({ count })}
      />
      <NumberField
        label="Số cột"
        value={columns}
        min={1}
        max={columnLimit}
        hint={`Tối đa ${columnLimit} cột với dạng bài, cỡ chữ và font đang chọn.`}
        onChange={onColumnsChange}
      />
    </>
  );
}
