import { Plus, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { delimitedToRows, rowsToText } from '@/core/classes/importRows';
import {
  activeClass,
  addClass,
  MAX_CLASSES,
  MAX_STUDENTS_PER_CLASS,
  parseStudents,
  removeActiveClass,
  updateClass,
} from '@/core/classes/model';
import type { useClassStore } from '@/core/classes/useClassStore';
import { SelectField, TextAreaField, TextField } from './fields';

const MAX_FILE_BYTES = 5 * 1024 * 1024;

async function readList(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) throw new Error('File quá lớn');
  if (/\.(csv|tsv|txt)$/i.test(file.name)) return rowsToText(delimitedToRows(await file.text()));
  const { readSheet } = await import('read-excel-file/browser');
  return rowsToText(await readSheet(file));
}

/** Chọn lớp, dán hoặc nhập danh sách học sinh. File chỉ được đọc trên máy này. */
export function ClassListPanel({ classes }: { classes: ReturnType<typeof useClassStore> }) {
  const { store, loaded, persistent, save, wipe } = classes;
  const [status, setStatus] = useState('');
  const current = activeClass(store);
  const students = parseStudents(current.text);
  const boys = students.filter((s) => s.gender === 'nam').length;
  const girls = students.filter((s) => s.gender === 'nu').length;

  if (!loaded) return <p role="status">Đang mở danh sách lớp…</p>;

  const importFile = async (file: File) => {
    setStatus('Đang đọc file…');
    try {
      const text = await readList(file);
      const found = parseStudents(text).length;
      if (!found) {
        setStatus('Không thấy tên nào trong file. Cần có cột “Họ và tên”.');
        return;
      }
      if (current.text.trim() && !window.confirm('Thay danh sách đang có bằng nội dung file?')) {
        setStatus('');
        return;
      }
      save((s) => updateClass(s, { text }));
      setStatus(`Đã nhập ${found} em từ file.`);
    } catch (cause) {
      console.error(cause);
      setStatus('Chưa đọc được file. Dùng file .xlsx hoặc .csv, hoặc chép cột tên rồi dán vào ô.');
    }
  };

  return (
    <>
      <SelectField
        label="Lớp đang dùng"
        value={String(current.id)}
        options={store.classes.map((c) => ({
          value: String(c.id),
          label: c.name.trim() || `Lớp ${c.id}`,
        }))}
        onChange={(id) => {
          setStatus('');
          save((s) => ({ ...s, activeId: Number(id) }));
        }}
      />
      <TextField
        label="Tên lớp"
        value={current.name}
        onChange={(name) => save((s) => updateClass(s, { name }))}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn"
          disabled={store.classes.length >= MAX_CLASSES}
          onClick={() => save(addClass)}
        >
          <Plus aria-hidden className="size-5" />
          Thêm lớp
        </button>
        <button
          type="button"
          className="btn"
          onClick={() =>
            window.confirm(`Xoá lớp “${current.name}” khỏi máy này?`) && save(removeActiveClass)
          }
        >
          <Trash2 aria-hidden className="size-5" />
          Xoá lớp này
        </button>
      </div>
      <TextAreaField
        label="Học sinh (mỗi dòng một em)"
        rows={10}
        value={current.text}
        placeholder={'Nguyễn Minh An, Nam\nTrần Bảo Ngọc, Nữ'}
        hint="Giới tính viết sau dấu phẩy, bỏ trống cũng được. Dán thẳng hai cột từ Excel cũng được."
        onChange={(text) => save((s) => updateClass(s, { text }))}
      />
      <p role="status">
        {students.length} em
        {boys + girls > 0 && ` · ${boys} nam, ${girls} nữ`}
        {students.length === MAX_STUDENTS_PER_CLASS && ` (tối đa ${MAX_STUDENTS_PER_CLASS})`}
      </p>
      <label className="btn cursor-pointer focus-within:outline-3 focus-within:outline-accent">
        <Upload aria-hidden className="size-5" />
        Nhập từ Excel
        <input
          type="file"
          className="sr-only"
          accept=".xlsx,.csv,.tsv,.txt"
          onChange={(event) => {
            const file = event.target.files?.[0];
            // Cho phép chọn lại cùng file.
            event.target.value = '';
            if (file) void importFile(file);
          }}
        />
      </label>
      {status && <p role="status">{status}</p>}
      <p className="text-muted">
        {persistent
          ? 'Danh sách chỉ lưu trên máy này, không gửi đi đâu.'
          : 'Trình duyệt không cho lưu: danh sách sẽ mất khi đóng trang.'}
      </p>
      <button
        type="button"
        className="btn"
        onClick={() => {
          if (
            window.confirm(
              'Xoá mọi danh sách lớp và nội dung đã nhập trong các công cụ trên máy này?',
            )
          ) {
            wipe();
            setStatus('Đã xoá dữ liệu trên máy này.');
          }
        }}
      >
        Xoá dữ liệu trên máy này
      </button>
    </>
  );
}
