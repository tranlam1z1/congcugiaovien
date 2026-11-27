import { createCanvas } from '@napi-rs/canvas';
import { unzipSync } from 'fflate';
import { degrees, PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { crc32, createZip } from '@/core/zip';
import {
  allPages,
  assemble,
  imagesToPdf,
  jpegOrientation,
  layoutImage,
  loadSource,
  placeRotated,
  ToolError,
  type ImageSettings,
} from './pdfOps';
import { baseName, everyPage, groupName, parseRanges, uniqueNames } from './ranges';

/** File thử: trang thứ i rộng `width + i` để nhận ra sau khi đảo. */
async function sample(width: number, count: number) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < count; i++) doc.addPage([width + i, 500]);
  return doc;
}

const widths = (doc: PDFDocument) => doc.getPages().map((p) => p.getWidth());
const reload = async (data: Uint8Array) => PDFDocument.load(data);

describe('ghép, tách, xoay trang', () => {
  it('giữ đúng thứ tự khi trộn trang của nhiều file, kể cả lặp trang', async () => {
    const docs = [await sample(100, 3), await sample(200, 2)];
    const refs = [
      { source: 1, page: 1, rotation: 0 },
      { source: 0, page: 2, rotation: 0 },
      { source: 1, page: 0, rotation: 0 },
      { source: 0, page: 0, rotation: 0 },
      { source: 0, page: 0, rotation: 0 },
    ];
    const progress: number[] = [];
    const out = await reload(await assemble(docs, refs, (done) => progress.push(done)));
    expect(widths(out)).toEqual([201, 102, 200, 100, 100]);
    expect(progress).toEqual([1, 2, 3, 4, 5]);
  });

  it('ghép trọn mọi file theo thứ tự', async () => {
    const docs = [await sample(100, 2), await sample(200, 1)];
    const out = await reload(await assemble(docs, allPages(docs)));
    expect(widths(out)).toEqual([100, 101, 200]);
  });

  it('xoay cộng thêm vào góc sẵn có', async () => {
    const doc = await sample(100, 3);
    doc.getPage(1).setRotation(degrees(270));
    const out = await reload(
      await assemble(
        [doc],
        [
          { source: 0, page: 0, rotation: 90 },
          { source: 0, page: 1, rotation: 180 },
          { source: 0, page: 2, rotation: 0 },
        ],
      ),
    );
    expect(out.getPages().map((p) => p.getRotation().angle)).toEqual([90, 90, 0]);
  });

  it('không còn trang hoặc file hỏng thì báo lỗi dễ hiểu', async () => {
    await expect(assemble([], [])).rejects.toThrow(ToolError);
    await expect(
      loadSource({ name: 'hong.pdf', data: new TextEncoder().encode('không phải pdf') }),
    ).rejects.toThrow('Không đọc được “hong.pdf”');
  });
});

describe('khoảng trang', () => {
  it('đọc trang lẻ, khoảng và khoảng mở', () => {
    expect(parseRanges('1-3, 5, 8-', 10)).toEqual({
      groups: [[0, 1, 2], [4], [7, 8, 9]],
      error: '',
    });
    expect(parseRanges(' 2 – 2 ;1', 3).groups).toEqual([[1], [0]]);
    expect(everyPage(3)).toEqual([[0], [1], [2]]);
  });

  it('báo lỗi khi viết sai hoặc ngoài phạm vi', () => {
    for (const text of ['', 'abc', '0', '4', '3-1', '1-9', '-2', '1..2']) {
      const result = parseRanges(text, 3);
      expect(result.groups, text).toEqual([]);
      expect(result.error, text).not.toBe('');
    }
  });

  it('tên file kết quả', () => {
    expect(groupName([4])).toBe('trang-5');
    expect(groupName([0, 1, 2])).toBe('trang-1-3');
    expect(baseName('Đề thi.v2.PDF')).toBe('Đề thi.v2');
    expect(baseName('.pdf')).toBe('tai-lieu');
    expect(uniqueNames(['a.pdf', 'b.pdf', 'a.pdf'])).toEqual(['a.pdf', 'b.pdf', 'a (2).pdf']);
  });
});

describe('đặt ảnh lên trang', () => {
  const settings: ImageSettings = {
    size: 'a4',
    orientation: 'auto',
    margin: 10,
    fit: 'contain',
  };

  it('vừa trang: nằm trong lề, giữ tỉ lệ, canh giữa; hướng theo ảnh', () => {
    for (const [w, h] of [
      [4000, 3000],
      [300, 900],
      [500, 500],
    ] as const) {
      const { page, frame, box } = layoutImage(w, h, settings);
      expect(page[0] > page[1]).toBe(w > h);
      expect(box.width / box.height).toBeCloseTo(w / h, 5);
      expect(box.x).toBeGreaterThanOrEqual(frame.x - 0.001);
      expect(box.y).toBeGreaterThanOrEqual(frame.y - 0.001);
      expect(box.x + box.width).toBeLessThanOrEqual(frame.x + frame.width + 0.001);
      expect(box.x + box.width / 2).toBeCloseTo(page[0] / 2, 5);
      expect(box.y + box.height / 2).toBeCloseTo(page[1] / 2, 5);
    }
  });

  it('phủ kín: che hết khung trong lề', () => {
    const { frame, box } = layoutImage(4000, 1000, { ...settings, fit: 'cover' });
    expect(box.width).toBeGreaterThanOrEqual(frame.width - 0.001);
    expect(box.height).toBeCloseTo(frame.height, 5);
  });

  it('theo cỡ ảnh: trang bằng ảnh cộng lề', () => {
    const { page } = layoutImage(400, 200, { ...settings, size: 'anh', margin: 0 });
    expect(page).toEqual([300, 150]);
  });

  it('ảnh xoay mọi góc vẫn phủ đúng khung', () => {
    const box = { x: 10, y: 20, width: 300, height: 100 };
    for (const rotation of [0, 90, 180, 270, 360, -90]) {
      const { x, y, width, height, angle } = placeRotated(box, rotation);
      const radians = (angle * Math.PI) / 180;
      const corners = [
        [0, 0],
        [width, 0],
        [0, height],
        [width, height],
      ].map(([a, b]) => [
        x + a! * Math.cos(radians) - b! * Math.sin(radians),
        y + a! * Math.sin(radians) + b! * Math.cos(radians),
      ]);
      const xs = corners.map((c) => c[0]!);
      const ys = corners.map((c) => c[1]!);
      expect(Math.min(...xs), `${rotation}`).toBeCloseTo(box.x, 5);
      expect(Math.max(...xs), `${rotation}`).toBeCloseTo(box.x + box.width, 5);
      expect(Math.min(...ys), `${rotation}`).toBeCloseTo(box.y, 5);
      expect(Math.max(...ys), `${rotation}`).toBeCloseTo(box.y + box.height, 5);
    }
  });

  it('mỗi ảnh một trang; ảnh hỏng được nêu tên', async () => {
    const canvas = createCanvas(40, 20);
    const png = new Uint8Array(canvas.toBuffer('image/png'));
    const jpg = new Uint8Array(canvas.toBuffer('image/jpeg'));
    const inputs = [
      { name: 'a.png', data: png, type: 'png' as const, rotation: 0 },
      { name: 'b.jpg', data: jpg, type: 'jpg' as const, rotation: 90 },
    ];
    const out = await reload(await imagesToPdf(2, async (i) => inputs[i]!, settings));
    expect(out.getPages().map((p) => p.getWidth() > p.getHeight())).toEqual([true, false]);
    await expect(
      imagesToPdf(1, async () => ({ ...inputs[0]!, data: new Uint8Array([1, 2]) }), settings),
    ).rejects.toThrow('Không đọc được ảnh “a.png”');
  });
});

/** JPEG tối giản chỉ có đầu file và khối EXIF ghi hướng xoay. */
function exif(orientation: number, little: boolean) {
  const data = new Uint8Array(34);
  const view = new DataView(data.buffer);
  view.setUint16(0, 0xffd8);
  view.setUint16(2, 0xffe1);
  view.setUint16(4, 30);
  view.setUint32(6, 0x45786966);
  view.setUint16(12, little ? 0x4949 : 0x4d4d);
  view.setUint16(14, 42, little);
  view.setUint32(16, 8, little);
  view.setUint16(20, 1, little);
  view.setUint16(22, 0x0112, little);
  view.setUint16(24, 3, little);
  view.setUint32(26, 1, little);
  view.setUint16(30, orientation, little);
  return data;
}

describe('hướng ảnh JPEG', () => {
  it('đọc được cả hai kiểu thứ tự byte', () => {
    expect(jpegOrientation(exif(6, true))).toBe(6);
    expect(jpegOrientation(exif(8, false))).toBe(8);
  });

  it('không có hoặc dữ liệu cụt thì coi là đúng chiều', () => {
    const plain = new Uint8Array(createCanvas(4, 4).toBuffer('image/jpeg'));
    expect(jpegOrientation(plain)).toBe(1);
    expect(jpegOrientation(new Uint8Array([0xff, 0xd8]))).toBe(1);
    expect(jpegOrientation(exif(6, true).slice(0, 24))).toBe(1);
    expect(jpegOrientation(exif(99, true))).toBe(1);
    expect(jpegOrientation(new Uint8Array(0))).toBe(1);
  });
});

describe('file zip', () => {
  it('giải nén lại đúng tên tiếng Việt và nội dung', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926);
    const entries = [
      { name: 'Đề số 1.pdf', data: new TextEncoder().encode('một') },
      { name: 'b.pdf', data: new Uint8Array(100_000).fill(7) },
      { name: 'rong.pdf', data: new Uint8Array(0) },
    ];
    const files = unzipSync(createZip(entries));
    expect(Object.keys(files)).toEqual(entries.map((e) => e.name));
    for (const entry of entries) expect(files[entry.name]).toEqual(entry.data);
  });
});
