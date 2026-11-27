import { CheckboxField, SelectField, TextAreaField } from '@/components/fields';
import {
  countUnusable,
  MAX_SENTENCE_LENGTH,
  MAX_SENTENCES,
  MAX_WORD_LENGTH,
  MAX_WORDS,
  SAMPLE_SENTENCES,
  SAMPLE_WORDS,
  type Form,
  type Hide,
  type Lines,
} from './generator';

type Patch = (changes: {
  form?: Form;
  hide?: Hide;
  showBank?: boolean;
  words?: string;
  sentences?: string;
}) => void;

export function ContentFields({
  form,
  hide,
  showBank,
  onChange,
}: {
  form: Form;
  hide: Hide;
  showBank: boolean;
  onChange: Patch;
}) {
  return (
    <>
      <SelectField
        label="Dạng bài"
        value={form}
        options={[
          { value: 'dien', label: 'Điền âm, vần' },
          { value: 'noi', label: 'Nối từ' },
          { value: 'sap-xep', label: 'Sắp xếp câu' },
        ]}
        onChange={(form) => onChange({ form })}
      />
      {form === 'dien' && (
        <>
          <SelectField
            label="Ẩn phần nào"
            value={hide}
            options={[
              { value: 'onset', label: 'Âm đầu' },
              { value: 'rime', label: 'Vần' },
              { value: 'both', label: 'Cả hai (trộn âm đầu và vần)' },
            ]}
            onChange={(hide) => onChange({ hide })}
          />
          <CheckboxField
            label="Cho sẵn âm, vần để chọn"
            checked={showBank}
            onChange={(showBank) => onChange({ showBank })}
          />
        </>
      )}
    </>
  );
}

const UNUSABLE_REASON: Record<Form, string> = {
  dien: 'không tách được âm, vần theo lựa chọn này',
  noi: 'không chia được thành hai vế (thêm dấu | để tự chia)',
  'sap-xep': 'có chưa đến hai từ',
};

export function ListFields({
  form,
  hide,
  words,
  sentences,
  lines,
  onChange,
}: {
  form: Form;
  hide: Hide;
  words: string;
  sentences: string;
  lines: Lines;
  onChange: Patch;
}) {
  const isSentences = form === 'sap-xep';
  const unusable = countUnusable(lines.items, form, hide);
  const usable = lines.items.length - unusable;

  return (
    <>
      <TextAreaField
        label={isSentences ? 'Mỗi dòng một câu' : 'Mỗi dòng một từ'}
        rows={10}
        value={isSentences ? sentences : words}
        hint={
          form === 'noi'
            ? 'Tự chia vế bằng dấu |, ví dụ: bông hoa | màu đỏ.'
            : 'Dòng trùng nhau chỉ tính một lần.'
        }
        onChange={(text) => onChange(isSentences ? { sentences: text } : { words: text })}
      />
      <div role="status" className="flex flex-col gap-1">
        <p>
          {usable > 0
            ? `Dùng ${usable} ${isSentences ? 'câu' : 'từ'}.`
            : `Chưa có ${isSentences ? 'câu' : 'từ'} nào dùng được. Nhập vào ô trên hoặc bấm “Dùng danh sách mẫu”.`}
        </p>
        {unusable > 0 && (
          <p className="text-accent">
            Bỏ qua {unusable} dòng {UNUSABLE_REASON[form]}.
          </p>
        )}
        {lines.dropped > 0 && (
          <p className="text-accent">
            Bỏ qua {lines.dropped} dòng: tối đa {isSentences ? MAX_SENTENCES : MAX_WORDS} dòng, mỗi
            dòng không quá {isSentences ? MAX_SENTENCE_LENGTH : MAX_WORD_LENGTH} ký tự.
          </p>
        )}
      </div>
      <button
        type="button"
        className="btn"
        onClick={() =>
          onChange(isSentences ? { sentences: SAMPLE_SENTENCES } : { words: SAMPLE_WORDS })
        }
      >
        Dùng danh sách mẫu
      </button>
    </>
  );
}
