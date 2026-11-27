import { CheckboxField, NumberField, SelectField, TextField } from '@/components/fields';
import { ImageField } from '@/components/ImageField';
import { MAX_HEADING_LENGTH } from '@/core/print/SheetHeader';
import {
  COLORS,
  MAX_CUSTOM_MM,
  MAX_PAGES,
  MIN_CUSTOM_MM,
  PAGE_SIZES,
  POSITIONS,
  type Options,
  type Resolved,
} from './options';
import { PAPERS } from './papers';

type Props = {
  options: Options;
  settings: Resolved;
  onChange: (patch: Partial<Options>) => void;
};

const millimetres = (value: number) => `${String(value).replace('.', ',')} mm`;

export function TypeFields({ settings, onChange }: Props) {
  const { type, size, major, columns } = settings;
  return (
    <>
      <SelectField
        label="Loại giấy"
        value={type.id}
        options={PAPERS.map((p) => ({ value: p.id, label: p.label }))}
        onChange={(id) => onChange({ type: id, major: -1 })}
      />
      {type.sizes.length > 0 && (
        <SelectField
          label={type.sizeLabel}
          value={String(size)}
          options={type.sizes.map((s) => ({ value: String(s), label: millimetres(s) }))}
          onChange={(value) => onChange({ size: Number(value) })}
        />
      )}
      {type.major !== undefined && (
        <SelectField
          label="Kẻ đậm"
          value={String(major)}
          options={[0, 2, 4, 5, 10].map((n) => ({
            value: String(n),
            label: n ? `Mỗi ${n} dòng` : 'Không kẻ đậm',
          }))}
          onChange={(value) => onChange({ major: Number(value) })}
        />
      )}
      {type.columns && (
        <SelectField
          label="Số cột"
          value={String(columns)}
          options={[2, 3, 4].map((n) => ({ value: String(n), label: `${n} cột` }))}
          onChange={(value) => onChange({ columns: Number(value) })}
        />
      )}
    </>
  );
}

export function PageFields({ options, settings, onChange }: Props) {
  return (
    <>
      <SelectField
        label="Khổ giấy"
        value={options.page}
        options={[
          ...PAGE_SIZES.map((p) => ({
            value: p.id,
            label: `${p.label} (${millimetres(p.width).replace(' mm', '')} × ${millimetres(p.height)})`,
          })),
          { value: 'custom', label: 'Tùy chỉnh' },
        ]}
        onChange={(page) => onChange({ page })}
      />
      {options.page === 'custom' ? (
        <>
          <NumberField
            label="Rộng (mm)"
            value={options.customWidth}
            min={MIN_CUSTOM_MM}
            max={MAX_CUSTOM_MM}
            onChange={(customWidth) => onChange({ customWidth })}
          />
          <NumberField
            label="Cao (mm)"
            value={options.customHeight}
            min={MIN_CUSTOM_MM}
            max={MAX_CUSTOM_MM}
            onChange={(customHeight) => onChange({ customHeight })}
          />
        </>
      ) : (
        <SelectField
          label="Hướng giấy"
          value={settings.orientation}
          options={[
            { value: 'portrait', label: 'Dọc' },
            { value: 'landscape', label: 'Ngang' },
          ]}
          onChange={(orientation) => onChange({ orientation })}
        />
      )}
      <NumberField
        label="Lề giấy (mm)"
        value={settings.margin}
        min={0}
        max={30}
        hint="Nhiều máy in không in được sát mép; nên để từ 5 mm."
        onChange={(margin) => onChange({ margin })}
      />
      <NumberField
        label="Số trang"
        value={settings.pages}
        min={1}
        max={MAX_PAGES}
        onChange={(pages) => onChange({ pages })}
      />
    </>
  );
}

export function LineFields({ options, onChange }: Props) {
  return (
    <>
      <SelectField
        label="Màu nét"
        value={options.color}
        options={COLORS.map((c) => ({ value: c.id, label: c.label }))}
        onChange={(color) => onChange({ color })}
      />
      <NumberField
        label="Độ đậm nét (%)"
        value={options.opacity}
        min={10}
        max={100}
        onChange={(opacity) => onChange({ opacity })}
      />
      <CheckboxField
        label="Lề đỏ bên trái"
        checked={options.redMargin}
        onChange={(redMargin) => onChange({ redMargin })}
      />
    </>
  );
}

export function HeaderFields({ options, onChange }: Props) {
  return (
    <>
      <TextField
        label="Tiêu đề"
        value={options.title}
        hint="Bỏ trống thì không in tiêu đề."
        maxLength={MAX_HEADING_LENGTH}
        onChange={(title) => onChange({ title })}
      />
      <TextField
        label="Trường, lớp"
        value={options.school}
        maxLength={MAX_HEADING_LENGTH}
        onChange={(school) => onChange({ school })}
      />
      <CheckboxField
        label='Dòng "Họ và tên / Lớp"'
        checked={options.showNameLine}
        onChange={(showNameLine) => onChange({ showNameLine })}
      />
    </>
  );
}

export function DecorationFields({ options, onChange }: Props) {
  return (
    <>
      <TextField
        label="Chữ chìm"
        value={options.watermark}
        hint="In mờ, chéo giữa trang."
        onChange={(watermark) => onChange({ watermark })}
      />
      <ImageField label="Chọn logo" value={options.logo} onChange={(logo) => onChange({ logo })} />
      {options.logo && (
        <>
          <NumberField
            label="Bề rộng logo (mm)"
            value={options.logoSize}
            min={5}
            max={200}
            onChange={(logoSize) => onChange({ logoSize })}
          />
          <NumberField
            label="Độ đậm logo (%)"
            value={options.logoOpacity}
            min={5}
            max={100}
            onChange={(logoOpacity) => onChange({ logoOpacity })}
          />
          <NumberField
            label="Xoay logo (độ)"
            value={options.logoRotate}
            min={-180}
            max={180}
            onChange={(logoRotate) => onChange({ logoRotate })}
          />
          <SelectField
            label="Vị trí logo"
            value={options.logoPosition}
            options={POSITIONS}
            onChange={(logoPosition) => onChange({ logoPosition })}
          />
        </>
      )}
    </>
  );
}
