import { createCanvas, loadImage } from '@napi-rs/canvas';
import { expect, test, type Page } from '@playwright/test';
import jsQR from 'jsqr';
import {
  downloadFile,
  expectNoSideScroll,
  findOverflow,
  openGroup,
  printPdf,
  type Pixels,
  printFonts,
  rasterize,
  readPdf,
  squash,
} from './helpers';

const items = (page: Page) => page.locator('.a4-page [data-item]');

function decode(image: Pixels) {
  const found = jsQR(image.data, image.width, image.height);
  return found && new TextDecoder().decode(new Uint8Array(found.binaryData));
}

async function pngPixels(data: Buffer): Promise<Pixels> {
  const image = await loadImage(data);
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0);
  return context.getImageData(0, 0, image.width, image.height);
}

async function open(page: Page) {
  await page.goto('/tao-ma-qr');
  await expect(page.getByRole('textbox', { name: 'Đường link' })).toBeVisible();
}

test('chưa nhập thì nhắc và khoá nút in', async ({ page }) => {
  await open(page);
  await expect(page.getByText('Nhập đường link cần tạo mã.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'In ngay' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Tải PNG' })).toHaveCount(0);
});

test('PNG, SVG, PDF và bản in đều quét ra đúng link, kể cả có màu và logo', async ({ page }) => {
  await open(page);
  await page.getByRole('textbox', { name: 'Đường link' }).fill('truong.edu.vn/bai-tap/3a');
  const expected = 'https://truong.edu.vn/bai-tap/3a';
  await expect(items(page)).toHaveCount(1);

  await openGroup(page, 'Màu, logo');
  await page.getByLabel('Màu mã').fill('#1d4ed8');
  const logo = createCanvas(120, 60);
  logo.getContext('2d').fillStyle = '#ff0000';
  logo.getContext('2d').fillRect(0, 0, 120, 60);
  await page.getByLabel('Chọn logo giữa mã').setInputFiles({
    name: 'logo.png',
    mimeType: 'image/png',
    buffer: logo.toBuffer('image/png'),
  });
  await expect(page.locator('.a4-page img')).toBeVisible();

  const png = await downloadFile(page, 'Tải PNG');
  expect(png.name).toBe('ma-qr.png');
  expect(decode(await pngPixels(png.data))).toBe(expected);

  const svg = await downloadFile(page, 'Tải SVG');
  expect(svg.data.toString()).toContain('<image href="data:image/png');
  expect(decode(await pngPixels(await renderSvg(page, svg.data.toString())))).toBe(expected);

  for (const data of [
    await printPdf(page),
    (await downloadFile(page, 'Tải PDF')).data,
  ]) {
    expect(await readPdf(data)).toHaveLength(1);
    expect(decode(await rasterize(data, 4))).toBe(expected);
  }
});

/** Dựng SVG bằng chính trình duyệt rồi trả về PNG. */
async function renderSvg(page: Page, svg: string) {
  const url = await page.evaluate(async (source) => {
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 800;
    canvas.getContext('2d')!.drawImage(image, 0, 0, 800, 800);
    return canvas.toDataURL('image/png');
  }, svg);
  return Buffer.from(url.split(',')[1]!, 'base64');
}

test('Wi-Fi; nội dung quá dài báo lỗi; cảnh báo màu', async ({ page }) => {
  await open(page);
  await page.getByRole('combobox', { name: 'Loại nội dung' }).selectOption('wifi');
  await page.getByRole('textbox', { name: 'Tên mạng Wi-Fi' }).fill('Lớp 3A');
  await page.getByRole('textbox', { name: 'Mật khẩu' }).fill('hoc;tot');
  const png = await downloadFile(page, 'Tải PNG');
  expect(decode(await pngPixels(png.data))).toBe('WIFI:T:WPA;S:Lớp 3A;P:hoc\\;tot;;');

  await page.getByRole('combobox', { name: 'Loại nội dung' }).selectOption('text');
  await page.getByRole('textbox', { name: 'Văn bản' }).fill('ữ'.repeat(1500));
  await expect(page.getByText('quá sức chứa')).toBeVisible();

  await openGroup(page, 'Màu, logo');
  await page.getByLabel('Màu mã').fill('#eeeeee');
  await expect(page.getByText('gần nhau quá')).toBeVisible();
});

test('in hàng loạt: đủ trang, đủ nhãn, từng mã quét được', async ({ page }) => {
  await open(page);
  await page.getByRole('combobox', { name: 'Số lượng' }).selectOption('bulk');
  const lines = Array.from({ length: 8 }, (_, i) => `Bạn Số ${i + 1} | truong.vn/b/${i + 1}`);
  await page.getByRole('textbox', { name: /Mỗi dòng: nhãn/ }).fill(lines.join('\n'));
  await openGroup(page, 'In trên giấy');
  await page.getByRole('combobox', { name: 'Số mã mỗi trang' }).selectOption('6');
  await expect(page.getByText('2 trang A4')).toBeVisible();
  await expect(items(page)).toHaveCount(8);

  const pdf = (await downloadFile(page, 'Tải PDF')).data;
  const pages = await readPdf(pdf);
  expect(pages).toHaveLength(2);
  for (let i = 1; i <= 8; i++) {
    expect(pages[i > 6 ? 1 : 0]!.text).toContain(squash(`Bạn Số ${i}`));
  }
  // Cắt riêng từng ô trên trang 1 rồi quét.
  const image = await rasterize(pdf, 6);
  const cell = { width: 93, height: 90.6 };
  for (let i = 0; i < 6; i++) {
    const x = Math.round((12 + (i % 2) * cell.width) * 6);
    const y = Math.round((12 + Math.floor(i / 2) * cell.height) * 6);
    const width = Math.floor(cell.width * 6);
    const height = Math.floor(cell.height * 6);
    const data = new Uint8ClampedArray(width * height * 4);
    for (let row = 0; row < height; row++) {
      const start = ((y + row) * image.width + x) * 4;
      data.set(image.data.slice(start, start + width * 4), row * width * 4);
    }
    expect(decode({ data, width, height }), `ô ${i + 1}`).toBe(`https://truong.vn/b/${i + 1}`);
  }
});

test('nhãn dài không tràn ô, với mọi số mã mỗi trang, font, cỡ chữ', async ({ page }) => {
  test.setTimeout(180_000);
  await open(page);
  const bulk = Array.from(
    { length: 31 },
    (_, i) => `Nguyễn Thị Phương Thương lớp Ba trường Tiểu học Minh Khai ${i} | a.vn/${i}`,
  ).join('\n');
  const problems: string[] = [];
  for (const [font, family] of await printFonts(page)) {
    for (const largeText of [false, true]) {
      for (const perPage of [1, 4, 6, 12, 20, 30]) {
        const found = await findOverflow(
          page,
          'kcc:tool:tao-ma-qr',
          { mode: 'bulk', bulk, perPage, font, largeText, title: 'Mã bài tập của lớp 3A' },
          family,
        );
        // Mã QR và nhãn phải nằm trọn trong ô.
        const outside = await page.evaluate(() =>
          [...document.querySelectorAll('.a4-page [data-item]')].some((cell) => {
            const box = cell.getBoundingClientRect();
            return [...cell.children].some((child) => {
              const r = child.getBoundingClientRect();
              return r.top < box.top - 1 || r.bottom > box.bottom + 1;
            });
          }),
        );
        if (outside) found.push('tràn ô');
        problems.push(...found.map((p) => `${font} ${largeText} ${perPage}: ${p}`));
      }
    }
  }
  expect(problems).toEqual([]);
});

test('nhớ tùy chọn, "Về mặc định" xoá được; 375px không tràn ngang', async ({ page }) => {
  await open(page);
  const link = page.getByRole('textbox', { name: 'Đường link' });
  await link.fill('a.vn');
  await page.reload();
  await expect(link).toHaveValue('a.vn');
  await page.getByRole('button', { name: 'Về mặc định' }).click();
  await expect(link).toHaveValue('');
  await page.setViewportSize({ width: 375, height: 740 });
  await expectNoSideScroll(page);
});
