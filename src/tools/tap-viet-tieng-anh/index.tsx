import { useDeferredValue, useMemo } from 'react';
import { HeaderFields } from '@/components/CommonOptionFields';
import { COMMON_DEFAULTS } from '@/components/commonOptions';
import { StudentListInput } from '@/components/StudentListInput';
import { ToolLayout } from '@/components/ToolLayout';
import { MAX_PAGES, parseLines, studentLimit } from '@/core/handwriting/lines';
import { useHandwriting } from '@/core/handwriting/useHandwriting';
import { useToolOptions } from '@/core/storage/useToolOptions';
import { parseStudentList } from '@/core/studentList';
import type { ToolMeta } from '@/core/types';
import { buildRows, layoutPages } from './layout';
import { ContentFields, RowFields, StyleFields } from './OptionFields';
import { DEFAULT_TITLE, DEFAULTS, resolve, type Settings } from './options';
import { useGlyphs, WritingPage } from './Pages';
import { cursiveWriter, printWriter, type Writer } from './writer';

export default function TapVietTiengAnh({ tool }: { tool: ToolMeta }) {
  const [options, patch, reset] = useToolOptions(tool.slug, DEFAULTS);
  const settings = resolve(options);
  const cursive = settings.lettering === 'cursive';
  // Chữ in tự vẽ sẵn, chỉ chữ nối nét mới phải tải font.
  const { font, failed, retry } = useHandwriting(cursive);
  const writer = useMemo(
    () => (!cursive ? printWriter : font ? cursiveWriter(font) : null),
    [cursive, font],
  );
  const missing = useMemo(() => writer?.missing(options.text) ?? [], [writer, options.text]);

  // Gõ vào ô nhập phải mượt: bản xem trước theo sau một nhịp.
  const shown = useDeferredValue(options);
  const summary = useMemo(() => {
    if (!writer) return null;
    const settings = resolve(shown);
    const rows = buildRows(parseLines(shown.text), settings, writer);
    return layoutPages(rows, settings, writer);
  }, [writer, shown]);

  const students = parseStudentList(shown.students);
  const limit = studentLimit(summary?.pages.length ?? 1);

  const notice = !writer ? (
    failed ? (
      <p role="alert" className="flex flex-wrap items-center gap-3">
        Chưa tải được font chữ nối nét. Bạn kiểm tra mạng rồi thử lại.
        <button type="button" className="btn" onClick={retry}>
          Tải lại font
        </button>
      </p>
    ) : (
      <p role="status">Đang tải font chữ…</p>
    )
  ) : summary?.pages.length === 0 ? (
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
        { title: 'Kiểu chữ và dòng kẻ', content: <StyleFields {...props} /> },
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
      {writer && summary && (
        <Sheets
          writer={writer}
          settings={resolve(shown)}
          pages={summary.pages}
          students={students.slice(0, limit)}
        />
      )}
    </ToolLayout>
  );
}

function Sheets({
  writer,
  settings,
  pages,
  students,
}: {
  writer: Writer;
  settings: Settings;
  pages: ReturnType<typeof layoutPages>['pages'];
  students: string[];
}) {
  const glyphs = useGlyphs(writer, settings);
  const names: (string | undefined)[] = students.length ? students : [undefined];
  return names.flatMap((studentName, sheet) =>
    pages.map((rows, page) => (
      <WritingPage
        key={`${sheet}-${page}`}
        rows={rows}
        settings={settings}
        writer={writer}
        glyphs={glyphs}
        studentName={studentName}
      />
    )),
  );
}
