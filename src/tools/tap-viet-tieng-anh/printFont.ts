/**
 * Bộ chữ in một nét tự vẽ cho giấy 4 dòng kẻ: chữ thường cao một khoảng, chữ hoa, chữ số và
 * nét khuyết cao hai khoảng, nét xuống sâu một khoảng.
 *
 * Đơn vị: một khoảng dòng = 100, trục y hướng lên, đường chân ở y = 0. Thứ tự và chiều của
 * nét theo cách dạy viết thường gặp, nên chấm đầu tiên là chỗ đặt bút.
 */
import { flatten, type Command, type Shape } from '@/core/handwriting/cursive';

type Point = [number, number];

/** Một lần đặt bút. */
class Stroke {
  readonly commands: Command[];
  private at: Point;

  constructor(x: number, y: number) {
    this.at = [x, y];
    this.commands = [{ type: 'M', to: this.at }];
  }

  to(x: number, y: number) {
    this.at = [x, y];
    this.commands.push({ type: 'L', to: this.at });
    return this;
  }

  curve(x1: number, y1: number, x2: number, y2: number, x: number, y: number) {
    this.at = [x, y];
    this.commands.push({ type: 'C', c1: [x1, y1], c2: [x2, y2], to: this.at });
    return this;
  }

  /** Cung elip từ góc `from` tới `to` (độ, ngược chiều kim đồng hồ là tăng). */
  arc(cx: number, cy: number, rx: number, ry: number, from: number, to: number) {
    const parts = Math.max(1, Math.ceil(Math.abs(to - from) / 90));
    const step = ((to - from) * Math.PI) / 180 / parts;
    const k = (4 / 3) * Math.tan(step / 4);
    let angle = (from * Math.PI) / 180;
    const point = (a: number): Point => [cx + rx * Math.cos(a), cy + ry * Math.sin(a)];
    const start = point(angle);
    if (Math.hypot(start[0] - this.at[0], start[1] - this.at[1]) > 0.5) this.to(...start);
    for (let i = 0; i < parts; i++) {
      const next = angle + step;
      const [ax, ay] = point(angle);
      const [bx, by] = point(next);
      this.curve(
        ax - k * rx * Math.sin(angle),
        ay + k * ry * Math.cos(angle),
        bx + k * rx * Math.sin(next),
        by - k * ry * Math.cos(next),
        bx,
        by,
      );
      angle = next;
    }
    return this;
  }
}

const rad = Math.PI / 180;

/** Cung bắt đầu ngay tại điểm đầu của nó. */
const arc = (cx: number, cy: number, rx: number, ry: number, from: number, to: number) =>
  new Stroke(cx + rx * Math.cos(from * rad), cy + ry * Math.sin(from * rad)).arc(
    cx, cy, rx, ry, from, to,
  );

/** Đường gấp khúc qua các điểm. */
const line = (...points: number[]) => {
  const stroke = new Stroke(points[0]!, points[1]!);
  for (let i = 2; i < points.length; i += 2) stroke.to(points[i]!, points[i + 1]!);
  return stroke;
};

/** Chấm (dấu i, dấu câu). */
const dot = (x: number, y: number) => line(x, y, x, y + 1);

/** Thân tròn của a, d, g, q: bắt đầu phía trên bên phải, đi ngược chiều kim đồng hồ. */
const bowlLeft = () => arc(40, 50, 40, 50, 45, 405);
/** Bụng của b, p: từ nét sổ vòng sang phải theo chiều kim đồng hồ. */
const bowlRight = () => arc(40, 50, 40, 50, 180, -180);
/** Móc vòm của h, m, n: từ nét sổ đi lên, vòng sang phải rồi kéo xuống. */
const arch = (left: number, width: number) =>
  line(left, 60)
    .arc(left + width / 2, 60, width / 2, 40, 180, 0)
    .to(left + width, 0);

type Glyph = { width: number; strokes: Stroke[] };

const g = (width: number, ...strokes: Stroke[]): Glyph => ({ width, strokes });

const period = () => dot(0, 0);
const comma = (top: number) => new Stroke(8, top + 4).curve(9, top - 6, 6, top - 16, 0, top - 24);

const GLYPHS: Record<string, Glyph> = {
  a: g(80, bowlLeft(), line(80, 100, 80, 0)),
  b: g(80, line(0, 200, 0, 0), bowlRight()),
  c: g(69, arc(40, 50, 40, 50, 45, 315)),
  d: g(80, bowlLeft(), line(80, 200, 80, 0)),
  e: g(80, line(0, 50, 80, 50).arc(40, 50, 40, 50, 0, 320)),
  f: g(66, arc(46, 168, 26, 32, 40, 180).to(20, 0), line(0, 100, 50, 100)),
  g: g(80, bowlLeft(), line(80, 100, 80, -60).arc(44, -60, 36, 40, 0, -150)),
  h: g(75, line(0, 200, 0, 0), arch(0, 75)),
  i: g(1, line(0, 100, 0, 0), dot(0, 140)),
  j: g(48, line(48, 100, 48, -60).arc(24, -60, 24, 40, 0, -160), dot(48, 140)),
  k: g(70, line(0, 200, 0, 0), line(64, 100, 0, 40), line(22, 61, 70, 0)),
  l: g(1, line(0, 200, 0, 0)),
  m: g(124, line(0, 100, 0, 0), arch(0, 62), arch(62, 62)),
  n: g(75, line(0, 100, 0, 0), arch(0, 75)),
  o: g(80, arc(40, 50, 40, 50, 90, 450)),
  p: g(80, line(0, 100, 0, -100), bowlRight()),
  q: g(96, bowlLeft(), line(80, 100, 80, -100, 96, -80)),
  r: g(66, line(0, 100, 0, 0), line(0, 60).arc(38, 60, 38, 40, 180, 45)),
  s: g(
    66,
    new Stroke(61, 84)
      .curve(54, 95, 44, 100, 33, 100)
      .curve(14, 100, 3, 90, 3, 76)
      .curve(3, 62, 15, 56, 34, 51)
      .curve(55, 46, 66, 38, 66, 25)
      .curve(66, 10, 52, 0, 33, 0)
      .curve(19, 0, 8, 5, 0, 15),
  ),
  t: g(52, line(24, 168, 24, 0), line(0, 100, 52, 100)),
  u: g(75, line(0, 100, 0, 40).arc(37.5, 40, 37.5, 40, 180, 360).to(75, 100), line(75, 100, 75, 0)),
  v: g(76, line(0, 100, 38, 0, 76, 100)),
  w: g(116, line(0, 100, 29, 0, 58, 90, 87, 0, 116, 100)),
  x: g(70, line(0, 100, 70, 0), line(70, 100, 0, 0)),
  y: g(80, line(0, 100, 40, 0), line(80, 100, 0, -100)),
  z: g(70, line(0, 100, 70, 100, 0, 0, 70, 0)),

  A: g(120, line(60, 200, 0, 0), line(60, 200, 120, 0), line(24, 80, 96, 80)),
  B: g(
    104,
    line(0, 200, 0, 0),
    line(0, 200, 46, 200).arc(46, 150, 48, 50, 90, -90).to(0, 100),
    line(0, 100, 52, 100).arc(52, 50, 52, 50, 90, -90).to(0, 0),
  ),
  C: g(128, arc(75, 100, 75, 100, 45, 315)),
  D: g(120, line(0, 200, 0, 0), line(0, 200, 30, 200).arc(30, 100, 90, 100, 90, -90).to(0, 0)),
  E: g(92, line(0, 200, 0, 0), line(0, 200, 92, 200), line(0, 100, 76, 100), line(0, 0, 92, 0)),
  F: g(92, line(0, 200, 0, 0), line(0, 200, 92, 200), line(0, 100, 76, 100)),
  G: g(150, arc(75, 100, 75, 100, 45, 360).to(88, 100)),
  H: g(110, line(0, 200, 0, 0), line(110, 200, 110, 0), line(0, 100, 110, 100)),
  I: g(60, line(30, 200, 30, 0), line(0, 200, 60, 200), line(0, 0, 60, 0)),
  J: g(76, line(76, 200, 76, 55).arc(38, 55, 38, 55, 0, -180)),
  K: g(106, line(0, 200, 0, 0), line(100, 200, 0, 80), line(35, 122, 106, 0)),
  L: g(86, line(0, 200, 0, 0, 86, 0)),
  M: g(132, line(0, 200, 0, 0), line(0, 200, 66, 60, 132, 200, 132, 0)),
  N: g(110, line(0, 200, 0, 0), line(0, 200, 110, 0, 110, 200)),
  O: g(150, arc(75, 100, 75, 100, 90, 450)),
  P: g(102, line(0, 200, 0, 0), line(0, 200, 48, 200).arc(48, 146, 54, 54, 90, -90).to(0, 92)),
  Q: g(154, arc(75, 100, 75, 100, 90, 450), line(92, 58, 154, 0)),
  R: g(
    105,
    line(0, 200, 0, 0),
    line(0, 200, 48, 200).arc(48, 146, 54, 54, 90, -90).to(0, 92),
    line(48, 92, 105, 0),
  ),
  S: g(
    100,
    new Stroke(92, 170)
      .curve(82, 190, 68, 200, 50, 200)
      .curve(22, 200, 5, 180, 5, 152)
      .curve(5, 124, 24, 112, 52, 102)
      .curve(84, 92, 100, 76, 100, 50)
      .curve(100, 20, 78, 0, 50, 0)
      .curve(28, 0, 11, 11, 0, 30),
  ),
  T: g(112, line(56, 200, 56, 0), line(0, 200, 112, 200)),
  U: g(110, line(0, 200, 0, 65).arc(55, 65, 55, 65, 180, 360).to(110, 200)),
  V: g(120, line(0, 200, 60, 0, 120, 200)),
  W: g(172, line(0, 200, 43, 0, 86, 180, 129, 0, 172, 200)),
  X: g(106, line(0, 200, 106, 0), line(106, 200, 0, 0)),
  Y: g(112, line(0, 200, 56, 100), line(112, 200, 56, 100, 56, 0)),
  Z: g(106, line(0, 200, 106, 200, 0, 0, 106, 0)),

  '0': g(110, arc(55, 100, 55, 100, 90, 450)),
  '1': g(40, line(0, 158, 40, 200, 40, 0)),
  '2': g(
    100,
    new Stroke(5, 150)
      .curve(6, 180, 26, 200, 52, 200)
      .curve(80, 200, 97, 180, 97, 152)
      .curve(97, 112, 56, 70, 0, 0)
      .to(100, 0),
  ),
  '3': g(
    100,
    new Stroke(8, 170)
      .curve(18, 190, 32, 200, 50, 200)
      .curve(76, 200, 92, 180, 92, 155)
      .curve(92, 125, 68, 106, 38, 106)
      .curve(74, 106, 100, 84, 100, 52)
      .curve(100, 20, 76, 0, 48, 0)
      .curve(26, 0, 9, 11, 0, 32),
  ),
  '4': g(110, line(78, 200, 0, 60, 110, 60), line(78, 200, 78, 0)),
  '5': g(
    100,
    line(12, 200, 6, 114)
      .curve(20, 126, 35, 132, 52, 132)
      .curve(82, 132, 100, 104, 100, 68)
      .curve(100, 28, 76, 0, 46, 0)
      .curve(25, 0, 10, 9, 0, 28),
    line(12, 200, 90, 200),
  ),
  '6': g(
    102,
    new Stroke(86, 190)
      .curve(76, 197, 66, 200, 56, 200)
      .curve(20, 200, 0, 140, 0, 70)
      .curve(0, 26, 22, 0, 52, 0)
      .curve(81, 0, 102, 28, 102, 64)
      .curve(102, 100, 80, 126, 52, 126)
      .curve(24, 126, 2, 102, 0, 70),
  ),
  '7': g(100, line(0, 200, 100, 200, 34, 0)),
  '8': g(100, arc(50, 152, 42, 48, 90, 450), arc(50, 52, 50, 52, 90, 450)),
  '9': g(100, arc(50, 142, 50, 58, 0, 360), line(100, 142, 100, 0)),

  '.': g(1, period()),
  ',': g(9, comma(0)),
  '!': g(1, line(0, 200, 0, 52), period()),
  '?': g(
    80,
    new Stroke(0, 160)
      .curve(0, 184, 18, 200, 40, 200)
      .curve(64, 200, 80, 184, 80, 160)
      .curve(80, 128, 40, 120, 40, 86)
      .to(40, 54),
    dot(40, 0),
  ),
  "'": g(1, line(0, 200, 0, 158)),
  '"': g(24, line(0, 200, 0, 158), line(24, 200, 24, 158)),
  '-': g(44, line(0, 60, 44, 60)),
  ':': g(1, dot(0, 80), period()),
  ';': g(9, dot(6, 80), comma(0)),
  '(': g(32, new Stroke(32, 205).curve(-11, 140, -11, 20, 32, -45)),
  ')': g(32, new Stroke(0, 205).curve(43, 140, 43, 20, 0, -45)),
  '/': g(70, line(70, 205, 0, -20)),
  '+': g(70, line(0, 70, 70, 70), line(35, 105, 35, 35)),
  '=': g(70, line(0, 90, 70, 90), line(0, 50, 70, 50)),
};

/** Ký tự gõ từ Word được đổi về ký tự có trong bộ chữ. */
const ALIASES: Record<string, string> = {
  '’': "'",
  '‘': "'",
  '“': '"',
  '”': '"',
  '–': '-',
  '—': '-',
};

/** Khoảng cách giữa hai chữ và bề rộng dấu cách. */
const TRACKING = 30;
const SPACE = 56;

const glyphOf = (char: string) => GLYPHS[ALIASES[char] ?? char];

export const missingPrint = (text: string) => [
  ...new Set([...text.normalize('NFC')].filter((c) => !/\s/.test(c) && !glyphOf(c))),
];

const shift = (command: Command, dx: number): Command => {
  const move = ([x, y]: Point): Point => [x + dx, y];
  switch (command.type) {
    case 'Z':
      return command;
    case 'C':
      return { type: 'C', c1: move(command.c1), c2: move(command.c2), to: move(command.to) };
    case 'Q':
      return { type: 'Q', c: move(command.c), to: move(command.to) };
    default:
      return { type: command.type, to: move(command.to) };
  }
};

/**
 * Cả cụm chữ: các nét nối tiếp nhau, mép trái ở x = 0. `rise`, `drop` tính theo khoảng dòng.
 * Cùng dạng `Shape` của chữ viết tay nên dùng chung hàm vẽ đường nét.
 */
export function printShape(text: string): Shape {
  const commands: Command[] = [];
  let pen = 0;
  let end = 0;
  for (const char of text.normalize('NFC')) {
    if (/\s/.test(char)) {
      pen += SPACE;
      continue;
    }
    const glyph = glyphOf(char);
    if (!glyph) continue;
    for (const stroke of glyph.strokes) {
      for (const command of stroke.commands) commands.push(shift(command, pen));
    }
    end = pen + glyph.width;
    pen = end + TRACKING;
  }
  let maxY = 0;
  let minY = 0;
  for (const contour of flatten(commands)) {
    for (const [, y] of contour) {
      maxY = Math.max(maxY, y);
      minY = Math.min(minY, y);
    }
  }
  return { commands, minX: 0, maxX: end, rise: maxY / 100, drop: -minY / 100 };
}

/**
 * Chấm rải đều dọc từng nét, luôn có chấm ở đầu và cuối nét. Chấm quá gần chấm đã có
 * (chỗ hai nét chạm hoặc trùng nhau) thì bỏ.
 */
export function strokeDots(commands: Command[], spacing: number): Point[] {
  const dots: Point[] = [];
  const add = ([x, y]: Point) => {
    if (dots.every(([a, b]) => Math.hypot(a - x, b - y) >= spacing * 0.6)) dots.push([x, y]);
  };
  for (const points of flatten(commands, 16)) {
    const lengths = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i]![0], p[1] - points[i]![1]));
    const total = lengths.reduce((sum, l) => sum + l, 0);
    const count = Math.max(1, Math.round(total / spacing));
    let segment = 0;
    let before = 0;
    for (let k = 0; k <= count; k++) {
      const distance = (total * k) / count;
      while (segment < lengths.length - 1 && before + lengths[segment]! < distance) {
        before += lengths[segment]!;
        segment++;
      }
      const t = lengths[segment] ? (distance - before) / lengths[segment]! : 0;
      const [ax, ay] = points[segment]!;
      const [bx, by] = points[segment + 1]!;
      add([ax + (bx - ax) * t, ay + (by - ay) * t]);
    }
  }
  return dots;
}
