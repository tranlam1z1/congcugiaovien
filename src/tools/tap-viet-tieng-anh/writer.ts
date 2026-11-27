/** Hai kiểu chữ dùng chung một cách đo và vẽ. */
import {
  dotsPath,
  X_HEIGHT,
  type Handwriting,
  type Shape,
} from '@/core/handwriting/cursive';
import { missingPrint, printShape, strokeDots } from './printFont';

export type Writer = {
  /** `stroke`: đường một nét, vẽ bằng viền. `fill`: đường viền của chữ, tô đặc. */
  kind: 'stroke' | 'fill';
  /** Số đơn vị của đường nét trên một khoảng dòng. */
  unit: number;
  /** Dòng kẻ trên cùng và dưới cùng cách đường chân bao nhiêu khoảng (đường giữa luôn là 1). */
  top: number;
  bottom: number;
  shape: (text: string) => Shape;
  dots: (shape: Shape, scale: number, spacingMm: number) => string;
  missing: (text: string) => string[];
};

const round = (value: number) => Math.round(value * 100) / 100;

export const printWriter: Writer = {
  kind: 'stroke',
  unit: 100,
  top: 2,
  bottom: 1,
  shape: printShape,
  dots: (shape, scale, spacingMm) =>
    strokeDots(shape.commands, spacingMm / scale)
      .map(([x, y]) => `M${round((x - shape.minX) * scale)} ${round(-y * scale)}h0.01`)
      .join(''),
  missing: missingPrint,
};

/** Chữ nối nét có nét khuyết dài hơn nên dòng kẻ trên và dưới đặt xa hơn. */
export const cursiveWriter = (font: Handwriting): Writer => ({
  kind: 'fill',
  unit: X_HEIGHT,
  top: 2.55,
  bottom: 1.55,
  shape: font.shape,
  dots: dotsPath,
  missing: font.missing,
});
