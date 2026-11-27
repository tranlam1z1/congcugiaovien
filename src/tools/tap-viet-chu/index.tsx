import { useDeferredValue, useMemo } from 'react';
import { HeaderFields } from '@/components/CommonOptionFields';
import { COMMON_DEFAULTS } from '@/components/commonOptions';
import { StudentListInput } from '@/components/StudentListInput';
import { ToolLayout } from '@/components/ToolLayout';
import { useToolOptions } from '@/core/storage/useToolOptions';
import { parseStudentList } from '@/core/studentList';
import type { ToolMeta } from '@/core/types';
import type { Handwriting } from './handwriting';
import { buildRows, layoutPages, MAX_PAGES, parseLines, studentLimit } from './layout';
import { ContentFields, RowFields, SizeFields, StyleFields } from './OptionFields';
import { DEFAULT_TITLE, DEFAULTS, resolve, type Options } from './options';
import { useGlyphs, WritingPage } from './Pages';
import { useHandwriting } from './useHandwriting';

export default function TapVietChu({ tool }: { tool: ToolMeta }) {
  const [options, patch, reset] = useToolOptions(tool.slug, DEFAULTS);
  const settings = resolve(options);
  const { font, failed, retry } = useHandwriting();

  // Gõ vào ô nhập phải mượt: bản xem trước theo sau một nhịp.
  const shown = useDeferredValue(options);
  const missing = useMemo(
    () => font?.missing(options.text) ?? [],
    [font, options.text],
  );

  const summary = useMemo(() => {
    if (!font) return null;
    const settings = resolve(shown);
    return layoutPages(buildRows(parseLines(shown.text), settings, font.shape), settings);
  }, [font, shown]);

  const students = parseStudentList(shown.students);
  const limit = studentLimit(summary?.pages.length ?? 1);
  const empty = summary?.pages.length === 0;

  const notice = failed ? (
    <p role="alert" className="flex flex-wrap items-center gap-3">
      Chưa tải được font tập viết. Bạn kiểm tra mạng rồi thử lại.
      <button type="button" className="btn" onClick={retry}>
        Tải lại font
      </button>
    </p>
  ) : !font ? (
    <p role="status">Đang tải font tập viết…</p>
  ) : empty ? (
    <p role="status">Nhập nội dung ở mục “Nội dung” để tạo dòng tập viết.</p>
  ) : summary && summary.dropped > 0 ? (
    <p role="alert">
      Nội dung quá dài: chỉ in {MAX_PAGES} trang, bỏ {summary.dropped} dòng cuối.
    </p>
  ) : students.length > limit ? (
    <p role="alert">
      Chỉ in {limit} em đầu để không quá số trang cho phép. Hãy chia danh sách thành nhiều lượt.
    </p>
  ) : null;

  const props = { options, settings, onChange: patch };

  return (
    <ToolLayout
      tool={tool}
      onReset={reset}
      actions={notice}
      options={[
        {
          title: 'Nội dung',
          content: <ContentFields options={options} onChange={patch} missing={missing} />,
        },
        { title: 'Cỡ chữ và giấy', content: <SizeFields {...props} /> },
        { title: 'Kiểu chữ mẫu', content: <StyleFields {...props} /> },
        { title: 'Số dòng', content: <RowFields {...props} /> },
        {
          title: 'Đầu phiếu',
          content: (
            <HeaderFields
              value={{ ...COMMON_DEFAULTS, ...options }}
              onChange={patch}
              defaultTitle={DEFAULT_TITLE}
            />
          ),
        },
        {
          title: 'Danh sách học sinh',
          content: (
            <StudentListInput
              value={options.students}
              onChange={(students) => patch({ students })}
            />
          ),
        },
      ]}
    >
      {font && summary && (
        <Sheets
          font={font}
          options={shown}
          pages={summary.pages}
          students={students.slice(0, limit)}
        />
      )}
    </ToolLayout>
  );
}

function Sheets({
  font,
  options,
  pages,
  students,
}: {
  font: Handwriting;
  options: Options;
  pages: ReturnType<typeof layoutPages>['pages'];
  students: string[];
}) {
  const settings = resolve(options);
  const glyphs = useGlyphs(font, settings);
  const names: (string | undefined)[] = students.length ? students : [undefined];
  return names.flatMap((studentName, sheet) =>
    pages.map((rows, page) => (
      <WritingPage
        key={`${sheet}-${page}`}
        rows={rows}
        settings={settings}
        glyphs={glyphs}
        studentName={studentName}
      />
    )),
  );
}
