import { useDeferredValue, useMemo } from 'react';
import { ClassListPanel } from '@/components/ClassListPanel';
import { SelectField, TextField } from '@/components/fields';
import { ToolLayout } from '@/components/ToolLayout';
import { activeClass, parseStudents } from '@/core/classes/model';
import { useClassStore } from '@/core/classes/useClassStore';
import { MAX_HEADING_LENGTH } from '@/core/print/SheetHeader';
import { useToolOptions } from '@/core/storage/useToolOptions';
import type { ToolMeta } from '@/core/types';
import { slugify } from '@/core/vi/normalize';
import { Editor } from './Editor';
import { paginateLines } from './layout';
import { CommentPage } from './Pages';
import {
  buildLines,
  DEFAULTS,
  FOCUSES,
  PRONOUNS,
  QUALITIES,
  resolve,
  rewritten,
  STUDIES,
  type Options,
} from './state';

export default function NhanXetHocSinh({ tool }: { tool: ToolMeta }) {
  const [options, patch, reset] = useToolOptions<Options>(tool.slug, DEFAULTS);
  const settings = resolve(options);
  const classes = useClassStore();
  const current = activeClass(classes.store);
  const students = useMemo(() => parseStudents(current.text), [current.text]);
  // Phải giữ nguyên mảng khi không có gì đổi, nếu không `useDeferredValue` vẽ lại mãi.
  const lines = useMemo(
    () => buildLines(current.id, students, resolve(options)),
    [current.id, students, options],
  );
  const hasRecords = Object.keys(settings.records).length > 0;

  const className = current.name.trim();
  const defaultTitle = className ? `Nhận xét học sinh · ${className}` : 'Nhận xét học sinh';
  const title = options.title.trim() || defaultTitle;
  // Gõ lời nhận xét phải mượt: bản in theo sau một nhịp.
  const printed = useDeferredValue(lines);
  const layout = paginateLines(printed, title, options.school.trim());

  return (
    <ToolLayout
      tool={tool}
      onReset={() => {
        if (hasRecords && !window.confirm('Xoá cả lời nhận xét đã sửa trên máy này?')) return;
        reset();
      }}
      options={[
        { title: 'Danh sách lớp', content: <ClassListPanel classes={classes} /> },
        {
          title: 'Cách viết',
          content: (
            <>
              <SelectField
                label="Xưng hô"
                value={settings.pronoun}
                options={PRONOUNS}
                onChange={(pronoun) => patch({ pronoun })}
              />
              <SelectField
                label="Trọng tâm"
                value={settings.focus}
                options={FOCUSES}
                onChange={(focus) => patch({ focus })}
              />
              {settings.focus === 'khac' && (
                <TextField
                  label="Tên môn"
                  value={settings.subject}
                  placeholder="Khoa học"
                  maxLength={40}
                  onChange={(subject) => patch({ subject })}
                />
              )}
              <SelectField
                label="Mức học tập mặc định cho cả lớp"
                value={settings.study}
                options={STUDIES}
                onChange={(study) => patch({ study })}
              />
              <SelectField
                label="Mức phẩm chất mặc định cho cả lớp"
                value={settings.quality}
                options={QUALITIES}
                onChange={(quality) => patch({ quality })}
              />
              <p className="text-muted">
                Đổi mức riêng cho từng em ở danh sách bên cạnh. Lời đã sửa tay được giữ nguyên.
              </p>
            </>
          ),
        },
        {
          title: 'Bản in',
          content: (
            <>
              <TextField
                label="Tiêu đề phiếu"
                value={options.title}
                placeholder={defaultTitle}
                hint="Bỏ trống thì dùng tiêu đề mặc định."
                maxLength={MAX_HEADING_LENGTH}
                onChange={(value) => patch({ title: value })}
              />
              <TextField
                label="Trường, lớp"
                value={options.school}
                maxLength={MAX_HEADING_LENGTH}
                onChange={(school) => patch({ school })}
              />
            </>
          ),
        },
      ]}
      actions={
        classes.loaded && students.length === 0 ? (
          <p role="status" className="basis-full font-medium text-accent">
            Chưa có học sinh. Dán danh sách ở mục “Danh sách lớp”.
          </p>
        ) : undefined
      }
      editor={
        students.length > 0 && (
          <Editor
            lines={lines}
            fileName={slugify(defaultTitle) || tool.slug}
            hasRecords={hasRecords}
            onChange={(key, update) =>
              patch({
                records: { ...settings.records, [key]: update(settings.records[key] ?? {}) },
              })
            }
            onRewrite={(targets) =>
              patch({
                records: {
                  ...settings.records,
                  ...Object.fromEntries(targets.map((l) => [l.key, rewritten(l, settings)])),
                },
              })
            }
            onClear={() => patch({ records: {} })}
          />
        )
      }
    >
      {layout.pages.map((rows, index) => (
        <CommentPage
          key={index}
          rows={rows}
          title={title}
          school={options.school.trim()}
          headerHeight={layout.header}
        />
      ))}
    </ToolLayout>
  );
}
