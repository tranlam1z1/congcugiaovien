/** Mỗi loại giấy là một hàm vẽ riêng (PRD 4.4). Thêm loại mới = thêm một mục vào PAPERS. */
import { fit, Pen, type Area, type Drawing } from './pen';

export type DrawOptions = {
  /** Cỡ ô hoặc khoảng dòng (mm). */
  size: number;
  /** Kẻ đậm mỗi N dòng; 0 là không. */
  major: number;
  columns: number;
};

export type PaperType = {
  id: string;
  label: string;
  /** Các cỡ chọn được (mm). Rỗng: loại giấy có kích thước cố định. */
  sizes: number[];
  defaultSize: number;
  /** Tên của lựa chọn cỡ. */
  sizeLabel: string;
  /** Mặc định kẻ đậm mỗi N dòng; bỏ trống thì loại này không có kẻ đậm. */
  major?: number;
  columns?: boolean;
  /** Dùng ô lưới: lề đỏ canh theo đường kẻ. */
  snaps?: boolean;
  draw: (pen: Pen, area: Area, options: DrawOptions) => void;
};

const CELLS = [3, 4, 5, 6, 8, 10];
const BOXES = [12, 15, 18, 20, 25];

const isMajor = (index: number, every: number) => every > 0 && index % every === 0;

/** Khung gồm số ô nguyên, canh giữa vùng vẽ. */
export function centred(area: Area, cellWidth: number, cellHeight = cellWidth) {
  const columns = fit(area.width, cellWidth);
  const rows = fit(area.height, cellHeight);
  const width = columns * cellWidth;
  const height = rows * cellHeight;
  return {
    columns,
    rows,
    x: area.x + (area.width - width) / 2,
    y: area.y + (area.height - height) / 2,
    width,
    height,
  };
}

function grid(pen: Pen, area: Area, cellW: number, cellH: number, major: number) {
  const box = centred(area, cellW, cellH);
  if (!box.columns || !box.rows) return;
  for (let i = 0; i <= box.rows; i++) {
    pen.horizontal(box.x, box.y + i * cellH, box.width, isMajor(i, major) ? 'major' : 'minor');
  }
  for (let i = 0; i <= box.columns; i++) {
    pen.vertical(box.x + i * cellW, box.y, box.height, isMajor(i, major) ? 'major' : 'minor');
  }
}

function ruled(pen: Pen, area: Area, spacing: number, major = 0) {
  for (let i = 1; i <= fit(area.height, spacing); i++) {
    pen.horizontal(area.x, area.y + i * spacing, area.width, isMajor(i, major) ? 'major' : 'minor');
  }
}

/** Các cụm dòng kẻ (khuông nhạc, tab, dòng tiếng Anh...) xếp đều từ trên xuống. */
function rows(
  area: Area,
  height: number,
  gap: number,
  draw: (top: number, index: number) => void,
) {
  const count = fit(area.height + gap, height + gap);
  for (let i = 0; i < count; i++) draw(area.y + i * (height + gap), i);
}

function staff(lines: number, label?: string) {
  return (pen: Pen, area: Area, { size }: DrawOptions) => {
    const height = (lines - 1) * size;
    rows(area, height, size * 5, (top) => {
      for (let i = 0; i < lines; i++) pen.horizontal(area.x, top + i * size, area.width);
      pen.vertical(area.x, top, height);
      pen.vertical(area.x + area.width, top, height);
      if (label) {
        [...label].forEach((letter, i) =>
          pen.text(area.x + 1.5, top + ((i + 1) * height) / label.length - 0.5, letter, 3.2, true),
        );
      }
    });
  };
}

/** Ô vuông viết chữ Hán; `guides` vẽ nét phụ bên trong. */
function characterBoxes(guides: (pen: Pen, x: number, y: number, size: number) => void) {
  return (pen: Pen, area: Area, { size }: DrawOptions) => {
    const box = centred(area, size);
    for (let r = 0; r < box.rows; r++) {
      for (let c = 0; c < box.columns; c++) {
        const x = box.x + c * size;
        const y = box.y + r * size;
        guides(pen, x, y, size);
        pen.rect(x, y, size, size, 'major');
      }
    }
  };
}

/** Dòng tập viết: mỗi hàng gồm các đường ngang, kiểu nét theo từng đường. */
function handwriting(lines: { stroke: 'minor' | 'major'; dashed?: boolean }[], columns = false) {
  return (pen: Pen, area: Area, { size }: DrawOptions) => {
    const height = (lines.length - 1) * size;
    rows(area, height, size * 1.5, (top) => {
      lines.forEach((line, i) =>
        pen.horizontal(area.x, top + i * size, area.width, line.stroke, line.dashed),
      );
      if (columns) {
        pen.vertical(area.x, top, height);
        pen.vertical(area.x + area.width, top, height);
      }
    });
  };
}

function isometric(pen: Pen, area: Area, { size }: DrawOptions) {
  const column = (size * Math.sqrt(3)) / 2;
  const columns = fit(area.width, column);
  const halves = fit(area.height, size / 2);
  const box: Area = {
    x: area.x + (area.width - columns * column) / 2,
    y: area.y + (area.height - halves * (size / 2)) / 2,
    width: columns * column,
    height: halves * (size / 2),
  };
  for (let i = 0; i <= columns; i++) pen.vertical(box.x + i * column, box.y, box.height);
  const slope = 1 / Math.sqrt(3);
  const rise = box.width * slope;
  for (let k = -Math.ceil(rise / size) - 1; k <= Math.ceil((box.height + rise) / size) + 1; k++) {
    const y = box.y + k * size;
    pen.clipped(box.x, y, box.x + box.width, y + rise, box);
    pen.clipped(box.x, y, box.x + box.width, y - rise, box);
  }
}

function hexagons(pen: Pen, area: Area, { size }: DrawOptions) {
  const width = Math.sqrt(3) * size;
  const seen = new Set<string>();
  const columns = fit(area.width - width / 2, width);
  const count = fit(area.height - size / 2, size * 1.5);
  const offsetX = area.x + (area.width - (columns + 0.5) * width) / 2;
  const offsetY = area.y + (area.height - (count * 1.5 + 0.5) * size) / 2;
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < columns; c++) {
      const cx = offsetX + width / 2 + c * width + (r % 2) * (width / 2);
      const cy = offsetY + size + r * size * 1.5;
      const points = Array.from({ length: 6 }, (_, i) => {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        return [cx + size * Math.cos(angle), cy + size * Math.sin(angle)] as const;
      });
      points.forEach(([x1, y1], i) => {
        const [x2, y2] = points[(i + 1) % 6]!;
        // Cạnh chung của hai ô chỉ vẽ một lần.
        const key = [
          `${Math.round(x1 * 10)},${Math.round(y1 * 10)}`,
          `${Math.round(x2 * 10)},${Math.round(y2 * 10)}`,
        ]
          .sort()
          .join(' ');
        if (!seen.has(key)) {
          seen.add(key);
          pen.line(x1, y1, x2, y2);
        }
      });
    }
  }
}

/** Tiêu đề mẫu và các ô "Nhãn: ........" ở đầu trang. Trả về mép dưới. */
function formHeader(pen: Pen, area: Area, title: string, fields: string[]) {
  pen.text(area.x, area.y + 7, title, 7, true);
  fields.forEach((field, i) => {
    const y = area.y + 15 + i * 8;
    pen.text(area.x, y, field, 4);
    pen.horizontal(area.x + 28, y + 0.5, area.width - 28, 'minor', true);
  });
  return area.y + 12 + fields.length * 8 + 4;
}

const below = (area: Area, top: number): Area => ({
  ...area,
  y: top,
  height: area.y + area.height - top,
});

/** Bảng có tiêu đề cột; `shares` là tỉ lệ bề rộng từng cột. */
function table(pen: Pen, area: Area, headings: string[], shares: number[], rowHeight: number) {
  const count = fit(area.height, rowHeight);
  if (count < 2) return;
  const total = shares.reduce((a, b) => a + b, 0);
  for (let i = 0; i <= count; i++) {
    pen.horizontal(area.x, area.y + i * rowHeight, area.width, i <= 1 ? 'major' : 'minor');
  }
  let x = area.x;
  headings.forEach((heading, i) => {
    pen.vertical(x, area.y, count * rowHeight);
    pen.text(x + 1.5, area.y + rowHeight / 2 + 1.4, heading, 3.8, true);
    x += (area.width * shares[i]!) / total;
  });
  pen.vertical(area.x + area.width, area.y, count * rowHeight);
}

export const PAPERS: PaperType[] = [
  {
    id: 'o-ly',
    label: 'Ô ly',
    sizes: CELLS,
    defaultSize: 5,
    sizeLabel: 'Cỡ ô',
    major: 4,
    snaps: true,
    draw: (pen, area, { size, major }) => grid(pen, area, size, size, major),
  },
  {
    id: 'ke-ngang',
    label: 'Dòng kẻ ngang',
    sizes: CELLS,
    defaultSize: 8,
    sizeLabel: 'Khoảng dòng',
    major: 0,
    draw: (pen, area, { size, major }) => ruled(pen, area, size, major),
  },
  {
    id: 'cham-bi',
    label: 'Chấm bi',
    sizes: CELLS,
    defaultSize: 5,
    sizeLabel: 'Khoảng cách chấm',
    snaps: true,
    draw: (pen, area, { size }) => {
      const box = centred(area, size);
      for (let r = 0; r <= box.rows; r++) {
        for (let c = 0; c <= box.columns; c++) pen.dot(box.x + c * size, box.y + r * size);
      }
    },
  },
  { id: 'trang', label: 'Giấy trắng', sizes: [], defaultSize: 0, sizeLabel: '', draw: () => {} },
  {
    id: 'ke-doc',
    label: 'Kẻ dọc',
    sizes: CELLS,
    defaultSize: 8,
    sizeLabel: 'Khoảng dòng',
    major: 0,
    snaps: true,
    draw: (pen, area, { size, major }) => {
      const box = centred(area, size, area.height);
      for (let i = 0; i <= box.columns; i++) {
        pen.vertical(box.x + i * size, area.y, area.height, isMajor(i, major) ? 'major' : 'minor');
      }
    },
  },
  {
    id: 'milimet',
    label: 'Giấy milimét',
    sizes: [],
    defaultSize: 1,
    sizeLabel: '',
    snaps: true,
    draw: (pen, area) => {
      const box = centred(area, 10);
      const style = (i: number) => (i % 10 === 0 ? 'major' : i % 5 === 0 ? 'minor' : 'faint');
      for (let i = 0; i <= box.height + 0.5; i++) {
        pen.horizontal(box.x, box.y + i, box.width, style(i));
      }
      for (let i = 0; i <= box.width + 0.5; i++) {
        pen.vertical(box.x + i, box.y, box.height, style(i));
      }
    },
  },
  {
    id: 'chia-cot',
    label: 'Chia cột',
    sizes: CELLS,
    defaultSize: 8,
    sizeLabel: 'Khoảng dòng',
    columns: true,
    draw: (pen, area, { size, columns }) => {
      ruled(pen, area, size);
      pen.horizontal(area.x, area.y, area.width);
      for (let i = 0; i <= columns; i++) {
        pen.vertical(area.x + (area.width * i) / columns, area.y, area.height, 'major');
      }
    },
  },
  {
    id: 'khuong-nhac',
    label: 'Khuông nhạc',
    sizes: [1.5, 2, 2.5, 3],
    defaultSize: 2,
    sizeLabel: 'Khoảng cách dòng',
    draw: staff(5),
  },
  {
    id: 'tab-guitar',
    label: 'Tab guitar',
    sizes: [2, 2.5, 3],
    defaultSize: 2.5,
    sizeLabel: 'Khoảng cách dòng',
    draw: staff(6, 'TAB'),
  },
  {
    id: 'tab-ukulele',
    label: 'Tab ukulele',
    sizes: [2, 2.5, 3, 4],
    defaultSize: 3,
    sizeLabel: 'Khoảng cách dòng',
    draw: staff(4, 'TAB'),
  },
  {
    id: 'hop-am',
    label: 'Sơ đồ hợp âm',
    sizes: [4, 5, 6],
    defaultSize: 5,
    sizeLabel: 'Khoảng cách dây',
    draw: (pen, area, { size }) => {
      const width = size * 5;
      const fret = size * 1.4;
      const height = fret * 5;
      const columns = fit(area.width + 8, width + 8);
      const step = columns > 1 ? (area.width - width) / (columns - 1) : 0;
      rows(area, height + 10, 6, (top) => {
        for (let c = 0; c < columns; c++) {
          const x = area.x + c * step;
          pen.horizontal(x, top + 4, width, 'minor', true);
          for (let s = 0; s < 6; s++) pen.vertical(x + s * size, top + 10, height);
          for (let f = 0; f <= 5; f++) {
            pen.horizontal(x, top + 10 + f * fret, width, f === 0 ? 'major' : 'minor');
          }
        }
      });
    },
  },
  {
    id: 'thu-phap',
    label: 'Thư pháp nét nghiêng',
    sizes: CELLS,
    defaultSize: 5,
    sizeLabel: 'Khoảng dòng',
    draw: (pen, area, { size }) => {
      ruled(pen, area, size);
      pen.horizontal(area.x, area.y, area.width);
      const box: Area = { ...area, height: fit(area.height, size) * size };
      // Đường dẫn nghiêng 55 độ so với dòng kẻ.
      const run = box.height / Math.tan((55 * Math.PI) / 180);
      for (let x = box.x - run; x <= box.x + box.width; x += size * 3) {
        pen.clipped(x, box.y + box.height, x + run, box.y, box, 'faint', true);
      }
    },
  },
  {
    id: 'cornell',
    label: 'Ghi chép Cornell',
    sizes: CELLS,
    defaultSize: 8,
    sizeLabel: 'Khoảng dòng',
    draw: (pen, area, { size }) => {
      const cue = area.x + area.width * 0.28;
      const top = area.y + 22;
      const summary = area.y + area.height * 0.8;
      pen.text(area.x, area.y + 6, 'Chủ đề:', 4.5, true);
      pen.text(area.x, area.y + 15, 'Ngày:', 4.5, true);
      pen.horizontal(area.x, top, area.width, 'major');
      pen.vertical(cue, top, summary - top, 'major');
      pen.horizontal(area.x, summary, area.width, 'major');
      pen.text(area.x, top + 5.5, 'Ý chính, câu hỏi', 3.8, true);
      pen.text(cue + 2, top + 5.5, 'Ghi chép', 3.8, true);
      pen.text(area.x, summary + 5.5, 'Tóm tắt', 3.8, true);
      ruled(
        pen,
        { x: cue, y: top + 7, width: area.x + area.width - cue, height: summary - top - 7 - 1 },
        size,
      );
      ruled(pen, below(area, summary + 7), size);
    },
  },
  {
    id: 'isometric',
    label: 'Lưới isometric',
    sizes: CELLS,
    defaultSize: 6,
    sizeLabel: 'Cạnh tam giác',
    draw: isometric,
  },
  {
    id: 'luc-giac',
    label: 'Lưới lục giác',
    sizes: CELLS,
    defaultSize: 5,
    sizeLabel: 'Cạnh lục giác',
    draw: hexagons,
  },
  {
    id: 'seyes',
    label: 'Séyès (vở Pháp)',
    sizes: [],
    defaultSize: 8,
    sizeLabel: '',
    snaps: true,
    draw: (pen, area) => {
      const box = centred(area, 8);
      for (let i = 0; i <= box.rows * 4; i++) {
        pen.horizontal(box.x, box.y + i * 2, box.width, i % 4 === 0 ? 'major' : 'faint');
      }
      for (let i = 0; i <= box.columns; i++) pen.vertical(box.x + i * 8, box.y, box.height);
    },
  },
  {
    id: 'storyboard',
    label: 'Storyboard',
    sizes: [],
    defaultSize: 0,
    sizeLabel: '',
    draw: (pen, area) => {
      const gap = 8;
      const columns = Math.max(1, fit(area.width + gap, 70 + gap));
      const width = (area.width - (columns - 1) * gap) / columns;
      const frame = (width * 9) / 16;
      rows(area, frame + 20, 6, (top) => {
        for (let c = 0; c < columns; c++) {
          const x = area.x + c * (width + gap);
          pen.rect(x, top, width, frame, 'major');
          for (let i = 1; i <= 3; i++) pen.horizontal(x, top + frame + i * 6.5, width);
        }
      });
    },
  },
  {
    id: 'pinyin',
    label: 'Dòng pinyin',
    sizes: [3, 4, 5, 6],
    defaultSize: 4,
    sizeLabel: 'Khoảng dòng',
    draw: handwriting(
      [
        { stroke: 'major' },
        { stroke: 'minor', dashed: true },
        { stroke: 'minor', dashed: true },
        { stroke: 'major' },
      ],
      true,
    ),
  },
  {
    id: 'dien-tu',
    label: 'Ô điền tự (田)',
    sizes: BOXES,
    defaultSize: 18,
    sizeLabel: 'Cạnh ô',
    snaps: true,
    draw: characterBoxes((pen, x, y, s) => {
      pen.horizontal(x, y + s / 2, s, 'minor', true);
      pen.vertical(x + s / 2, y, s, 'minor', true);
    }),
  },
  {
    id: 'me-tu',
    label: 'Ô mễ tự (米)',
    sizes: BOXES,
    defaultSize: 18,
    sizeLabel: 'Cạnh ô',
    snaps: true,
    draw: characterBoxes((pen, x, y, s) => {
      pen.horizontal(x, y + s / 2, s, 'minor', true);
      pen.vertical(x + s / 2, y, s, 'minor', true);
      pen.line(x, y, x + s, y + s, 'faint', true);
      pen.line(x + s, y, x, y + s, 'faint', true);
    }),
  },
  {
    id: 'cuu-cung',
    label: 'Ô cửu cung',
    sizes: BOXES,
    defaultSize: 18,
    sizeLabel: 'Cạnh ô',
    snaps: true,
    draw: characterBoxes((pen, x, y, s) => {
      for (const k of [1, 2]) {
        pen.horizontal(x, y + (s * k) / 3, s, 'minor', true);
        pen.vertical(x + (s * k) / 3, y, s, 'minor', true);
      }
    }),
  },
  {
    id: 'hoi-cung',
    label: 'Ô hồi cung',
    sizes: BOXES,
    defaultSize: 18,
    sizeLabel: 'Cạnh ô',
    snaps: true,
    draw: characterBoxes((pen, x, y, s) => {
      pen.rect(x + s * 0.2, y + s * 0.14, s * 0.6, s * 0.72, 'minor', true);
    }),
  },
  {
    id: 'genko',
    label: 'Genkō yōshi (Nhật)',
    sizes: [8, 9, 10, 12],
    defaultSize: 9,
    sizeLabel: 'Cạnh ô',
    draw: (pen, area, { size }) => {
      const pitch = size * 1.4;
      const columns = fit(area.width + size * 0.4, pitch);
      const count = fit(area.height, size);
      const x0 = area.x + (area.width - (columns * pitch - size * 0.4)) / 2;
      const y0 = area.y + (area.height - count * size) / 2;
      for (let c = 0; c < columns; c++) {
        const x = x0 + c * pitch;
        pen.vertical(x, y0, count * size);
        pen.vertical(x + size, y0, count * size);
        for (let r = 0; r <= count; r++) pen.horizontal(x, y0 + r * size, size);
      }
    },
  },
  {
    id: 'anh-3-dong',
    label: 'Tiếng Anh 3 dòng',
    sizes: [3, 4, 5, 6],
    defaultSize: 5,
    sizeLabel: 'Khoảng dòng',
    draw: handwriting([
      { stroke: 'minor' },
      { stroke: 'minor', dashed: true },
      { stroke: 'major' },
    ]),
  },
  {
    id: 'anh-4-dong',
    label: 'Tiếng Anh 4 dòng',
    sizes: [3, 4, 5, 6],
    defaultSize: 4,
    sizeLabel: 'Khoảng dòng',
    draw: handwriting([
      { stroke: 'minor' },
      { stroke: 'minor', dashed: true },
      { stroke: 'major' },
      { stroke: 'minor' },
    ]),
  },
  {
    id: 'kieu-duc',
    label: 'Dòng kẻ kiểu Đức',
    sizes: [3, 4, 5],
    defaultSize: 4,
    sizeLabel: 'Chiều cao mỗi tầng',
    draw: handwriting(
      [{ stroke: 'minor' }, { stroke: 'major' }, { stroke: 'major' }, { stroke: 'minor' }],
      true,
    ),
  },
  {
    id: 'braille',
    label: 'Ô chữ nổi Braille',
    sizes: [],
    defaultSize: 0,
    sizeLabel: '',
    draw: (pen, area) => {
      const box = centred(area, 6, 10);
      for (let r = 0; r < box.rows; r++) {
        for (let c = 0; c < box.columns; c++) {
          for (let dx = 0; dx < 2; dx++) {
            for (let dy = 0; dy < 3; dy++) {
              pen.dot(box.x + c * 6 + 1.75 + dx * 2.5, box.y + r * 10 + 2.5 + dy * 2.5);
            }
          }
        }
      }
    },
  },
  {
    id: 'dan-len',
    label: 'Lưới đan len',
    sizes: CELLS,
    defaultSize: 5,
    sizeLabel: 'Bề rộng mũi',
    major: 10,
    snaps: true,
    draw: (pen, area, { size, major }) => grid(pen, area, size, size * 0.75, major),
  },
  {
    id: 'nhat-ky',
    label: 'Nhật ký',
    sizes: CELLS,
    defaultSize: 8,
    sizeLabel: 'Khoảng dòng',
    draw: (pen, area, { size }) => {
      const top = formHeader(pen, area, 'Nhật ký', ['Ngày', 'Thời tiết']);
      ruled(pen, below(area, top), size);
    },
  },
  {
    id: 'ghi-chep-hop',
    label: 'Ghi chép họp',
    sizes: CELLS,
    defaultSize: 8,
    sizeLabel: 'Khoảng dòng',
    draw: (pen, area, { size }) => {
      const top = formHeader(pen, area, 'Biên bản ghi chép', [
        'Cuộc họp',
        'Thời gian',
        'Thành phần',
      ]);
      const split = area.y + area.height * 0.68;
      pen.text(area.x, top + 4, 'Nội dung', 4.5, true);
      ruled(pen, { ...area, y: top + 5, height: split - top - 8 }, size);
      pen.text(area.x, split + 2, 'Việc cần làm', 4.5, true);
      table(pen, below(area, split + 4), ['Việc', 'Người làm', 'Hạn'], [5, 3, 2], 9);
    },
  },
  {
    id: 'ke-hoach',
    label: 'Kế hoạch dự án',
    sizes: [],
    defaultSize: 0,
    sizeLabel: '',
    draw: (pen, area) => {
      const top = formHeader(pen, area, 'Kế hoạch', ['Tên dự án', 'Mục tiêu', 'Thời gian']);
      table(
        pen,
        below(area, top),
        ['Công việc', 'Phụ trách', 'Hạn', 'Tình trạng'],
        [5, 3, 2, 2],
        11,
      );
    },
  },
  {
    id: 'viec-can-lam',
    label: 'Danh sách việc cần làm',
    sizes: [8, 10, 12],
    defaultSize: 10,
    sizeLabel: 'Khoảng dòng',
    draw: (pen, area, { size }) => {
      const top = formHeader(pen, area, 'Việc cần làm', ['Ngày']);
      rows(below(area, top), size, 0, (y) => {
        pen.rect(area.x, y + size - 5, 4.5, 4.5, 'major');
        pen.horizontal(area.x + 8, y + size - 0.5, area.width - 8);
      });
    },
  },
  {
    id: 'phac-thao',
    label: 'Giấy phác thảo',
    sizes: CELLS,
    defaultSize: 8,
    sizeLabel: 'Khoảng dòng',
    draw: (pen, area, { size }) => {
      const split = area.y + area.height * 0.76;
      pen.rect(area.x, area.y, area.width, split - area.y, 'major');
      pen.text(area.x, split + 6, 'Ghi chú', 4.5, true);
      ruled(pen, below(area, split + 6), size);
    },
  },
];

export const getPaperType = (id: string) => PAPERS.find((p) => p.id === id) ?? PAPERS[0]!;

/** Cỡ đang chọn nếu loại giấy hỗ trợ, nếu không thì cỡ mặc định của loại. */
export const effectiveSize = (type: PaperType, size: number) =>
  type.sizes.includes(size) ? size : type.defaultSize;

export function drawPaper(type: PaperType, area: Area, options: DrawOptions): Drawing {
  const pen = new Pen();
  if (area.width > 0 && area.height > 0) type.draw(pen, area, options);
  return pen.drawing;
}

/** Lề đỏ cách mép trái giấy khoảng 25 mm, canh theo đường kẻ nếu là giấy ô. */
export function redMarginX(type: PaperType, area: Area, pageWidth: number, size: number) {
  const wanted = Math.min(25, pageWidth * 0.2);
  if (!type.snaps || !size) return Math.max(area.x, wanted);
  const box = centred(area, size);
  const steps = Math.max(0, Math.round((wanted - box.x) / size));
  return box.x + steps * size;
}
