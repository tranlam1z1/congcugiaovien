import jsQR from 'jsqr';
import { describe, expect, it } from 'vitest';
import { createRng } from '@/core/rng';
import {
  buildContent,
  colorWarning,
  createMatrix,
  LOGO_SHARE,
  matrixPath,
  normalizeLink,
  parseBulk,
  QUIET,
  type Fields,
  type Level,
  type Matrix,
} from './qr';

const SCALE = 4;

/** Dựng ảnh từ path đúng như bản vẽ SVG, rồi để jsQR đọc lại. */
function scan(matrix: Matrix, logo = false) {
  const modules = matrix.size + 2 * QUIET;
  const width = modules * SCALE;
  const pixels = new Uint8ClampedArray(width * width * 4).fill(255);
  const paint = (x: number, y: number, w: number, h: number, shade: number) => {
    for (let py = Math.floor(y * SCALE); py < Math.ceil((y + h) * SCALE); py++) {
      for (let px = Math.floor(x * SCALE); px < Math.ceil((x + w) * SCALE); px++) {
        pixels.fill(shade, (py * width + px) * 4, (py * width + px) * 4 + 3);
      }
    }
  };
  for (const [, x, y, w] of matrixPath(matrix).matchAll(/M(\d+) (\d+)h(\d+)/g)) {
    paint(Number(x), Number(y), Number(w), 1, 0);
  }
  if (logo) {
    const side = modules * LOGO_SHARE;
    paint((modules - side) / 2, (modules - side) / 2, side, side, 255);
  }
  const found = jsQR(pixels, width, width);
  return found && new TextDecoder().decode(new Uint8Array(found.binaryData));
}

const FIELDS: Fields = {
  link: '',
  text: '',
  wifiName: '',
  wifiPassword: '',
  wifiSecurity: 'WPA',
  wifiHidden: false,
  email: '',
  emailSubject: '',
  emailBody: '',
  phone: '',
};

const build = (type: Parameters<typeof buildContent>[0], patch: Partial<Fields>) =>
  buildContent(type, { ...FIELDS, ...patch });

describe('nội dung', () => {
  it('link thêm https khi thiếu giao thức', () => {
    expect(normalizeLink(' truong.edu.vn/bai-1 ')).toBe('https://truong.edu.vn/bai-1');
    expect(normalizeLink('http://a.vn')).toBe('http://a.vn');
    expect(normalizeLink('Bài tập số 1')).toBe('Bài tập số 1');
  });

  it('Wi-Fi thoát ký tự đặc biệt', () => {
    expect(
      build('wifi', { wifiName: 'Lớp;1', wifiPassword: 'a:b"c\\', wifiHidden: true }).value,
    ).toBe('WIFI:T:WPA;S:Lớp\\;1;P:a\\:b\\"c\\\\;H:true;;');
    expect(build('wifi', { wifiName: 'Mở', wifiSecurity: 'nopass' }).value).toBe(
      'WIFI:T:nopass;S:Mở;;',
    );
  });

  it('email và số điện thoại', () => {
    expect(build('email', { email: 'a@b.vn', emailSubject: 'Nộp bài' }).value).toBe(
      'mailto:a@b.vn?subject=N%E1%BB%99p%20b%C3%A0i',
    );
    expect(build('phone', { phone: '+84 (90) 123.45-67' }).value).toBe('tel:+84901234567');
  });

  it('thiếu hoặc sai thì báo lỗi', () => {
    for (const type of ['link', 'text', 'wifi', 'email', 'phone'] as const) {
      expect(build(type, {}).error, type).not.toBeNull();
    }
    expect(build('wifi', { wifiName: 'A' }).error).toContain('mật khẩu');
    expect(build('phone', { phone: 'abc' }).error).not.toBeNull();
  });
});

describe('mã QR', () => {
  it('quét lại đúng nội dung tiếng Việt ở mọi mức sửa lỗi', () => {
    const rng = createRng(12);
    const alphabet = [...'abcdefgh 0123456789:/?=&;.-ếữợđÁỸ'];
    for (let i = 0; i < 160; i++) {
      const value = Array.from({ length: rng.int(1, 120) }, () => rng.pick(alphabet)).join('');
      const level = (['L', 'M', 'Q', 'H'] as Level[])[i % 4]!;
      expect(scan(createMatrix(value, level)!), `${level} ${value}`).toBe(value.normalize('NFC'));
    }
  }, 60_000);

  it('vẫn quét được khi logo che giữa mã ở mức H', () => {
    const rng = createRng(13);
    for (let i = 0; i < 120; i++) {
      const value = `https://truong.edu.vn/bai/${'x'.repeat(rng.int(0, 150))}${i}`;
      expect(scan(createMatrix(value, 'H')!, true), value).toBe(value);
    }
  }, 60_000);

  it('nội dung quá dài trả về null', () => {
    expect(createMatrix('x'.repeat(3000), 'L')).toBeNull();
    expect(createMatrix('x'.repeat(1000), 'L')).not.toBeNull();
  });

  it('cảnh báo màu khó quét', () => {
    expect(colorWarning('#000000', '#ffffff')).toBeNull();
    expect(colorWarning('#ffffff', '#000000')).toContain('đậm hơn nền');
    expect(colorWarning('#cccccc', '#ffffff')).toContain('gần nhau');
  });
});

describe('in hàng loạt', () => {
  it('tách nhãn và nội dung', () => {
    expect(parseBulk('An | truong.vn/an\n\nXin chào\nTrống |\n').entries).toEqual([
      { label: 'An', value: 'https://truong.vn/an' },
      { label: 'Xin chào', value: 'Xin chào' },
    ]);
    expect(parseBulk('Trống |').dropped).toBe(1);
  });

  it('tối đa 120 mã', () => {
    const { entries, dropped } = parseBulk(Array(130).fill('a').join('\n'));
    expect(entries).toHaveLength(120);
    expect(dropped).toBe(10);
  });
});
