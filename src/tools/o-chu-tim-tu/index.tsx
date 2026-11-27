import { useMemo } from 'react';
import { FontFields, HeaderFields, SheetCountFields } from '@/components/CommonOptionFields';
import { COMMON_DEFAULTS, sheetNames } from '@/components/commonOptions';
import { ToolLayout } from '@/components/ToolLayout';
import { ANSWER_GRID_MM, AnswerGrids } from '@/core/print/AnswerGrids';
import { getPrintFont, type PrintFontId } from '@/core/print/fonts';
import { deriveSeed } from '@/core/rng';
import { useToolOptions } from '@/core/storage/useToolOptions';
import type { ToolMeta } from '@/core/types';
import {
  defaultTitle,
  generate,
  parseEntries,
  SAMPLE_WORDS,
  toConfig,
  wordCount,
  type Config,
  type Puzzle,
} from './generator';
import { CrossGrid, SearchGrid } from './Grids';
import { ContentFields, GridFontField, ListFields } from './Options';
import { PuzzlePages } from './Pages';

const PUZZLE_DEFAULTS: Config & { showList: boolean; words: string; gridFont: PrintFontId } = {
  kind: 'tim-tu',
  size: 12,
  level: 'vua',
  showList: true,
  words: SAMPLE_WORDS,
  gridFont: 'be-vietnam-pro',
};

const DEFAULTS = { ...COMMON_DEFAULTS, ...PUZZLE_DEFAULTS };

function AnswerGrid({ puzzle, font }: { puzzle: Puzzle; font: PrintFontId }) {
  const props = { font: getPrintFont(font), solved: true };
  const columns = puzzle.kind === 'tim-tu' ? puzzle.size : puzzle.columns;
  const rows = puzzle.kind === 'tim-tu' ? puzzle.size : puzzle.rows;
  const cell = Math.min(8, ANSWER_GRID_MM.width / columns, ANSWER_GRID_MM.height / rows);
  return puzzle.kind === 'tim-tu' ? (
    <SearchGrid puzzle={puzzle} cell={cell} {...props} />
  ) : (
    <CrossGrid puzzle={puzzle} cell={cell} {...props} />
  );
}

export default function OChuTimTu({ tool }: { tool: ToolMeta }) {
  const [options, patch, reset] = useToolOptions(tool.slug, DEFAULTS);

  const { config, parsed, sheets } = useMemo(() => {
    const config = toConfig(options);
    const parsed = parseEntries(options.words);
    const sheets = sheetNames(options).map((studentName, index) => ({
      studentName,
      puzzle: generate(parsed.entries, config, deriveSeed(options.seed, index)),
    }));
    return { config, parsed, sheets };
  }, [options]);

  // Mỗi phiếu xếp khác nhau: gộp các từ bị loại ở bất kỳ phiếu nào.
  const rejected = [
    ...new Map(sheets.flatMap((s) => s.puzzle.rejected).map((r) => [r.word, r])).values(),
  ];
  const placed = Math.min(...sheets.map((s) => wordCount(s.puzzle)));
  const printable = sheets.filter((s) => wordCount(s.puzzle) > 0);
  const style = { font: getPrintFont(options.font), large: options.largeText };
  const gridFont = getPrintFont(options.gridFont);
  const fallbackTitle = defaultTitle(config.kind);
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
          title: 'Loại và độ khó',
          content: <ContentFields config={config} showList={options.showList} onChange={patch} />,
        },
        {
          title: 'Danh sách từ',
          content: (
            <ListFields
              words={options.words}
              parsed={parsed}
              placed={placed}
              rejected={rejected}
              onChange={patch}
            />
          ),
        },
        {
          title: 'Bố cục và chữ',
          content: (
            <>
              <GridFontField
                value={options.gridFont}
                onChange={(gridFont) => patch({ gridFont })}
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
      {printable.map((sheet, index) => (
        <PuzzlePages
          key={index}
          puzzle={sheet.puzzle}
          showList={options.showList}
          gridFont={gridFont}
          style={style}
          studentName={sheet.studentName}
          title={title}
          school={options.school}
          showNameLine={options.showNameLine}
        />
      ))}
      {options.answerKey && (
        <AnswerGrids
          title={title}
          seed={options.seed}
          blocks={printable.map((sheet, index) => ({
            label: `Phiếu ${index + 1}${sheet.studentName ? ` · ${sheet.studentName}` : ''}`,
            content: <AnswerGrid puzzle={sheet.puzzle} font={options.gridFont} />,
          }))}
        />
      )}
    </ToolLayout>
  );
}
