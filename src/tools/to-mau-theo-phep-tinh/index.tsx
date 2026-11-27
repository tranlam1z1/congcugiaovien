import { useMemo } from 'react';
import { FontFields, HeaderFields, SheetCountFields } from '@/components/CommonOptionFields';
import { COMMON_DEFAULTS, sheetNames } from '@/components/commonOptions';
import { ToolLayout } from '@/components/ToolLayout';
import { AnswerGrids } from '@/core/print/AnswerGrids';
import { getPrintFont } from '@/core/print/fonts';
import { deriveSeed } from '@/core/rng';
import { useToolOptions } from '@/core/storage/useToolOptions';
import type { ToolMeta } from '@/core/types';
import { defaultTitle, EVERY_PAGE, generate, pictureFor, toConfig, type Config } from './generator';
import { MathFields, PictureFields } from './Options';
import { ColoredPicture, WorksheetPage } from './Pages';

const COLOR_DEFAULTS: Config = { operation: 'cong', range: 10, picture: EVERY_PAGE, cells: 64 };

const DEFAULTS = { ...COMMON_DEFAULTS, ...COLOR_DEFAULTS };

export default function ToMauTheoPhepTinh({ tool }: { tool: ToolMeta }) {
  const [options, patch, reset] = useToolOptions(tool.slug, DEFAULTS);

  const { config, sheets } = useMemo(() => {
    const config = toConfig(options);
    const sheets = sheetNames(options).map((studentName, index) => ({
      studentName,
      sheet: generate(
        config,
        pictureFor(config, options.seed, index).id,
        deriveSeed(options.seed, index),
      ),
    }));
    return { config, sheets };
  }, [options]);

  const font = getPrintFont(options.font);
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
        { title: 'Phép tính', content: <MathFields config={config} onChange={patch} /> },
        { title: 'Hình tô màu', content: <PictureFields config={config} onChange={patch} /> },
        { title: 'Chữ', content: <FontFields value={options} onChange={patch} /> },
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
      {sheets.map(({ sheet, studentName }, index) => (
        <WorksheetPage
          key={index}
          sheet={sheet}
          font={font}
          large={options.largeText}
          studentName={studentName}
          title={title}
          school={options.school}
          showNameLine={options.showNameLine}
        />
      ))}
      {options.answerKey && (
        <AnswerGrids
          title={title}
          seed={options.seed}
          blocks={sheets.map(({ sheet, studentName }, index) => ({
            label: `Phiếu ${index + 1} · ${studentName ?? sheet.name}`,
            content: <ColoredPicture sheet={sheet} />,
          }))}
        />
      )}
    </ToolLayout>
  );
}
