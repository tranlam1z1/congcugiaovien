/**
 * Dựng chữ viết tay thành đường nét lấy thẳng từ file font, để xem trước, bản in và PDF
 * giống hệt nhau và vẽ được kiểu nét chấm, viền rỗng.
 *
 * Đơn vị trong file này là đơn vị font (trục y hướng lên), trừ khi tên biến ghi khác.
 * HP001: khi có file và giấy phép thì chỉ cần đổi file font cùng `X_HEIGHT`, `STEM`.
 */
import fontkit from '@pdf-lib/fontkit';

/** Chiều cao chữ thường (a, o, n) của Playwrite VN: đúng một "đơn vị" cỡ chữ. */
export const X_HEIGHT = 500;
/** Bề dày nét của bản Regular, dùng để tìm đường giữa nét cho kiểu nét chấm. */
export const STEM = 76;

export type Command =
  | { type: 'M'; to: [number, number] }
  | { type: 'L'; to: [number, number] }
  | { type: 'Q'; c: [number, number]; to: [number, number] }
  | { type: 'C'; c1: [number, number]; c2: [number, number]; to: [number, number] }
  | { type: 'Z' };

export type Shape = {
  commands: Command[];
  /** Mép trái và phải của nét mực. */
  minX: number;
  maxX: number;
  /** Phần cao trên đường chân và phần thò xuống dưới, tính theo chiều cao chữ thường. */
  rise: number;
  drop: number;
};

export type Handwriting = {
  shape: (text: string) => Shape;
  /** Các ký tự font không viết được. */
  missing: (text: string) => string[];
};

type RawCommand = { command: string; args: number[] };

function toCommand({ command, args: a }: RawCommand, dx: number, dy: number): Command {
  const at = (i: number): [number, number] => [a[i]! + dx, a[i + 1]! + dy];
  switch (command) {
    case 'moveTo':
      return { type: 'M', to: at(0) };
    case 'lineTo':
      return { type: 'L', to: at(0) };
    case 'quadraticCurveTo':
      return { type: 'Q', c: at(0), to: at(2) };
    case 'bezierCurveTo':
      return { type: 'C', c1: at(0), c2: at(2), to: at(4) };
    default:
      return { type: 'Z' };
  }
}

export function createHandwriting(data: Uint8Array): Handwriting {
  const font = fontkit.create(data);
  const cache = new Map<string, Shape>();

  const build = (text: string): Shape => {
    // Giữ nguyên tính năng mặc định của font: `calt` nối nét, `mark` đặt dấu.
    const run = font.layout(text);
    const commands: Command[] = [];
    let pen = 0;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = 0;
    let maxY = 0;
    run.glyphs.forEach((glyph, i) => {
      const position = run.positions[i]!;
      const dx = pen + position.xOffset;
      const dy = position.yOffset;
      const path = glyph.path as unknown as { commands: RawCommand[] };
      if (glyph.id !== 0 && path.commands.length > 0) {
        for (const raw of path.commands) commands.push(toCommand(raw, dx, dy));
        const box = glyph.bbox;
        minX = Math.min(minX, box.minX + dx);
        maxX = Math.max(maxX, box.maxX + dx);
        minY = Math.min(minY, box.minY + dy);
        maxY = Math.max(maxY, box.maxY + dy);
      }
      pen += position.xAdvance;
    });
    if (commands.length === 0) return { commands, minX: 0, maxX: 0, rise: 0, drop: 0 };
    return { commands, minX, maxX, rise: maxY / X_HEIGHT, drop: -minY / X_HEIGHT };
  };

  return {
    shape(text) {
      let shape = cache.get(text);
      if (!shape) {
        shape = build(text);
        // Gõ tới đâu dựng tới đó nên bộ nhớ đệm cần có giới hạn.
        if (cache.size > 2000) cache.clear();
        cache.set(text, shape);
      }
      return shape;
    },
    missing(text) {
      const found = new Set<string>();
      for (const char of text.normalize('NFC')) {
        if (/\s/.test(char)) continue;
        if (!font.hasGlyphForCodePoint(char.codePointAt(0)!)) found.add(char);
      }
      return [...found];
    },
  };
}

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * Đường nét SVG theo mm: mép trái của chữ ở x = 0, đường chân ở y = 0 (trục y hướng xuống).
 * `scale` là số mm trên một đơn vị font.
 */
export function outlinePath({ commands, minX }: Shape, scale: number): string {
  const point = ([x, y]: [number, number]) => `${round((x - minX) * scale)} ${round(-y * scale)}`;
  return commands
    .map((c) => {
      if (c.type === 'Z') return 'Z';
      if (c.type === 'Q') return `Q${point(c.c)} ${point(c.to)}`;
      if (c.type === 'C') return `C${point(c.c1)} ${point(c.c2)} ${point(c.to)}`;
      return `${c.type}${point(c.to)}`;
    })
    .join('');
}

type Point = [number, number];

/** Chia đường cong thành các đoạn thẳng, mỗi đường viền khép kín là một dãy điểm. */
export function flatten(commands: Command[], steps = 8): Point[][] {
  const contours: Point[][] = [];
  let current: Point[] = [];
  const finish = () => {
    if (current.length > 1) contours.push(current);
    current = [];
  };
  for (const command of commands) {
    if (command.type === 'Z') {
      if (current.length > 1) current.push(current[0]!);
      finish();
      continue;
    }
    if (command.type === 'M' || command.type === 'L') {
      if (command.type === 'M') finish();
      current.push(command.to);
      continue;
    }
    const from = current[current.length - 1]!;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const u = 1 - t;
      const at = (axis: 0 | 1) =>
        command.type === 'Q'
          ? u * u * from[axis] + 2 * u * t * command.c[axis] + t * t * command.to[axis]
          : u * u * u * from[axis] +
            3 * u * u * t * command.c1[axis] +
            3 * u * t * t * command.c2[axis] +
            t * t * t * command.to[axis];
      current.push([at(0), at(1)]);
    }
  }
  finish();
  return contours;
}

/**
 * Các chấm nằm dọc giữa nét, cách nhau ít nhất `spacing`.
 * Font nét đều và viền ngoài chạy theo chiều kim đồng hồ (TrueType) nên lòng nét luôn ở
 * bên phải hướng đi: lùi vào nửa bề dày nét là tới đường giữa. Hai mép của một nét cho ra
 * gần cùng một đường, điểm trùng bị bỏ.
 */
export function centreDots(commands: Command[], spacing: number, inset = STEM / 2): Point[] {
  const dots: Point[] = [];
  const cells = new Map<string, Point[]>();
  const tooClose = ([x, y]: Point) => {
    const column = Math.floor(x / spacing);
    const row = Math.floor(y / spacing);
    for (let i = column - 1; i <= column + 1; i++) {
      for (let j = row - 1; j <= row + 1; j++) {
        if (cells.get(`${i},${j}`)?.some(([a, b]) => Math.hypot(a - x, b - y) < spacing)) {
          return true;
        }
      }
    }
    return false;
  };
  const add = (point: Point) => {
    if (tooClose(point)) return;
    const key = `${Math.floor(point[0] / spacing)},${Math.floor(point[1] / spacing)}`;
    const cell = cells.get(key);
    if (cell) cell.push(point);
    else cells.set(key, [point]);
    dots.push(point);
  };

  const step = spacing / 8;
  for (const contour of flatten(commands)) {
    for (let i = 1; i < contour.length; i++) {
      const [ax, ay] = contour[i - 1]!;
      const [bx, by] = contour[i]!;
      const length = Math.hypot(bx - ax, by - ay);
      if (length === 0) continue;
      const nx = (by - ay) / length;
      const ny = -(bx - ax) / length;
      const parts = Math.ceil(length / step);
      for (let k = 0; k < parts; k++) {
        const t = k / parts;
        add([ax + (bx - ax) * t + nx * inset, ay + (by - ay) * t + ny * inset]);
      }
    }
  }
  return dots;
}

/** Đường SVG gồm các đoạn dài 0: nét đầu tròn vẽ thành chấm. Cùng hệ tọa độ `outlinePath`. */
export function dotsPath(shape: Shape, scale: number, spacingMm: number): string {
  return centreDots(shape.commands, spacingMm / scale)
    .map(([x, y]) => `M${round((x - shape.minX) * scale)} ${round(-y * scale)}h0.01`)
    .join('');
}
