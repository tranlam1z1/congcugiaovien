import { useMemo } from 'react';
import { FontFields, HeaderFields, SheetCountFields } from '@/components/CommonOptionFields';
import { COMMON_DEFAULTS, sheetNames } from '@/components/commonOptions';
import { SelectField } from '@/components/fields';
import { ToolLayout } from '@/components/ToolLayout';
import { AnswerPages } from '@/core/print/AnswerPages';
import { getPrintFont, type PrintFontId } from '@/core/print/fonts';
import { deriveSeed } from '@/core/rng';
import { useToolOptions } from '@/core/storage/useToolOptions';
import type { ToolMeta } from '@/core/types';
import {
  answersOf,
  defaultTitle,
  FORMS,
  generate,
  HIDES,
  MAX_SENTENCE_LENGTH,
  MAX_SENTENCES,
  MAX_WORD_LENGTH,
  MAX_WORDS,
  parseLines,
  SAMPLE_SENTENCES,
  SAMPLE_WORDS,
  type Form,
  type Hide,
} from './generator';
import { maxColumns } from './layout';
import { ContentFields, ListFields } from './Options';
import { WorksheetPages } from './Pages';

const DEFAULTS = {
  ...COMMON_DEFAULTS,
  // Chờ font HP001 có giấy phép, tạm dùng font viết tay dự phòng (PRD mục 8).
  font: 'playwrite-vn' as PrintFontId,
  largeText: true,
  form: 'dien' as Form,
  hide: 'onset' as Hide,
  showBank: true,
  words: SAMPLE_WORDS,
  sentences: SAMPLE_SENTENCES,
  columns: 2,
};

export default function PhieuTiengViet({ tool }: { tool: ToolMeta }) {
  const [options, patch, reset] = useToolOptions(tool.slug, DEFAULTS);
  const form = FORMS.includes(options.form) ? options.form : 'dien';
  const hide = HIDES.includes(options.hide) ? options.hide : 'onset';

  const { lines, sheets, names } = useMemo(() => {
    const lines =
      form === 'sap-xep'
        ? parseLines(options.sentences, MAX_SENTENCES, MAX_SENTENCE_LENGTH)
        : parseLines(options.words, MAX_WORDS, MAX_WORD_LENGTH);
    const names = sheetNames(options);
    const sheets = names.map((_, index) =>
      generate({ form, hide, items: lines.items }, deriveSeed(options.seed, index)),
    );
    return { lines, sheets, names };
  }, [options, form, hide]);

  const style = { font: getPrintFont(options.font), large: options.largeText };
  const columnLimit = maxColumns(sheets, style);
  const columns = Math.min(columnLimit, options.columns === 3 ? 3 : 2);
  const fallbackTitle = defaultTitle(form, hide);
  const title = options.title.trim() || fallbackTitle;
  const hasContent = sheets.some((s) => answersOf(s).length > 0);

  return (
    <ToolLayout
      tool={tool}
      font={options.font}
      onReset={reset}
      seed={{ value: options.seed, onChange: (seed) => patch({ seed }) }}
      answerKey={{ checked: options.answerKey, onChange: (answerKey) => patch({ answerKey }) }}
      options={[
        {
          title: 'Dạng bài',
          content: (
            <ContentFields
              form={form}
              hide={hide}
              showBank={options.showBank}
              onChange={patch}
            />
          ),
        },
        {
          title: form === 'sap-xep' ? 'Danh sách câu' : 'Danh sách từ',
          content: (
            <ListFields
              form={form}
              hide={hide}
              words={options.words}
              sentences={options.sentences}
              lines={lines}
              onChange={patch}
            />
          ),
        },
        {
          title: 'Bố cục và chữ',
          content: (
            <>
              {form !== 'sap-xep' && (
                <>
                  <SelectField
                    label="Số cột"
                    value={options.columns === 3 ? '3' : '2'}
                    options={[
                      { value: '2', label: '2 cột' },
                      { value: '3', label: '3 cột' },
                    ]}
                    onChange={(value) => patch({ columns: Number(value) })}
                  />
                  {columnLimit < (options.columns === 3 ? 3 : 2) && (
                    <p role="status">
                      Chữ dài nên chỉ xếp được {columnLimit} cột. Chọn font hẹp hơn hoặc tắt chữ to
                      để thêm cột.
                    </p>
                  )}
                </>
              )}
              <FontFields value={options} onChange={patch} />
            </>
          ),
        },
        {
          title: 'Đầu phiếu',
          content: (
            <HeaderFields value={options} onChange={patch} defaultTitle={fallbackTitle} />
          ),
        },
        {
          title: 'Số phiếu và học sinh',
          content: <SheetCountFields value={options} onChange={patch} />,
        },
      ]}
    >
      {hasContent &&
        sheets.map((sheet, index) => (
          <WorksheetPages
            key={index}
            sheet={sheet}
            hide={hide}
            showBank={options.showBank}
            columns={columns}
            style={style}
            studentName={names[index]}
            title={title}
            school={options.school}
            showNameLine={options.showNameLine}
          />
        ))}
      {hasContent && options.answerKey && (
        <AnswerPages
          title={title}
          seed={options.seed}
          columns={form === 'sap-xep' ? 1 : 2}
          blocks={sheets.map((sheet, index) => ({
            label: `Phiếu ${index + 1}${names[index] ? ` · ${names[index]}` : ''}`,
            answers: answersOf(sheet),
          }))}
        />
      )}
    </ToolLayout>
  );
}
