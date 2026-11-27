/** Nội dung và ma trận mã QR. Mọi thứ tạo trên máy (PRD 4.8). */
import { create } from 'qrcode';

export type ContentType = 'link' | 'text' | 'wifi' | 'email' | 'phone';
export type Level = 'L' | 'M' | 'Q' | 'H';

export type Fields = {
  link: string;
  text: string;
  wifiName: string;
  wifiPassword: string;
  wifiSecurity: 'WPA' | 'WEP' | 'nopass';
  wifiHidden: boolean;
  email: string;
  emailSubject: string;
  emailBody: string;
  phone: string;
};

export type Content = { value: string; error: null } | { value: null; error: string };

const ok = (value: string): Content => ({ value, error: null });
const fail = (error: string): Content => ({ value: null, error });

/** "truong.edu.vn/bai" thành "https://truong.edu.vn/bai"; địa chỉ có giao thức giữ nguyên. */
export function normalizeLink(text: string) {
  const link = text.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(link)) return link;
  return /^[^\s/]+\.[^\s/]{2,}(\/\S*)?$/.test(link) ? `https://${link}` : link;
}

const escapeWifi = (text: string) => text.replace(/([\\;,:"])/g, '\\$1');

export function buildContent(type: ContentType, fields: Fields): Content {
  switch (type) {
    case 'link': {
      const link = normalizeLink(fields.link);
      return link ? ok(link) : fail('Nhập đường link cần tạo mã.');
    }
    case 'text': {
      const text = fields.text.trim();
      return text ? ok(text) : fail('Nhập nội dung cần tạo mã.');
    }
    case 'wifi': {
      const { wifiName: name, wifiPassword: password, wifiSecurity: security } = fields;
      if (!name.trim()) return fail('Nhập tên mạng Wi-Fi.');
      const open = security === 'nopass';
      if (!open && !password) return fail('Nhập mật khẩu, hoặc chọn “Không mật khẩu”.');
      return ok(
        `WIFI:T:${security};S:${escapeWifi(name)};` +
          (open ? '' : `P:${escapeWifi(password)};`) +
          (fields.wifiHidden ? 'H:true;' : '') +
          ';',
      );
    }
    case 'email': {
      const email = fields.email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Nhập địa chỉ email hợp lệ.');
      const query = [
        fields.emailSubject && `subject=${encodeURIComponent(fields.emailSubject)}`,
        fields.emailBody && `body=${encodeURIComponent(fields.emailBody)}`,
      ].filter(Boolean);
      return ok(`mailto:${email}${query.length ? `?${query.join('&')}` : ''}`);
    }
    case 'phone': {
      const phone = fields.phone.replace(/[\s().-]/g, '');
      return /^\+?\d{3,15}$/.test(phone)
        ? ok(`tel:${phone}`)
        : fail('Nhập số điện thoại, chỉ gồm chữ số và dấu + ở đầu.');
    }
  }
}

export type Matrix = { size: number; dark: (row: number, column: number) => boolean };

/** null khi nội dung dài quá sức chứa của mã QR. */
export function createMatrix(value: string, level: Level): Matrix | null {
  try {
    const { modules } = create(value.normalize('NFC'), { errorCorrectionLevel: level });
    return {
      size: modules.size,
      dark: (row, column) => Boolean(modules.get(row, column)),
    };
  } catch {
    return null;
  }
}

/** Vùng trắng quanh mã, tính theo ô (chuẩn QR là 4). */
export const QUIET = 4;

/** Path gồm các dải ô tối liền nhau, tọa độ tính cả vùng trắng. */
export function matrixPath({ size, dark }: Matrix) {
  let d = '';
  for (let row = 0; row < size; row++) {
    for (let column = 0; column < size; column++) {
      if (!dark(row, column)) continue;
      let end = column + 1;
      while (end < size && dark(row, end)) end++;
      const width = end - column;
      d += `M${column + QUIET} ${row + QUIET}h${width}v1h-${width}z`;
      column = end;
    }
  }
  return d;
}

/** Logo chiếm tối đa chừng này bề rộng mã (kể cả nền trắng) mà vẫn quét được ở mức H. */
export const LOGO_SHARE = 0.22;

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
};

/** Cảnh báo màu khiến máy quét khó đọc; null khi ổn. */
export function colorWarning(foreground: string, background: string) {
  const dark = luminance(foreground);
  const light = luminance(background);
  if (dark >= light) return 'Mã nên đậm hơn nền: nhiều máy không đọc được mã sáng trên nền tối.';
  if ((light + 0.05) / (dark + 0.05) < 4) {
    return 'Màu mã và nền gần nhau quá, máy có thể không quét được.';
  }
  return null;
}

export const MAX_BULK = 120;

export type Entry = { label: string; value: string };

/** Mỗi dòng "Nhãn | nội dung"; không có dấu | thì nhãn cũng là nội dung. */
export function parseBulk(text: string) {
  const entries: Entry[] = [];
  let dropped = 0;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const bar = line.indexOf('|');
    const label = (bar >= 0 ? line.slice(0, bar) : line).trim();
    const value = normalizeLink(bar >= 0 ? line.slice(bar + 1) : line);
    if (!value || entries.length >= MAX_BULK) dropped++;
    else entries.push({ label, value });
  }
  return { entries, dropped };
}
