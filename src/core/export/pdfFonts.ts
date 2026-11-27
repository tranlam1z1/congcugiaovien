import bold from '@expo-google-fonts/be-vietnam-pro/700Bold/BeVietnamPro_700Bold.ttf?url';
import boldItalic from '@expo-google-fonts/be-vietnam-pro/700Bold_Italic/BeVietnamPro_700Bold_Italic.ttf?url';
import italic from '@expo-google-fonts/be-vietnam-pro/400Regular_Italic/BeVietnamPro_400Regular_Italic.ttf?url';
import medium from '@expo-google-fonts/be-vietnam-pro/500Medium/BeVietnamPro_500Medium.ttf?url';
import regular from '@expo-google-fonts/be-vietnam-pro/400Regular/BeVietnamPro_400Regular.ttf?url';
import semiBold from '@expo-google-fonts/be-vietnam-pro/600SemiBold/BeVietnamPro_600SemiBold.ttf?url';
import { PRINT_FONTS } from '../print/fonts';

export type PdfFontFace = {
  family: string;
  weight: number;
  italic: boolean;
  /** TTF/OTF đầy đủ dấu tiếng Việt. */
  url: string;
};

const DEFAULT_FAMILY = 'be vietnam pro';

const faces: PdfFontFace[] = [
  { family: DEFAULT_FAMILY, weight: 400, italic: false, url: regular },
  { family: DEFAULT_FAMILY, weight: 500, italic: false, url: medium },
  { family: DEFAULT_FAMILY, weight: 600, italic: false, url: semiBold },
  { family: DEFAULT_FAMILY, weight: 700, italic: false, url: bold },
  { family: DEFAULT_FAMILY, weight: 400, italic: true, url: italic },
  { family: DEFAULT_FAMILY, weight: 700, italic: true, url: boldItalic },
  ...PRINT_FONTS.flatMap((font) =>
    font.files.map((file) => ({
      family: font.family.toLowerCase(),
      weight: file.weight,
      italic: false,
      url: file.url,
    })),
  ),
];

const normalizeFamily = (family: string) =>
  family.split(',')[0]!.trim().replace(/^["']|["']$/g, '').toLowerCase();

/** Chọn mặt chữ gần nhất; họ font chưa đăng ký thì dùng Be Vietnam Pro. */
export function findPdfFont(cssFamily: string, weight: number, isItalic: boolean): PdfFontFace {
  const family = normalizeFamily(cssFamily);
  let candidates = faces.filter((f) => f.family === family);
  if (candidates.length === 0) candidates = faces.filter((f) => f.family === DEFAULT_FAMILY);
  const distance = (f: PdfFontFace) =>
    (f.italic === isItalic ? 0 : 10000) + Math.abs(f.weight - weight);
  return candidates.reduce((best, f) => (distance(f) < distance(best) ? f : best));
}
