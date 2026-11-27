import { FontFields } from '@/components/CommonOptionFields';
import { COMMON_DEFAULTS } from '@/components/commonOptions';
import {
  CheckboxField,
  NumberField,
  SelectField,
  TextAreaField,
  TextField,
} from '@/components/fields';
import { MAX_HEADING_LENGTH } from '@/core/print/SheetHeader';
import type { Options } from './options';

type Props = {
  options: Options;
  onChange: (patch: Partial<Options>) => void;
};

export function SplitFields({
  options,
  onChange,
  students,
  groups,
}: Props & { students: number; groups: number }) {
  const bySize = options.by === 'size';
  const smallest = groups ? Math.floor(students / groups) : 0;
  const largest = groups ? Math.ceil(students / groups) : 0;
  return (
    <>
      <SelectField
        label="Chia theo"
        value={bySize ? 'size' : 'groups'}
        options={[
          { value: 'groups', label: 'Số nhóm' },
          { value: 'size', label: 'Số em mỗi nhóm' },
        ]}
        onChange={(by) => onChange({ by })}
      />
      <NumberField
        key={options.by}
        label={bySize ? 'Số em mỗi nhóm (tối đa)' : 'Số nhóm'}
        value={bySize ? options.groupSize : options.groupTotal}
        min={1}
        max={bySize ? 40 : 30}
        onChange={(n) => onChange(bySize ? { groupSize: n } : { groupTotal: n })}
      />
      {groups > 0 && (
        <p role="status">
          {groups} nhóm, mỗi nhóm {smallest === largest ? smallest : `${smallest}–${largest}`} em.
        </p>
      )}
    </>
  );
}

export function RuleFields({
  options,
  onChange,
  hasGender,
  unknown,
}: Props & { hasGender: boolean; unknown: string[] }) {
  return (
    <>
      <CheckboxField
        label="Cân bằng nam nữ"
        checked={options.balance}
        onChange={(balance) => onChange({ balance })}
      />
      {options.balance && !hasGender && (
        <p role="status" className="text-accent">
          Danh sách chưa có giới tính. Thêm “, Nam” hoặc “, Nữ” sau mỗi tên.
        </p>
      )}
      <CheckboxField
        label="Chọn nhóm trưởng ngẫu nhiên"
        checked={options.pickLeader}
        onChange={(pickLeader) => onChange({ pickLeader })}
      />
      <TextAreaField
        label="Cặp không ngồi cùng nhóm"
        rows={4}
        value={options.avoid}
        placeholder="Nguyễn Minh An - Trần Bảo Ngọc"
        hint="Mỗi dòng hai tên, cách nhau dấu gạch ngang hoặc dấu phẩy."
        onChange={(avoid) => onChange({ avoid })}
      />
      {unknown.length > 0 && (
        <p role="status" className="text-accent">
          Không khớp với danh sách lớp: {unknown.join('; ')}
        </p>
      )}
    </>
  );
}

export function NameFields({ options, onChange }: Props) {
  return (
    <TextAreaField
      label="Tên các nhóm (mỗi dòng một tên)"
      value={options.names}
      placeholder={'Sơn Ca\nHọa Mi'}
      hint="Bỏ trống thì đặt Nhóm 1, Nhóm 2..."
      onChange={(names) => onChange({ names })}
    />
  );
}

export function LayoutFields({
  options,
  onChange,
  defaultTitle,
}: Props & { defaultTitle: string }) {
  return (
    <>
      <TextField
        label="Tiêu đề"
        value={options.title}
        placeholder={defaultTitle}
        maxLength={MAX_HEADING_LENGTH}
        onChange={(title) => onChange({ title })}
      />
      <TextField
        label="Trường, lớp"
        value={options.school}
        maxLength={MAX_HEADING_LENGTH}
        onChange={(school) => onChange({ school })}
      />
      <SelectField
        label="Hướng giấy"
        value={options.orientation}
        options={[
          { value: 'portrait', label: 'A4 dọc' },
          { value: 'landscape', label: 'A4 ngang' },
        ]}
        onChange={(orientation) => onChange({ orientation })}
      />
      <FontFields
        value={{ ...COMMON_DEFAULTS, font: options.font, largeText: options.largeText }}
        onChange={onChange}
      />
    </>
  );
}
