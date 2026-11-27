import { MAX_STUDENTS, parseStudentList } from '@/core/studentList';
import { TextAreaField } from './fields';

/** Danh sách tên học sinh, chỉ lưu trên máy. Dùng `parseStudentList` để đọc. */
export function StudentListInput({
  value,
  onChange,
  max = MAX_STUDENTS,
}: {
  value: string;
  onChange: (value: string) => void;
  max?: number;
}) {
  const count = parseStudentList(value).length;
  const hint =
    count > max
      ? `Có ${count} tên, chỉ dùng ${max} tên đầu.`
      : `${count}/${max} em · chỉ lưu trên máy này.`;
  return (
    <TextAreaField
      label="Danh sách học sinh (mỗi dòng một tên)"
      value={value}
      onChange={onChange}
      placeholder={'Nguyễn Minh An\nTrần Bảo Ngọc'}
      hint={hint}
    />
  );
}
