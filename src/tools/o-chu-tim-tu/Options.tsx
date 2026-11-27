import { CheckboxField, NumberField, SelectField, TextAreaField } from '@/components/fields';
import { PRINT_FONTS, type PrintFontId } from '@/core/print/fonts';
import {
  MAX_CLUE_LENGTH,
  MAX_ENTRIES,
  MAX_SIZE,
  MAX_WORD_LENGTH,
  MIN_SIZE,
  SAMPLE_WORDS,
  type Config,
  type Entries,
  type Reason,
  type Rejected,
} from './generator';

type Patch = (changes: Partial<Config> & { showList?: boolean; words?: string }) => void;

export function ContentFields({
  config,
  showList,
  onChange,
}: {
  config: Config;
  showList: boolean;
  onChange: Patch;
}) {
  return (
    <>
      <SelectField
        label="Loại ô chữ"
        value={config.kind}
        options={[
          { value: 'tim-tu', label: 'Tìm từ ẩn' },
          { value: 'o-chu', label: 'Ô chữ có gợi ý' },
        ]}
        onChange={(kind) => onChange({ kind })}
      />
      <NumberField
        label="Kích thước lưới (số ô mỗi cạnh)"
        hint={`Từ ${MIN_SIZE} đến ${MAX_SIZE}.`}
        value={config.size}
        min={MIN_SIZE}
        max={MAX_SIZE}
        onChange={(size) => onChange({ size })}
      />
      {config.kind === 'tim-tu' && (
        <>
          <SelectField
            label="Độ khó"
            value={config.level}
            options={[
              { value: 'de', label: 'Dễ (ngang, dọc)' },
              { value: 'vua', label: 'Vừa (thêm đường chéo)' },
              { value: 'kho', label: 'Khó (mọi hướng, cả ngược)' },
            ]}
            onChange={(level) => onChange({ level })}
          />
          <CheckboxField
            label="Hiện danh sách từ cần tìm"
            checked={showList}
            onChange={(showList) => onChange({ showList })}
          />
        </>
      )}
    </>
  );
}

const REASON: Record<Reason, string> = {
  long: 'Dài hơn lưới, hãy tăng kích thước',
  space: 'Không đủ chỗ hoặc không giao được với từ khác',
  'no-clue': 'Chưa có gợi ý (thêm dấu | rồi viết gợi ý)',
};

export function ListFields({
  words,
  parsed,
  placed,
  rejected,
  onChange,
}: {
  words: string;
  parsed: Entries;
  /** Số từ xếp được ở phiếu ít từ nhất. */
  placed: number;
  rejected: Rejected[];
  onChange: Patch;
}) {
  return (
    <>
      <TextAreaField
        label="Mỗi dòng một từ"
        rows={10}
        value={words}
        hint="Ô chữ có gợi ý: viết dạng từ | gợi ý."
        onChange={(words) => onChange({ words })}
      />
      <div role="status" className="flex flex-col gap-1">
        <p>
          {placed > 0
            ? `Xếp được ${placed}/${parsed.entries.length} từ.`
            : 'Chưa có từ nào xếp được. Nhập vào ô trên hoặc bấm “Dùng danh sách mẫu”.'}
        </p>
        {(Object.keys(REASON) as Reason[]).map((reason) => {
          const list = rejected.filter((r) => r.reason === reason).map((r) => r.word);
          return (
            list.length > 0 && (
              <p key={reason} className="text-accent">
                {REASON[reason]}: {list.join(', ')}.
              </p>
            )
          );
        })}
        {parsed.dropped > 0 && (
          <p className="text-accent">
            Bỏ qua {parsed.dropped} dòng: mỗi từ cần ít nhất 2 chữ, không quá {MAX_WORD_LENGTH} ký
            tự, gợi ý không quá {MAX_CLUE_LENGTH} ký tự, tối đa {MAX_ENTRIES} từ.
          </p>
        )}
      </div>
      <button type="button" className="btn" onClick={() => onChange({ words: SAMPLE_WORDS })}>
        Dùng danh sách mẫu
      </button>
    </>
  );
}

export function GridFontField({
  value,
  onChange,
}: {
  value: PrintFontId;
  onChange: (font: PrintFontId) => void;
}) {
  return (
    <SelectField
      label="Font trong ô"
      value={value}
      options={PRINT_FONTS.map((font) => ({ value: font.id, label: font.label }))}
      onChange={onChange}
    />
  );
}
