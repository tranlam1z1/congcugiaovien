/** Ghép, tách, xoay trang và đổi ảnh sang PDF bằng pdf-lib. Chạy được trong Web Worker. */
import {
  clip,
  degrees,
  endPath,
  PDFDocument,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
  type PDFPage,
} from 'pdf-lib';

export type Progress = (done: number, total: number) => void;

/** Lỗi đã có câu giải thích cho người dùng. */
export class ToolError extends Error {}

export type Source = { name: string; data: ArrayBuffer | Uint8Array };

export async function loadSource({ name, data }: Source) {
  try {
    return await PDFDocument.load(data);
  } catch (error) {
    throw new ToolError(
      /encrypt/i.test(String(error))
        ? `“${name}” có mật khẩu. Hãy gỡ mật khẩu rồi chọn lại.`
        : `Không đọc được “${name}”. File có thể bị hỏng hoặc không phải PDF.`,
    );
  }
}

/** Một trang trong file kết quả: lấy từ nguồn nào, trang mấy, xoay thêm bao nhiêu độ. */
export type PageRef = { source: number; page: number; rotation: number };

/** Dựng file mới từ các trang đã chọn, đúng thứ tự. */
export async function assemble(
  documents: PDFDocument[],
  pages: PageRef[],
  onProgress?: Progress,
) {
  if (pages.length === 0) throw new ToolError('Không còn trang nào để lưu.');
  const out = await PDFDocument.create();
  const copies = new Map<number, PDFPage[]>();
  // Chép theo từng nguồn một lượt để font và ảnh dùng chung chỉ chép một lần.
  for (const source of new Set(pages.map((p) => p.source))) {
    const indices = pages.filter((p) => p.source === source).map((p) => p.page);
    copies.set(source, await out.copyPages(documents[source]!, indices));
  }
  const used = new Map<number, number>();
  pages.forEach(({ source, rotation }, i) => {
    const at = used.get(source) ?? 0;
    used.set(source, at + 1);
    const page = out.addPage(copies.get(source)![at]!);
    if (rotation) {
      page.setRotation(degrees((((page.getRotation().angle + rotation) % 360) + 360) % 360));
    }
    onProgress?.(i + 1, pages.length);
  });
  return out.save();
}

export const allPages = (documents: PDFDocument[]): PageRef[] =>
  documents.flatMap((doc, source) =>
    doc.getPageIndices().map((page) => ({ source, page, rotation: 0 })),
  );

export type PageSizeId = 'a4' | 'a5' | 'letter' | 'anh';
export type ImageSettings = {
  size: PageSizeId;
  orientation: 'auto' | 'portrait' | 'landscape';
  /** Lề (mm). */
  margin: number;
  /** contain: thấy cả ảnh; cover: phủ kín phần trong lề, cắt bớt mép ảnh. */
  fit: 'contain' | 'cover';
};

const PT_PER_MM = 72 / 25.4;
const SIZES = { a4: [210, 297], a5: [148, 210], letter: [215.9, 279.4] } as const;

type Box = { x: number; y: number; width: number; height: number };

/**
 * Cỡ trang và khung ảnh (điểm PDF, gốc ở góc dưới trái) cho một ảnh đã xoay
 * có kích thước `width` × `height` điểm ảnh.
 */
export function layoutImage(width: number, height: number, settings: ImageSettings) {
  const margin = settings.margin * PT_PER_MM;
  let page: [number, number];
  if (settings.size === 'anh') {
    // Một điểm ảnh bằng 0,75 điểm PDF (96 dpi).
    page = [width * 0.75 + 2 * margin, height * 0.75 + 2 * margin];
  } else {
    const [short, long] = SIZES[settings.size].map((mm) => mm * PT_PER_MM) as [number, number];
    const landscape =
      settings.orientation === 'auto' ? width > height : settings.orientation === 'landscape';
    page = landscape ? [long, short] : [short, long];
  }
  const frame: Box = {
    x: margin,
    y: margin,
    width: Math.max(1, page[0] - 2 * margin),
    height: Math.max(1, page[1] - 2 * margin),
  };
  const ratio = [frame.width / width, frame.height / height] as const;
  const scale = settings.fit === 'cover' ? Math.max(...ratio) : Math.min(...ratio);
  const box: Box = {
    width: width * scale,
    height: height * scale,
    x: frame.x + (frame.width - width * scale) / 2,
    y: frame.y + (frame.height - height * scale) / 2,
  };
  return { page, frame, box };
}

/**
 * Tham số `drawImage` để ảnh xoay `rotation` độ theo chiều kim đồng hồ nằm đúng `box`.
 * pdf-lib xoay ngược chiều kim đồng hồ quanh góc đặt ảnh nên phải dời góc đó.
 */
export function placeRotated(box: Box, rotation: number) {
  const turn = (((rotation % 360) + 360) % 360) as 0 | 90 | 180 | 270;
  const sideways = turn === 90 || turn === 270;
  return {
    x: box.x + (turn === 180 || turn === 270 ? box.width : 0),
    y: box.y + (turn === 90 || turn === 180 ? box.height : 0),
    width: sideways ? box.height : box.width,
    height: sideways ? box.width : box.height,
    angle: turn ? -turn : 0,
  };
}

export type ImageInput = { name: string; data: Uint8Array; type: 'jpg' | 'png'; rotation: number };

export async function imagesToPdf(
  count: number,
  load: (index: number) => Promise<ImageInput>,
  settings: ImageSettings,
  onProgress?: Progress,
) {
  if (count === 0) throw new ToolError('Chưa có ảnh nào.');
  const doc = await PDFDocument.create();
  for (let i = 0; i < count; i++) {
    const input = await load(i);
    let image;
    try {
      image = input.type === 'jpg' ? await doc.embedJpg(input.data) : await doc.embedPng(input.data);
    } catch {
      throw new ToolError(`Không đọc được ảnh “${input.name}”.`);
    }
    const sideways = Math.abs(input.rotation % 180) === 90;
    const { page: size, frame, box } = layoutImage(
      sideways ? image.height : image.width,
      sideways ? image.width : image.height,
      settings,
    );
    const page = doc.addPage(size);
    const { angle, ...place } = placeRotated(box, input.rotation);
    page.pushOperators(
      pushGraphicsState(),
      rectangle(frame.x, frame.y, frame.width, frame.height),
      clip(),
      endPath(),
    );
    page.drawImage(image, { ...place, rotate: degrees(angle) });
    page.pushOperators(popGraphicsState());
    onProgress?.(i + 1, count);
  }
  return doc.save();
}

/**
 * Hướng xoay ghi trong ảnh JPEG (EXIF, 1–8); 1 là ảnh đã đúng chiều.
 * Ảnh chụp điện thoại thường khác 1 nên phải vẽ lại trước khi đưa vào PDF.
 */
export function jpegOrientation(data: Uint8Array): number {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  if (data.length < 4 || view.getUint16(0) !== 0xffd8) return 1;
  let at = 2;
  while (at + 4 <= data.length) {
    const marker = view.getUint16(at);
    const length = view.getUint16(at + 2);
    // Tới dữ liệu ảnh thì không còn thẻ nữa.
    if (marker === 0xffda || (marker & 0xff00) !== 0xff00) break;
    // "Exif\0\0" rồi tới khối TIFF.
    if (marker === 0xffe1 && at + 18 <= data.length && view.getUint32(at + 4) === 0x45786966) {
      const tiff = at + 10;
      const little = view.getUint16(tiff) === 0x4949;
      const directory = tiff + view.getUint32(tiff + 4, little);
      if (directory + 2 > data.length) return 1;
      const entries = view.getUint16(directory, little);
      for (let i = 0; i < entries; i++) {
        const entry = directory + 2 + i * 12;
        if (entry + 12 > data.length) break;
        if (view.getUint16(entry, little) === 0x0112) {
          const value = view.getUint16(entry + 8, little);
          return value >= 1 && value <= 8 ? value : 1;
        }
      }
      return 1;
    }
    at += 2 + length;
  }
  return 1;
}
