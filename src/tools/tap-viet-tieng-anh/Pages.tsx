import { useMemo } from 'react';
import { outlinePath } from '@/core/handwriting/cursive';
import { clamp, pens } from '@/core/handwriting/style';
import { A4Page } from '@/core/print/A4Page';
import { SheetHeader } from '@/core/print/SheetHeader';
import { AREA_WIDTH, geometry, MARGIN_MM, scaleOf, type Row } from './layout';
import type { Settings } from './options';
import type { Writer } from './writer';

const GRID_COLOR = '#93b4d8';
const BASE_COLOR = '#4a74a8';
const PICTURE_COLOR = '#374151';

/** Đường nét của mỗi dòng chữ, dựng một lần rồi dùng lại cho mọi chỗ lặp. */
export type Glyphs = (text: string) => { solid: string; dots: string };

export function useGlyphs(writer: Writer, settings: Settings): Glyphs {
  const scale = scaleOf(settings, writer);
  const { spacing } = pens(settings.size);
  const dotted = settings.style === 'cham';
  return useMemo(() => {
    const cache = new Map<string, { solid: string; dots: string }>();
    return (text) => {
      let paths = cache.get(text);
      if (!paths) {
        const shape = writer.shape(text);
        paths = {
          solid: outlinePath(shape, scale),
          dots: dotted ? writer.dots(shape, scale, spacing) : '',
        };
        cache.set(text, paths);
      }
      return paths;
    };
  }, [writer, scale, spacing, dotted]);
}

function Sample({
  glyphs,
  settings,
  kind,
  x,
  y,
  model,
}: {
  glyphs: ReturnType<Glyphs>;
  settings: Settings;
  kind: Writer['kind'];
  x: number;
  y: number;
  model: boolean;
}) {
  const { color } = settings;
  const sample = model ? 'model' : settings.style;
  const opacity = model ? 1 : 1 - settings.fade / 100;
  const common = { 'data-sample': sample, transform: `translate(${x} ${y})` };

  if (sample === 'cham') {
    return (
      <path
        {...common}
        d={glyphs.dots}
        fill="none"
        stroke={color}
        strokeOpacity={opacity}
        strokeWidth={pens(settings.size).dot}
        strokeLinecap="round"
      />
    );
  }
  if (kind === 'fill') return <path {...common} d={glyphs.solid} fill={color} fillOpacity={opacity} />;
  return (
    <path
      {...common}
      d={glyphs.solid}
      fill="none"
      stroke={color}
      strokeOpacity={opacity}
      strokeWidth={clamp(settings.size * 0.1, 0.45, 0.9)}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

export function WritingPage({
  rows,
  settings,
  writer,
  glyphs,
  studentName,
}: {
  rows: Row[];
  settings: Settings;
  writer: Writer;
  glyphs: Glyphs;
  studentName?: string;
}) {
  const area = geometry(settings, writer);
  const { size } = settings;
  const placed = rows.map((row, i) => {
    const top = i * area.pitch;
    return { ...row, top, base: top + writer.top * size };
  });
  /** Một đường ngang trên mọi dòng, cách đường chân `offset` khoảng dòng (hướng lên). */
  const rule = (offset: number) =>
    placed.map((row) => `M${row.start} ${row.base - offset * size}H${AREA_WIDTH}`).join('');
  const height = rows.length * area.pitch - area.gap;

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
      <div className="relative">
        <svg
          data-lines
          className="block overflow-visible"
          width={`${AREA_WIDTH}mm`}
          height={`${height}mm`}
          viewBox={`0 0 ${AREA_WIDTH} ${height}`}
          role="img"
          aria-label={`Dòng tập viết: ${[...new Set(rows.map((row) => row.text))].join(', ')}`}
        >
          <path
            data-grid
            d={rule(writer.top) + rule(-writer.bottom)}
            fill="none"
            stroke={GRID_COLOR}
            strokeWidth={0.2}
          />
          <path
            data-grid="giua"
            d={rule(1)}
            fill="none"
            stroke={BASE_COLOR}
            strokeWidth={0.2}
            strokeDasharray="1.5 1"
          />
          <path data-grid="chan" d={rule(0)} fill="none" stroke={BASE_COLOR} strokeWidth={0.35} />
          {placed.map((row, i) =>
            row.at.map((x, k) => (
              <Sample
                key={`${i}-${k}`}
                glyphs={glyphs(row.text)}
                settings={settings}
                kind={writer.kind}
                x={x}
                y={row.base}
                model={k === 0 && row.model}
              />
            )),
          )}
        </svg>
        {placed.map(
          ({ picture: Picture, top, text }, i) =>
            Picture && (
              <Picture
                key={i}
                data-picture={text}
                aria-hidden
                className="absolute left-0"
                color={PICTURE_COLOR}
                strokeWidth={1.4}
                style={{
                  top: `${top + (area.ruled - area.picture) / 2}mm`,
                  width: `${area.picture}mm`,
                  height: `${area.picture}mm`,
                }}
              />
            ),
        )}
      </div>
    </A4Page>
  );
}
