import { useMemo } from 'react';
import { FontFields, HeaderFields, SheetCountFields } from '@/components/CommonOptionFields';
import { COMMON_DEFAULTS, sheetNames } from '@/components/commonOptions';
import { ToolLayout } from '@/components/ToolLayout';
import { AnswerPages } from '@/core/print/AnswerPages';
import { getPrintFont } from '@/core/print/fonts';
import { deriveSeed } from '@/core/rng';
import { useToolOptions } from '@/core/storage/useToolOptions';
import type { ToolMeta } from '@/core/types';
import { answerOf, defaultTitle, generate, toConfig, type MathConfig } from './generator';
import { maxColumns } from './layout';
import { ContentFields, LayoutFields, PresetButtons } from './Options';
import { WorksheetPages, type Sheet } from './Pages';

const MATH_DEFAULTS: MathConfig & { columns: number } = {
  ops: ['add', 'sub'],
  range: 10,
  table: 'none',
  form: 'ngang',
  compareExpressions: false,
  count: 30,
  columns: 3,
};

const DEFAULTS = { ...COMMON_DEFAULTS, ...MATH_DEFAULTS };

export default function PhieuToan({ tool }: { tool: ToolMeta }) {
  const [options, patch, reset] = useToolOptions(tool.slug, DEFAULTS);

  const { config, sheets } = useMemo(() => {
    const config = toConfig(options);
    const sheets: Sheet[] = sheetNames(options).map((studentName, index) => ({
      studentName,
      questions: generate(config, deriveSeed(options.seed, index)),
    }));
    return { config, sheets };
  }, [options]);

  const font = getPrintFont(options.font);
  const columnLimit = maxColumns(config, font, options.largeText);
  const columns = Math.min(columnLimit, Math.max(1, options.columns));
  const fallbackTitle = defaultTitle(config);
  const title = options.title.trim() || fallbackTitle;

  return (
    <ToolLayout
      tool={tool}
      font={options.font}
      onReset={reset}
      seed={{ value: options.seed, onChange: (seed) => patch({ seed }) }}
      answerKey={{ checked: options.answerKey, onChange: (answerKey) => patch({ answerKey }) }}
      options={[
        {
          title: 'Chọn nhanh theo lớp',
          content: <PresetButtons config={config} onChange={patch} />,
        },
        { title: 'Dạng bài', content: <ContentFields config={config} onChange={patch} /> },
        {
          title: 'Bố cục và chữ',
          content: (
            <>
              <LayoutFields
                config={config}
                onChange={patch}
                columns={columns}
                columnLimit={columnLimit}
                onColumnsChange={(value) => patch({ columns: value })}
              />
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
      {sheets.map((sheet, index) => (
        <WorksheetPages
          key={index}
          sheet={sheet}
          config={config}
          columns={columns}
          font={font}
          large={options.largeText}
          title={title}
          school={options.school}
          showNameLine={options.showNameLine}
        />
      ))}
      {options.answerKey && (
        <AnswerPages
          title={title}
          seed={options.seed}
          columns={6}
          blocks={sheets.map((sheet, index) => ({
            label: `Phiếu ${index + 1}${sheet.studentName ? ` · ${sheet.studentName}` : ''}`,
            answers: sheet.questions.map(answerOf),
          }))}
        />
      )}
    </ToolLayout>
  );
}
