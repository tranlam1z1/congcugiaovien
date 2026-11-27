import { SelectField } from '@/components/fields';
import { CELL_COUNTS, PICTURES, type CellCount } from './art';
import { EVERY_PAGE, RANGES, type Config, type Operation, type Range } from './generator';

type Props = { config: Config; onChange: (changes: Partial<Config>) => void };

export function MathFields({ config, onChange }: Props) {
  return (
    <>
      <SelectField<Operation>
        label="Phép tính"
        value={config.operation}
        options={[
          { value: 'cong', label: 'Cộng' },
          { value: 'tru', label: 'Trừ' },
          { value: 'cong-tru', label: 'Cộng và trừ' },
          { value: 'nhan', label: 'Nhân' },
          { value: 'chia', label: 'Chia' },
        ]}
        onChange={(operation) => onChange({ operation })}
      />
      <SelectField
        label="Phạm vi"
        value={String(config.range)}
        options={RANGES.map((range) => ({ value: String(range), label: `Trong phạm vi ${range}` }))}
        onChange={(value) => onChange({ range: Number(value) as Range })}
      />
      {config.range < 100 && (
        <p className="text-muted">
          Phạm vi nhỏ có ít phép tính nên một số phép sẽ lặp lại giữa các ô.
        </p>
      )}
    </>
  );
}

export function PictureFields({ config, onChange }: Props) {
  return (
    <>
      <SelectField
        label="Hình"
        value={config.picture}
        options={[
          { value: EVERY_PAGE, label: 'Mỗi trang một hình khác' },
          ...PICTURES.map((p) => ({ value: p.id, label: p.name })),
        ]}
        onChange={(picture) => onChange({ picture })}
      />
      <SelectField
        label="Số phép tính mỗi trang"
        value={String(config.cells)}
        options={CELL_COUNTS.map((n) => ({ value: String(n), label: `${n} phép tính` }))}
        onChange={(value) => onChange({ cells: Number(value) as CellCount })}
      />
    </>
  );
}
