/**
 * Font chọn được trên phiếu in (đều giấy phép OFL, tự host).
 * Xem trước và PDF dùng chung file TTF nên khớp nhau.
 * HP001 chờ file và giấy phép của tác giả (PRD "Các điểm cần chốt").
 */
import andika from '@expo-google-fonts/andika/400Regular/Andika_400Regular.ttf?url';
import andikaBold from '@expo-google-fonts/andika/700Bold/Andika_700Bold.ttf?url';
import itim from '@expo-google-fonts/itim/400Regular/Itim_400Regular.ttf?url';
import mali from '@expo-google-fonts/mali/400Regular/Mali_400Regular.ttf?url';
import maliBold from '@expo-google-fonts/mali/700Bold/Mali_700Bold.ttf?url';
import pangolin from '@expo-google-fonts/pangolin/400Regular/Pangolin_400Regular.ttf?url';
import patrickHand from '@expo-google-fonts/patrick-hand/400Regular/PatrickHand_400Regular.ttf?url';
import playpen from '@expo-google-fonts/playpen-sans/400Regular/PlaypenSans_400Regular.ttf?url';
import playpenBold from '@expo-google-fonts/playpen-sans/700Bold/PlaypenSans_700Bold.ttf?url';
import playwrite from '@expo-google-fonts/playwrite-vn/400Regular/PlaywriteVN_400Regular.ttf?url';
import quicksand from '@expo-google-fonts/quicksand/400Regular/Quicksand_400Regular.ttf?url';
import quicksandBold from '@expo-google-fonts/quicksand/700Bold/Quicksand_700Bold.ttf?url';

export type PrintFont = {
  id: string;
  label: string;
  family: string;
  /** Bề rộng chữ số tính theo em, để ước lượng số cột vừa trang. */
  digitWidth: number;
  /** Hệ số giãn dòng thêm cho font nét cao (chữ viết tay). */
  leading?: number;
  /** Rỗng: font đã nạp sẵn cho giao diện. */
  files: { weight: number; url: string }[];
};

const faces = (regular: string, bold?: string) => [
  { weight: 400, url: regular },
  ...(bold ? [{ weight: 700, url: bold }] : []),
];

export const PRINT_FONTS = [
  { id: 'be-vietnam-pro', label: 'Be Vietnam Pro', family: 'Be Vietnam Pro', digitWidth: 0.68, files: [] },
  { id: 'andika', label: 'Andika', family: 'Andika', digitWidth: 0.59, files: faces(andika, andikaBold) },
  { id: 'mali', label: 'Mali', family: 'Mali', digitWidth: 0.62, files: faces(mali, maliBold) },
  { id: 'playpen-sans', label: 'Playpen Sans', family: 'Playpen Sans', digitWidth: 0.74, files: faces(playpen, playpenBold) },
  { id: 'quicksand', label: 'Quicksand', family: 'Quicksand', digitWidth: 0.6, files: faces(quicksand, quicksandBold) },
  { id: 'itim', label: 'Itim', family: 'Itim', digitWidth: 0.62, files: faces(itim) },
  { id: 'patrick-hand', label: 'Patrick Hand', family: 'Patrick Hand', digitWidth: 0.5, files: faces(patrickHand) },
  { id: 'pangolin', label: 'Pangolin', family: 'Pangolin', digitWidth: 0.69, files: faces(pangolin) },
  { id: 'playwrite-vn', label: 'Playwrite VN (viết tay)', family: 'Playwrite VN', digitWidth: 1.02, leading: 1.35, files: faces(playwrite) },
] as const satisfies readonly PrintFont[];

export type PrintFontId = (typeof PRINT_FONTS)[number]['id'];

/** Giá trị đã lưu mà không còn font đó thì về font mặc định. */
export const getPrintFont = (id: string): PrintFont =>
  PRINT_FONTS.find((font) => font.id === id) ?? PRINT_FONTS[0];

/** Trình duyệt chỉ tải file khi trang A4 thật sự dùng tới font. */
export const PRINT_FONT_FACE_CSS = PRINT_FONTS.flatMap((font) =>
  font.files.map(
    (file) =>
      `@font-face{font-family:'${font.family}';font-weight:${file.weight};font-display:block;src:url('${file.url}') format('truetype')}`,
  ),
).join('');
