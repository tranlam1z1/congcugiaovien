/** "Bút vẽ" cho giấy in: gom đoạn thẳng và chữ theo đơn vị mm. */

export type Stroke = 'faint' | 'minor' | 'major' | 'margin' | 'dot';

export type Segment = {
  stroke: Stroke;
  dashed: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type Label = { x: number; y: number; text: string; size: number; bold: boolean };

export type Area = { x: number; y: number; width: number; height: number };

export type Drawing = { segments: Segment[]; labels: Label[] };

const EPSILON = 1e-6;

/** Số ô nguyên vừa một chiều dài. */
export const fit = (length: number, size: number) =>
  Math.max(0, Math.floor(length / size + EPSILON));

export class Pen {
  readonly drawing: Drawing = { segments: [], labels: [] };

  line(x1: number, y1: number, x2: number, y2: number, stroke: Stroke = 'minor', dashed = false) {
    this.drawing.segments.push({ stroke, dashed, x1, y1, x2, y2 });
  }

  horizontal(x: number, y: number, width: number, stroke?: Stroke, dashed?: boolean) {
    this.line(x, y, x + width, y, stroke, dashed);
  }

  vertical(x: number, y: number, height: number, stroke?: Stroke, dashed?: boolean) {
    this.line(x, y, x, y + height, stroke, dashed);
  }

  rect(x: number, y: number, width: number, height: number, stroke?: Stroke, dashed?: boolean) {
    this.horizontal(x, y, width, stroke, dashed);
    this.horizontal(x, y + height, width, stroke, dashed);
    this.vertical(x, y, height, stroke, dashed);
    this.vertical(x + width, y, height, stroke, dashed);
  }

  /** Chấm tròn: đoạn rất ngắn với đầu nét tròn. */
  dot(x: number, y: number) {
    this.line(x, y, x + 0.01, y, 'dot');
  }

  text(x: number, y: number, text: string, size = 4, bold = false) {
    this.drawing.labels.push({ x, y, text, size, bold });
  }

  /** Vẽ đoạn thẳng, chỉ giữ phần nằm trong khung (Liang–Barsky). */
  clipped(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    area: Area,
    stroke?: Stroke,
    dashed?: boolean,
  ) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    let t0 = 0;
    let t1 = 1;
    const edges: [number, number][] = [
      [-dx, x1 - area.x],
      [dx, area.x + area.width - x1],
      [-dy, y1 - area.y],
      [dy, area.y + area.height - y1],
    ];
    for (const [p, q] of edges) {
      if (Math.abs(p) < EPSILON) {
        if (q < -EPSILON) return;
        continue;
      }
      const t = q / p;
      if (p < 0) t0 = Math.max(t0, t);
      else t1 = Math.min(t1, t);
    }
    if (t1 - t0 <= EPSILON) return;
    this.line(x1 + t0 * dx, y1 + t0 * dy, x1 + t1 * dx, y1 + t1 * dy, stroke, dashed);
  }
}

const num = (value: number) => String(Math.round(value * 1000) / 1000);

/** Gom các đoạn cùng kiểu nét thành một path cho gọn DOM và PDF. */
export function toPaths(segments: Segment[]) {
  const paths = new Map<string, { stroke: Stroke; dashed: boolean; d: string[] }>();
  for (const { stroke, dashed, x1, y1, x2, y2 } of segments) {
    const key = `${stroke}-${dashed}`;
    let path = paths.get(key);
    if (!path) {
      path = { stroke, dashed, d: [] };
      paths.set(key, path);
    }
    path.d.push(`M${num(x1)} ${num(y1)}L${num(x2)} ${num(y2)}`);
  }
  return [...paths.values()].map(({ d, ...rest }) => ({ ...rest, d: d.join('') }));
}
