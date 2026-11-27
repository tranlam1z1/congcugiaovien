/**
 * Gói nhiều file vào một file .zip, không nén (PDF và ảnh vốn đã nén sẵn).
 * Tên file ghi UTF-8 nên giữ được tiếng Việt.
 */

export type ZipEntry = { name: string; data: Uint8Array };

const TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

export function crc32(data: Uint8Array) {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) crc = TABLE[(crc ^ data[i]!) & 0xff]! ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** Bản ghi nhị phân little-endian: mỗi phần tử là [số byte, giá trị]. */
function record(fields: [2 | 4, number][]) {
  const out = new Uint8Array(fields.reduce((sum, [size]) => sum + size, 0));
  const view = new DataView(out.buffer);
  let at = 0;
  for (const [size, value] of fields) {
    if (size === 2) view.setUint16(at, value, true);
    else view.setUint32(at, value, true);
    at += size;
  }
  return out;
}

/** Bit 11: tên file là UTF-8. */
const UTF8 = 0x0800;
/** 01/01/1980: không ghi giờ thật của máy vào file. */
const DOS_DATE = 0x0021;

export function createZip(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const files: Uint8Array[] = [];
  const directory: Uint8Array[] = [];
  let offset = 0;

  for (const { name, data } of entries) {
    const encoded = encoder.encode(name);
    const crc = crc32(data);
    const shared: [2 | 4, number][] = [
      [2, 20],
      [2, UTF8],
      [2, 0],
      [2, 0],
      [2, DOS_DATE],
      [4, crc],
      [4, data.length],
      [4, data.length],
      [2, encoded.length],
      [2, 0],
    ];
    const header = record([[4, 0x04034b50], ...shared]);
    files.push(header, encoded, data);
    directory.push(
      record([
        [4, 0x02014b50],
        [2, 20],
        ...shared,
        [2, 0],
        [2, 0],
        [2, 0],
        [4, 0],
        [4, offset],
      ]),
      encoded,
    );
    offset += header.length + encoded.length + data.length;
  }

  const size = directory.reduce((sum, part) => sum + part.length, 0);
  const end = record([
    [4, 0x06054b50],
    [2, 0],
    [2, 0],
    [2, entries.length],
    [2, entries.length],
    [4, size],
    [4, offset],
    [2, 0],
  ]);

  const parts = [...files, ...directory, end];
  const out = new Uint8Array(offset + size + end.length);
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}
