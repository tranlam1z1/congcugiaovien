import { PRINT_FONTS } from '@/core/print/fonts';
import { MAX_HEADING_LENGTH } from '@/core/print/SheetHeader';
import { MAX_STUDENTS, parseStudentList } from '@/core/studentList';
import type { CommonOptions } from './commonOptions';
import { CheckboxField, NumberField, SelectField, TextField } from './fields';
import { StudentListInput } from './StudentListInput';

type Props = {
  value: CommonOptions;
  onChange: (patch: Partial<CommonOptions>) => void;
};

/** Tiêu đề, trường lớp, dòng họ tên. */
export function HeaderFields({ value, onChange, defaultTitle }: Props & { defaultTitle: string }) {
  return (
    <>
      <TextField
        label="Tiêu đề phiếu"
        value={value.title}
        placeholder={defaultTitle}
        hint="Bỏ trống thì dùng tiêu đề mặc định."
        maxLength={MAX_HEADING_LENGTH}
        onChange={(title) => onChange({ title })}
      />
      <TextField
        label="Trường, lớp"
        value={value.school}
        maxLength={MAX_HEADING_LENGTH}
        onChange={(school) => onChange({ school })}
      />
      <CheckboxField
        label='Dòng "Họ và tên / Lớp"'
        checked={value.showNameLine}
        onChange={(showNameLine) => onChange({ showNameLine })}
      />
    </>
  );
}

/** Số phiếu khác nhau, hoặc danh sách học sinh để mỗi em một phiếu. */
export function SheetCountFields({ value, onChange }: Props) {
  const students = Math.min(parseStudentList(value.students).length, MAX_STUDENTS);
  return (
    <>
      {students === 0 ? (
        <NumberField
          label="Số phiếu khác nhau"
          value={value.copies}
          min={1}
          max={MAX_STUDENTS}
          onChange={(copies) => onChange({ copies })}
        />
      ) : (
        <p>In {students} phiếu theo danh sách học sinh.</p>
      )}
      <StudentListInput value={value.students} onChange={(text) => onChange({ students: text })} />
    </>
  );
}

/** Font chữ và cỡ chữ trên phiếu. */
export function FontFields({ value, onChange }: Props) {
  return (
    <>
      <SelectField
        label="Font chữ"
        value={value.font}
        onChange={(font) => onChange({ font })}
        options={PRINT_FONTS.map((font) => ({ value: font.id, label: font.label }))}
      />
      <CheckboxField
        label="Chữ to cho lớp 1"
        checked={value.largeText}
        onChange={(largeText) => onChange({ largeText })}
      />
    </>
  );
}
