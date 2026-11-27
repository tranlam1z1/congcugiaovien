/**
 * 14 tranh ô vuông 8×8 tự vẽ (PRD 4.7). Mỗi chữ cái là một màu trong `COLORS`.
 * `bg` là màu nền, dùng khi mở rộng tranh ra lưới lớn hơn.
 */
export const COLORS = {
  r: { name: 'Đỏ', hex: '#ef5350' },
  o: { name: 'Cam', hex: '#ffa040' },
  y: { name: 'Vàng', hex: '#ffe14d' },
  g: { name: 'Xanh lá', hex: '#6cc36c' },
  b: { name: 'Xanh dương', hex: '#8fd3ff' },
  p: { name: 'Tím', hex: '#b894f0' },
  h: { name: 'Hồng', hex: '#ff9ecb' },
  n: { name: 'Nâu', hex: '#b9805a' },
  k: { name: 'Xám', hex: '#a8a8a8' },
} as const;

export type ColorId = keyof typeof COLORS;

export const ART_SIZE = 8;

export type Picture = { id: string; name: string; bg: ColorId; rows: string[] };

export const PICTURES: Picture[] = [
  {
    id: 'trai-tim',
    name: 'Trái tim',
    bg: 'b',
    rows: [
      'bbbbbbbb',
      'brrbbrrb',
      'rrrrrrrr',
      'rrrrrrrr',
      'rrrrrrrr',
      'brrrrrrb',
      'bbrrrrbb',
      'bbbrrbbb',
    ],
  },
  {
    id: 'ngoi-nha',
    name: 'Ngôi nhà',
    bg: 'b',
    rows: [
      'bbbrrbbb',
      'bbrrrrbb',
      'brrrrrrb',
      'rrrrrrrr',
      'byyyyyyb',
      'bybyynyb',
      'byyyynyb',
      'gggggggg',
    ],
  },
  {
    id: 'bong-hoa',
    name: 'Bông hoa',
    bg: 'b',
    rows: [
      'bbhhhhbb',
      'bhhyyhhb',
      'bhyyyyhb',
      'bhhyyhhb',
      'bbhhhhbb',
      'bbbggbbb',
      'bggggggb',
      'bbbggbbb',
    ],
  },
  {
    id: 'cai-cay',
    name: 'Cái cây',
    bg: 'b',
    rows: [
      'bbbggbbb',
      'bbggggbb',
      'bggggggb',
      'gggggggg',
      'bggggggb',
      'bbbnnbbb',
      'bbbnnbbb',
      'yyyyyyyy',
    ],
  },
  {
    id: 'con-ca',
    name: 'Con cá',
    bg: 'b',
    rows: [
      'bbbbbbbb',
      'obbboobb',
      'ooboooob',
      'ooooooko',
      'oooooooo',
      'ooboooob',
      'obbboobb',
      'bbbbbbbb',
    ],
  },
  {
    id: 'con-buom',
    name: 'Con bướm',
    bg: 'b',
    rows: [
      'bbnbbnbb',
      'pppnnppp',
      'pypnnpyp',
      'pppnnppp',
      'bppnnppb',
      'phpnnphp',
      'pppbbppp',
      'bbbbbbbb',
    ],
  },
  {
    id: 'mat-troi',
    name: 'Mặt trời',
    bg: 'b',
    rows: [
      'bbboobbb',
      'bobbbbob',
      'bbbyybbb',
      'obyyyybo',
      'obyyyybo',
      'bbbyybbb',
      'bobbbbob',
      'bbboobbb',
    ],
  },
  {
    id: 'o-to',
    name: 'Ô tô',
    bg: 'b',
    rows: [
      'bbbbbbbb',
      'bbrrrrbb',
      'bryrryrb',
      'rrrrrrrr',
      'rrrrrrrr',
      'bkkrrkkb',
      'bkkbbkkb',
      'gggggggg',
    ],
  },
  {
    id: 'con-meo',
    name: 'Con mèo',
    bg: 'b',
    rows: [
      'obbbbbbo',
      'oobbbboo',
      'oooooooo',
      'ogoooogo',
      'oooooooo',
      'ooohhooo',
      'boooooob',
      'bboooobb',
    ],
  },
  {
    id: 'ngoi-sao',
    name: 'Ngôi sao',
    bg: 'p',
    rows: [
      'pppyyppp',
      'pppyyppp',
      'yyyyyyyy',
      'pyyyyyyp',
      'ppyyyypp',
      'pyyyyyyp',
      'pyyppyyp',
      'yyppppyy',
    ],
  },
  {
    id: 'qua-tao',
    name: 'Quả táo',
    bg: 'y',
    rows: [
      'yyyynyyy',
      'yyyngggy',
      'yrrnrrry',
      'rrrrrrrr',
      'rrrrrrrr',
      'rrrrrrrr',
      'yrrrrrry',
      'yyrryrry',
    ],
  },
  {
    id: 'thuyen-buom',
    name: 'Thuyền buồm',
    bg: 'y',
    rows: [
      'yyyynyyy',
      'yyyrnyyy',
      'yyrrnoyy',
      'yrrrnooy',
      'rrrrnooo',
      'yyyynyyy',
      'ynnnnnny',
      'bbbbbbbb',
    ],
  },
  {
    id: 'qua-dau',
    name: 'Quả dâu',
    bg: 'b',
    rows: [
      'bbbggbbb',
      'bggggggb',
      'rrrggrrr',
      'ryrrrryr',
      'rrryyrrr',
      'bryrryrb',
      'bbrrrrbb',
      'bbbrrbbb',
    ],
  },
  {
    id: 'ga-con',
    name: 'Gà con',
    bg: 'b',
    rows: [
      'bbyyyybb',
      'byyyyyyb',
      'bykyykyb',
      'byyooyyb',
      'yyyyyyyy',
      'yyyyyyyy',
      'bbobbobb',
      'gggggggg',
    ],
  },
];

export const CELL_COUNTS = [64, 80, 100] as const;
export type CellCount = (typeof CELL_COUNTS)[number];

const GRID: Record<CellCount, { rows: number; columns: number }> = {
  64: { rows: 8, columns: 8 },
  80: { rows: 10, columns: 8 },
  100: { rows: 10, columns: 10 },
};

/**
 * Mở rộng tranh 8×8 ra lưới đủ số ô: thêm viền nền, riêng hàng "mặt đất"
 * (hàng cuối một màu khác nền) được kéo dài cho liền.
 */
export function pictureGrid(picture: Picture, count: CellCount): ColorId[][] {
  const { rows, columns } = GRID[count];
  const side = (columns - ART_SIZE) / 2;
  const end = (rows - ART_SIZE) / 2;
  const last = picture.rows[ART_SIZE - 1]!;
  const ground =
    last[0] !== picture.bg && [...last].every((c) => c === last[0]) ? (last[0] as ColorId) : null;

  const widen = (line: string, fill: ColorId) => [
    ...Array<ColorId>(side).fill(fill),
    ...([...line] as ColorId[]),
    ...Array<ColorId>(side).fill(fill),
  ];
  const plain = (fill: ColorId) => Array<ColorId>(columns).fill(fill);

  return [
    ...Array.from({ length: end }, () => plain(picture.bg)),
    ...picture.rows.map((line, i) =>
      widen(line, ground && i === ART_SIZE - 1 ? ground : picture.bg),
    ),
    ...Array.from({ length: end }, () => plain(ground ?? picture.bg)),
  ];
}
