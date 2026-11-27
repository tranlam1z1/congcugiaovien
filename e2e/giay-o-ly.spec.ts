import { createCanvas } from '@napi-rs/canvas';
import { expect, test, type Page } from '@playwright/test';
import {
  downloadFile,
  expectNoSideScroll,
  openGroup,
  printPdf,
  type Pixels,
  rasterize,
  readPdf,
  squash,
} from './helpers';

async function open(page: Page) {
  await page.goto('/giay-o-ly');
  await expect(page.getByText(/^[1-9]\d* trang /)).toBeVisible();
}

const select = (page: Page, name: string) => page.getByRole('combobox', { name, exact: true });
const number = (page: Page, name: string) => page.getByRole('spinbutton', { name });

/**
 * Tâm (mm) của các đường dọc cắt ngang hàng điểm ảnh ở độ cao `atMm`.
 */
function lineCentres(image: Pixels, pixelsPerMm: number, atMm: number) {
  const y = Math.round(atMm * pixelsPerMm);
  const centres: number[] = [];
  let start = -1;
  for (let x = 0; x <= image.width; x++) {
    const i = (y * image.width + x) * 4;
    const inked = x < image.width && image.data[i]! < 235;
    if (inked && start < 0) start = x;
    if (!inked && start >= 0) {
      centres.push((start + x) / 2 / pixelsPerMm);
      start = -1;
    }
  }
  return centres;
}

test('bản in và PDF: ô đúng kích thước, sai lệch dưới 0,5 mm', async ({ page }) => {
  await open(page);
  await openGroup(page, 'Màu và nét');
  await select(page, 'Màu nét').selectOption('den');
  await number(page, 'Độ đậm nét (%)').fill('100');

  for (const size of [4, 5, 10]) {
    await select(page, 'Cỡ ô').selectOption(String(size));
    const printed = await printPdf(page);
    const exported = (await downloadFile(page, 'Tải PDF')).data;

    for (const [label, data] of [
      ['in', printed],
      ['PDF', exported],
    ] as const) {
      const pages = await readPdf(data);
      expect(pages).toHaveLength(1);
      expect(Math.abs(pages[0]!.width - 210)).toBeLessThan(0.5);
      expect(Math.abs(pages[0]!.height - 297)).toBeLessThan(0.5);
      // Đo giữa hai đường ngang để chỉ cắt các đường dọc.
      const columns = Math.floor(190 / size);
      const rows = Math.floor(277 / size);
      const top = 10 + (277 - rows * size) / 2;
      const centres = lineCentres(await rasterize(data, 10), 10, top + size * 10.5);
      expect(centres, `${label} ${size}`).toHaveLength(columns + 1);
      const first = 10 + (190 - columns * size) / 2;
      centres.forEach((centre, i) => {
        expect(Math.abs(centre - (first + i * size)), `${label} ${size} đường ${i}`).toBeLessThan(
          0.5,
        );
      });
    }
  }
});

test('đổi khổ, hướng, số trang; khổ tùy chỉnh', async ({ page }) => {
  await open(page);
  await select(page, 'Khổ giấy').selectOption('a5');
  await select(page, 'Hướng giấy').selectOption('landscape');
  await number(page, 'Số trang').fill('3');
  await expect(page.getByText('3 trang A5')).toBeVisible();
  await expect(page.getByText('Khi in, chọn khổ A5')).toBeVisible();

  for (const data of [
    await printPdf(page),
    (await downloadFile(page, 'Tải PDF')).data,
  ]) {
    const pages = await readPdf(data);
    expect(pages).toHaveLength(3);
    expect(Math.abs(pages[0]!.width - 210)).toBeLessThan(0.5);
    expect(Math.abs(pages[0]!.height - 148)).toBeLessThan(0.5);
  }

  await select(page, 'Khổ giấy').selectOption('custom');
  await number(page, 'Rộng (mm)').fill('120');
  await number(page, 'Cao (mm)').fill('500');
  await expect(page.getByText('3 trang 120×500 mm')).toBeVisible();
  const pages = await readPdf((await downloadFile(page, 'Tải PDF')).data);
  expect(Math.abs(pages[0]!.width - 120)).toBeLessThan(0.5);
  expect(Math.abs(pages[0]!.height - 500)).toBeLessThan(0.5);
});

test('mọi loại giấy vẽ được và xuất PDF không lỗi', async ({ page }) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  await open(page);
  const types = select(page, 'Loại giấy');
  const values = await types
    .locator('option')
    .evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value));
  expect(values).toHaveLength(33);

  for (const value of values) {
    await types.selectOption(value);
    const paths = page.locator('.a4-page svg path');
    if (value === 'trang') await expect(paths).toHaveCount(0);
    else expect(await paths.count(), value).toBeGreaterThan(0);
    const data = (await downloadFile(page, 'Tải PDF')).data;
    const image = await rasterize(data, 2);
    const inked = image.data.some((channel, i) => i % 4 === 0 && channel < 245);
    expect(inked, value).toBe(value !== 'trang');
  }
  expect(errors).toEqual([]);
});

test('tiêu đề, chữ chìm, lề đỏ và logo có trong PDF', async ({ page }) => {
  await open(page);
  await openGroup(page, 'Đầu phiếu');
  await page.getByRole('textbox', { name: 'Tiêu đề' }).fill('Vở luyện chữ Ễ Ữ');
  await openGroup(page, 'Màu và nét');
  await page.getByRole('checkbox', { name: 'Lề đỏ bên trái' }).check();
  await openGroup(page, 'Chữ chìm và logo');
  await page.getByRole('textbox', { name: 'Chữ chìm' }).fill('Lớp Một Ạ');

  // Logo là hình vuông đỏ 100×50.
  const logo = createCanvas(100, 50);
  const context = logo.getContext('2d');
  context.fillStyle = '#ff0000';
  context.fillRect(0, 0, 100, 50);
  await page
    .getByLabel('Chọn logo')
    .setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: logo.toBuffer('image/png') });
  await expect(page.locator('.a4-page img')).toBeVisible();
  await number(page, 'Độ đậm logo (%)').fill('100');
  await number(page, 'Xoay logo (độ)').fill('90');
  await select(page, 'Vị trí logo').selectOption('bottom-right');
  // Xoay 90 độ: ảnh cao gấp đôi rộng.
  await expect
    .poll(() => page.locator('.a4-page img').evaluate((i) => i.clientHeight / i.clientWidth))
    .toBeCloseTo(2, 1);

  const data = (await downloadFile(page, 'Tải PDF')).data;
  const [first] = await readPdf(data);
  expect(first!.text).toContain(squash('Vở luyện chữ Ễ Ữ'));
  expect(first!.text).toContain(squash('Lớp Một Ạ'));
  const image = await rasterize(data, 4);
  const pixel = (xMm: number, yMm: number) => {
    const i = (Math.round(yMm * 4) * image.width + Math.round(xMm * 4)) * 4;
    return [...image.data.slice(i, i + 3)];
  };
  // Logo 40 mm xoay thành 20 × 40 mm, sát góc dưới phải trong lề 10 mm.
  const [r, g, b] = pixel(190, 267);
  expect(r).toBeGreaterThan(200);
  expect(g! + b!).toBeLessThan(80);
});

test('đầu phiếu dài không đè lên vùng kẻ, kể cả giấy nhỏ', async ({ page }) => {
  await open(page);
  await openGroup(page, 'Đầu phiếu');
  await page.getByRole('textbox', { name: 'Tiêu đề' }).fill('Bài luyện viết chữ đẹp tuần này'.repeat(3));
  await page.getByRole('textbox', { name: 'Trường, lớp' }).fill('Trường Tiểu học Nguyễn Thị Minh Khai '.repeat(2));
  await page.getByRole('checkbox', { name: /Họ và tên/ }).check();
  await openGroup(page, 'Khổ giấy');
  for (const paper of ['a6', 'a5', 'a4', 'a3']) {
    await select(page, 'Khổ giấy').selectOption(paper);
    const gap = await page.evaluate(() => {
      const header = document.querySelector('[data-paper-header] h2')!.getBoundingClientRect();
      // Đường kẻ cao nhất của lưới.
      const grid = document.querySelector('.a4-page svg path')!.getBoundingClientRect();
      return grid.top - header.bottom;
    });
    expect(gap, paper).toBeGreaterThanOrEqual(0);
  }
});

test('nhớ tùy chọn, "Về mặc định" xoá được; 375px không tràn ngang', async ({ page }) => {
  await open(page);
  await select(page, 'Loại giấy').selectOption('cornell');
  await page.reload();
  await expect(select(page, 'Loại giấy')).toHaveValue('cornell');
  await page.getByRole('button', { name: 'Về mặc định' }).click();
  await expect(select(page, 'Loại giấy')).toHaveValue('o-ly');
  await page.setViewportSize({ width: 375, height: 740 });
  await expectNoSideScroll(page);
});
