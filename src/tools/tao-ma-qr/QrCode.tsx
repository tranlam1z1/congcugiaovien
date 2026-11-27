import { LOGO_SHARE, matrixPath, QUIET, type Matrix } from './qr';

export type Look = { foreground: string; background: string; logo: string };

/** Mã QR vẽ bằng SVG; logo đè giữa trên nền trắng. Kích thước theo mm. */
export function QrCode({ matrix, size, look }: { matrix: Matrix; size: number; look: Look }) {
  const modules = matrix.size + 2 * QUIET;
  const logoSide = size * LOGO_SHARE;
  const inner = logoSide * 0.85;
  return (
    <div className="relative shrink-0" style={{ width: `${size}mm`, height: `${size}mm` }}>
      <svg
        className="block"
        width={`${size}mm`}
        height={`${size}mm`}
        viewBox={`0 0 ${modules} ${modules}`}
        shapeRendering="crispEdges"
        role="img"
        aria-label="Mã QR"
      >
        <rect width={modules} height={modules} fill={look.background} />
        <path d={matrixPath(matrix)} fill={look.foreground} />
      </svg>
      {look.logo && (
        <div
          className="absolute flex items-center justify-center rounded-[1mm] bg-white"
          style={{
            left: `${(size - logoSide) / 2}mm`,
            top: `${(size - logoSide) / 2}mm`,
            width: `${logoSide}mm`,
            height: `${logoSide}mm`,
          }}
        >
          <img
            alt=""
            src={look.logo}
            className="object-contain"
            style={{ width: `${inner}mm`, height: `${inner}mm` }}
          />
        </div>
      )}
    </div>
  );
}
