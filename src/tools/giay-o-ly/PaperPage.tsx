import { useEffect, useState } from 'react';
import { rotateImage, type RotatedImage } from '@/core/image';
import { A4Page } from '@/core/print/A4Page';
import { SheetHeader } from '@/core/print/SheetHeader';
import { placeLogo, type Options, type Resolved } from './options';
import { toPaths, type Drawing, type Stroke } from './pen';

/** Bề rộng nét (mm) và hệ số đậm so với độ đậm giáo viên chọn. */
const STROKES: Record<Stroke, { width: number; strength: number }> = {
  faint: { width: 0.08, strength: 0.8 },
  minor: { width: 0.15, strength: 1 },
  major: { width: 0.35, strength: 1.5 },
  margin: { width: 0.4, strength: 1.8 },
  dot: { width: 0.6, strength: 1.8 },
};
const MARGIN_RED = '#dc2626';

/** Logo đã xoay sẵn; null khi chưa có hoặc đang xử lý. */
export function useLogo(source: string, degrees: number) {
  const [logo, setLogo] = useState<RotatedImage | null>(null);
  useEffect(() => {
    if (!source) {
      setLogo(null);
      return;
    }
    let current = true;
    rotateImage(source, degrees)
      .then((result) => current && setLogo(result))
      .catch(() => current && setLogo(null));
    return () => {
      current = false;
    };
  }, [source, degrees]);
  return logo;
}

export function PaperPage({
  drawing,
  settings,
  options,
  logo,
}: {
  drawing: Drawing;
  settings: Resolved;
  options: Options;
  logo: RotatedImage | null;
}) {
  const { width, height, margin, header, color, opacity } = settings;
  const watermark = options.watermark.trim();
  // Chữ chìm nằm chéo, cỡ chữ vừa đường chéo trang.
  const watermarkSize = Math.min(
    width / 6,
    Math.hypot(width, height) / Math.max(1, watermark.length * 0.75),
  );
  const logoWidth = Math.min(options.logoSize, width) * (logo?.widthRatio ?? 1);
  const logoHeight = Math.min(options.logoSize, width) * (logo?.heightRatio ?? 1);

  return (
    <A4Page margin={0}>
      <svg
        className="block"
        width={`${width}mm`}
        height={`${height}mm`}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden
      >
        {toPaths(drawing.segments).map(({ stroke, dashed, d }) => (
          <path
            key={`${stroke}-${dashed}`}
            data-stroke={stroke}
            d={d}
            fill="none"
            stroke={stroke === 'margin' ? MARGIN_RED : color}
            strokeWidth={STROKES[stroke].width}
            strokeOpacity={Math.min(1, opacity * STROKES[stroke].strength)}
            strokeDasharray={dashed ? '1 1' : undefined}
            strokeLinecap={stroke === 'dot' ? 'round' : 'butt'}
          />
        ))}
        {drawing.labels.map((label, i) => (
          <text
            key={i}
            x={label.x}
            y={label.y}
            fontSize={label.size}
            fontWeight={label.bold ? 700 : 400}
            fill="#374151"
          >
            {label.text}
          </text>
        ))}
        {watermark && (
          <text
            x={width / 2}
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-35 ${width / 2} ${height / 2})`}
            fontSize={watermarkSize}
            fontWeight={700}
            fill="#000"
            fillOpacity={0.1}
          >
            {watermark}
          </text>
        )}
      </svg>
      {header > 0 && (
        <div
          data-paper-header
          className="absolute break-words"
          style={{
            left: `${margin}mm`,
            top: `${margin}mm`,
            width: `${width - 2 * margin}mm`,
          }}
        >
          <SheetHeader
            title={options.title.trim()}
            school={options.school.trim()}
            showNameLine={options.showNameLine}
          />
        </div>
      )}
      {logo && (
        <img
          alt=""
          src={logo.url}
          className="absolute max-w-none"
          style={(() => {
            const { left, top } = placeLogo(
              options.logoPosition,
              { width: logoWidth, height: logoHeight },
              { width, height },
              margin,
            );
            return {
              left: `${left}mm`,
              top: `${top}mm`,
              width: `${logoWidth}mm`,
              height: `${logoHeight}mm`,
              opacity: options.logoOpacity / 100,
            };
          })()}
        />
      )}
    </A4Page>
  );
}
