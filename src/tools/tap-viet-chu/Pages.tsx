import { useMemo } from 'react';
import { dotsPath, outlinePath, type Handwriting } from '@/core/handwriting/cursive';
import { pens } from '@/core/handwriting/style';
import { A4Page } from '@/core/print/A4Page';
import { SheetHeader } from '@/core/print/SheetHeader';
import { grid, MARGIN_MM, scaleOf, type Row } from './layout';
import type { Settings } from './options';

const GRID_COLOR = '#93b4d8';
const GUIDE_COLOR = '#4a74a8';

/** Đường nét của mỗi dòng chữ, dựng một lần rồi dùng lại cho mọi chỗ lặp. */
export type Glyphs = (text: string) => { solid: string; dots: string };

export function useGlyphs(font: Handwriting, settings: Settings): Glyphs {
  const scale = scaleOf(settings);
  const { spacing } = pens(settings.size * settings.cell);
  const dotted = settings.style === 'cham';
  return useMemo(() => {
    const cache = new Map<string, { solid: string; dots: string }>();
    return (text) => {
      let paths = cache.get(text);
      if (!paths) {
        const shape = font.shape(text);
        paths = {
          solid: outlinePath(shape, scale),
          dots: dotted ? dotsPath(shape, scale, spacing) : '',
        };
        cache.set(text, paths);
      }
      return paths;
    };
  }, [font, scale, spacing, dotted]);
}

function Sample({
  glyphs,
  settings,
  x,
  y,
  model,
}: {
  glyphs: ReturnType<Glyphs>;
  settings: Settings;
  x: number;
  y: number;
  /** Chữ mẫu đậm ở đầu dòng. */
  model: boolean;
}) {
  const place = `translate(${x} ${y})`;
  const { color, style } = settings;
  const opacity = 1 - settings.fade / 100;
  const { outline, dot } = pens(settings.size * settings.cell);

  if (model) return <path data-sample="model" transform={place} d={glyphs.solid} fill={color} />;
  if (style === 'cham') {
    return (
      <path
        data-sample="cham"
        transform={place}
        d={glyphs.dots}
        fill="none"
        stroke={color}
        strokeOpacity={opacity}
        strokeWidth={dot}
        strokeLinecap="round"
      />
    );
  }
  if (style === 'rong') {
    // Vẽ viền dày gấp đôi rồi tô trắng đè lên: các đường chồng nhau bên trong nét bị che.
    return (
      <g data-sample="rong">
        <path
          transform={place}
          d={glyphs.solid}
          fill="none"
          stroke={color}
          strokeOpacity={opacity}
          strokeWidth={outline * 2}
        />
        <path transform={place} d={glyphs.solid} fill="#fff" />
      </g>
    );
  }
  return (
    <path data-sample="mo" transform={place} d={glyphs.solid} fill={color} fillOpacity={opacity} />
  );
}

export function WritingPage({
  rows,
  settings,
  glyphs,
  studentName,
}: {
  rows: Row[];
  settings: Settings;
  glyphs: Glyphs;
  studentName?: string;
}) {
  const area = grid(settings);
  const { cell, paper, guides } = settings;
  const xHeight = settings.size * cell;

  const across = Array.from(
    { length: area.rows + 1 },
    (_, i) => `M0 ${i * cell}H${area.width}`,
  ).join('');
  const down = Array.from(
    { length: area.columns + 1 },
    (_, i) => `M${i * cell} 0V${area.height}`,
  ).join('');

  let used = 0;
  const placed = rows.map((row) => {
    const top = used * cell;
    used += row.cells;
    return { ...row, y: top + row.baseline * cell };
  });
  const guide = (offset: number) =>
    placed.map((row) => `M0 ${row.y - offset}H${area.width}`).join('');

  return (
    <A4Page margin={MARGIN_MM}>
      <div data-writing-header style={{ height: `${area.header}mm` }}>
        <SheetHeader
          title={settings.title}
          school={settings.school}
          showNameLine={settings.showNameLine}
          studentName={studentName}
        />
      </div>
      <svg
        className="mx-auto block overflow-visible"
        width={`${area.width}mm`}
        height={`${area.height}mm`}
        viewBox={`0 0 ${area.width} ${area.height}`}
        role="img"
        aria-label={`Dòng tập viết: ${[...new Set(rows.map((row) => row.text))].join(', ')}`}
      >
        {paper !== 'trang' && (
          <path
            data-grid
            d={paper === 'o-ly' ? across + down : across}
            fill="none"
            stroke={GRID_COLOR}
            strokeWidth={0.15}
          />
        )}
        {guides && (
          <>
            <path data-guide="chan" d={guide(0)} fill="none" stroke={GUIDE_COLOR} strokeWidth={0.35} />
            <path
              data-guide="cao"
              d={guide(xHeight)}
              fill="none"
              stroke={GUIDE_COLOR}
              strokeWidth={0.2}
              strokeDasharray="1.5 1"
            />
          </>
        )}
        {placed.map((row, i) =>
          row.at.map((x, k) => (
            <Sample
              key={`${i}-${k}`}
              glyphs={glyphs(row.text)}
              settings={settings}
              x={x}
              y={row.y}
              model={k === 0 && row.model}
            />
          )),
        )}
      </svg>
    </A4Page>
  );
}
