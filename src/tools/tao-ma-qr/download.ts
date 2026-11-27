/** Tải một mã QR thành file SVG hoặc PNG. */
import { loadImage } from '@/core/image';
import { LOGO_SHARE, matrixPath, QUIET, type Matrix } from './qr';
import type { Look } from './QrCode';

const PIXELS = 1024;

function save(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function geometry(matrix: Matrix) {
  const modules = matrix.size + 2 * QUIET;
  const side = modules * LOGO_SHARE;
  return { modules, side, inner: side * 0.85 };
}

export function toSvg(matrix: Matrix, { foreground, background, logo }: Look) {
  const { modules, side, inner } = geometry(matrix);
  const at = (length: number) => (modules - length) / 2;
  const image = logo
    ? `<rect x="${at(side)}" y="${at(side)}" width="${side}" height="${side}" rx="0.8" fill="#fff"/>` +
      `<image href="${logo}" x="${at(inner)}" y="${at(inner)}" width="${inner}" height="${inner}" preserveAspectRatio="xMidYMid meet"/>`
    : '';
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${PIXELS}" height="${PIXELS}" viewBox="0 0 ${modules} ${modules}">` +
    `<rect width="${modules}" height="${modules}" fill="${background}"/>` +
    `<path d="${matrixPath(matrix)}" fill="${foreground}" shape-rendering="crispEdges"/>` +
    `${image}</svg>`
  );
}

export const downloadSvg = (matrix: Matrix, look: Look, name: string) =>
  save(new Blob([toSvg(matrix, look)], { type: 'image/svg+xml' }), `${name}.svg`);

export async function downloadPng(matrix: Matrix, look: Look, name: string) {
  const { modules, side, inner } = geometry(matrix);
  // Mỗi ô là số pixel nguyên để cạnh không bị nhòe.
  const scale = Math.ceil(PIXELS / modules);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = modules * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.fillStyle = look.background;
  ctx.fillRect(0, 0, modules, modules);
  ctx.fillStyle = look.foreground;
  ctx.fill(new Path2D(matrixPath(matrix)));
  if (look.logo) {
    const image = await loadImage(look.logo);
    ctx.fillStyle = '#fff';
    ctx.fillRect((modules - side) / 2, (modules - side) / 2, side, side);
    const fit = Math.min(inner / image.naturalWidth, inner / image.naturalHeight);
    const width = image.naturalWidth * fit;
    const height = image.naturalHeight * fit;
    ctx.drawImage(image, (modules - width) / 2, (modules - height) / 2, width, height);
  }
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Không tạo được ảnh');
  save(blob, `${name}.png`);
}
