import { createCanvas } from '@napi-rs/canvas';
import { expect, test, type Page } from '@playwright/test';
import { unzipSync } from 'fflate';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { downloadFile, expectNoSideScroll, PT_PER_MM, rasterize, readPdf } from './helpers';

/** File PDF thử: mỗi trang ghi một nhãn. */
async function pdf(name: string, labels: string[]) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const label of labels) {
    doc.addPage([300, 400]).drawText(label, { x: 40, y: 300, size: 40, font });
  }
  return { name, mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) };
}

/** Ảnh nền trắng, nửa trái đỏ. */
function picture(name: string, width: number, height: number, type: 'image/png' | 'image/jpeg') {
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, width, height);
  context.fillStyle = '#ff0000';
  context.fillRect(0, 0, width / 2, height);
  const buffer =
    type === 'image/png' ? canvas.toBuffer('image/png') : canvas.toBuffer('image/jpeg', 95);
  return { name, mimeType: type, buffer };
}

/** Chèn khối EXIF ghi hướng 6 (máy cầm dọc: phải xoay phải 90 độ khi xem). */
function sideways(file: ReturnType<typeof picture>) {
  const exif = Buffer.from([
    0xff, 0xe1, 0x00, 0x22, 0x45, 0x78, 0x69, 0x66, 0x00, 0x00, 0x4d, 0x4d, 0x00, 0x2a, 0x00,
    0x00, 0x00, 0x08, 0x00, 0x01, 0x01, 0x12, 0x00, 0x03, 0x00, 0x00, 0x00, 0x01, 0x00, 0x06,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);
  return {
    ...file,
    buffer: Buffer.concat([file.buffer.subarray(0, 2), exif, file.buffer.subarray(2)]),
  };
}

async function open(page: Page, tab?: string) {
  await page.goto('/cong-cu-pdf-anh');
  await expect(page.getByText('Chọn ảnh', { exact: true })).toBeVisible();
  if (tab) await page.getByRole('button', { name: tab, exact: true }).click();
}

const panel = (page: Page, name: string) => page.getByRole('region', { name });
type Upload = { name: string; mimeType: string; buffer: Buffer };
const choose = (page: Page, region: string, label: string, files: Upload[]) =>
  panel(page, region).getByLabel(label).setInputFiles(files);
const names = async (data: Buffer) => (await readPdf(data)).map((p) => p.text);

const ORGANIZE = 'Xoay, xoá, sắp xếp trang';

test('ảnh sang PDF: thứ tự, khổ trang, ảnh chụp dọc được dựng đúng chiều', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const sent: string[] = [];
  page.on('request', (r) => r.method() !== 'GET' && sent.push(r.url()));
  await open(page);
  const region = 'Ảnh sang PDF';
  await choose(page, region, 'Chọn ảnh', [
    picture('ngang.png', 400, 200, 'image/png'),
    sideways(picture('doc.jpg', 400, 200, 'image/jpeg')),
  ]);
  await expect(panel(page, region).getByRole('listitem')).toHaveCount(2);

  const first = await downloadFile(page, 'Tạo PDF');
  expect(first.name).toBe('anh.pdf');
  const pages = await readPdf(first.data);
  expect(pages.map((p) => [Math.round(p.width), Math.round(p.height)])).toEqual([
    [297, 210],
    [210, 297],
  ]);
  // Ảnh thứ hai xoay phải: nửa đỏ nằm trên, nửa trắng nằm dưới.
  const image = await rasterize(first.data, 2, 2);
  const pixel = (xMm: number, yMm: number) => {
    const i = (Math.round(yMm * 2) * image.width + Math.round(xMm * 2)) * 4;
    return [...image.data.slice(i, i + 3)];
  };
  expect(pixel(105, 80)[1]).toBeLessThan(60);
  expect(pixel(105, 220)[1]).toBeGreaterThan(200);
  expect(pixel(2, 2)[1]).toBeGreaterThan(200);

  await panel(page, region).getByRole('button', { name: 'Đưa doc.jpg lên trước' }).click();
  await panel(page, region).getByRole('button', { name: 'Xoay ngang.png' }).click();
  await page.getByRole('combobox', { name: 'Khổ trang' }).selectOption('anh');
  await page.getByRole('combobox', { name: 'Lề' }).selectOption('0');
  const second = await readPdf((await downloadFile(page, 'Tạo PDF')).data);
  // 96 dpi: 200×400 điểm ảnh là 150×300 điểm PDF.
  expect(second.map((p) => [p.width, p.height].map((mm) => Math.round(mm * PT_PER_MM)))).toEqual([
    [150, 300],
    [150, 300],
  ]);
  await expect(panel(page, region).getByRole('status')).toContainText('Đã tải anh.pdf');
  expect(sent).toEqual([]);
  expect(errors).toEqual([]);
});

test('ghép PDF theo thứ tự đã sắp, kéo thả đổi chỗ; file hỏng bị chặn', async ({ page }) => {
  await open(page, 'Ghép PDF');
  const region = 'Ghép PDF';
  const run = panel(page, region).getByRole('button', { name: 'Ghép PDF' });
  await choose(page, region, 'Chọn file PDF', [await pdf('mot.pdf', ['A1', 'A2'])]);
  await expect(run).toBeDisabled();
  await choose(page, region, 'Chọn file PDF', [await pdf('hai.pdf', ['B1'])]);
  await expect(panel(page, region).getByText('File ghép có 3 trang.')).toBeVisible();

  const items = panel(page, region).getByRole('listitem');
  await items.nth(1).dragTo(items.nth(0));
  await expect(items.first()).toContainText('hai.pdf');
  const merged = await downloadFile(page, 'Ghép PDF', panel(page, region));
  expect(merged.name).toBe('hai-ghep.pdf');
  expect(await names(merged.data)).toEqual(['B1', 'A1', 'A2']);

  await choose(page, region, 'Chọn file PDF', [
    { name: 'hong.pdf', mimeType: 'application/pdf', buffer: Buffer.from('hỏng') },
  ]);
  await expect(panel(page, region).getByRole('alert')).toContainText('Không đọc được “hong.pdf”');
  await expect(run).toBeDisabled();
  await panel(page, region).getByRole('button', { name: 'Bỏ hong.pdf' }).click();
  await expect(run).toBeEnabled();
});

test('tách PDF theo khoảng và từng trang', async ({ page }) => {
  await open(page, 'Tách PDF');
  const region = 'Tách PDF';
  await choose(page, region, 'Chọn file cần tách', [
    await pdf('de.pdf', ['T1', 'T2', 'T3', 'T4']),
  ]);
  await expect(panel(page, region).getByText('4 trang', { exact: false })).toBeVisible();
  const ranges = page.getByRole('textbox', { name: 'Khoảng trang' });
  await ranges.fill('2-9');
  await expect(panel(page, region).getByText('ngoài phạm vi')).toBeVisible();
  await expect(panel(page, region).getByRole('button', { name: 'Tách PDF' })).toBeDisabled();

  await ranges.fill('2-3');
  const one = await downloadFile(page, 'Tách PDF', panel(page, region));
  expect(one.name).toBe('de-trang-2-3.pdf');
  expect(await names(one.data)).toEqual(['T2', 'T3']);

  await ranges.fill('1, 3-');
  const zip = await downloadFile(page, 'Tách PDF', panel(page, region));
  expect(zip.name).toBe('de-tach.zip');
  const files = unzipSync(new Uint8Array(zip.data));
  expect(Object.keys(files)).toEqual(['de-trang-1.pdf', 'de-trang-3-4.pdf']);
  expect(await names(Buffer.from(files['de-trang-3-4.pdf']!))).toEqual(['T3', 'T4']);

  await page.getByRole('combobox', { name: 'Cách tách' }).selectOption('tung-trang');
  await expect(panel(page, region).getByText('Sẽ tạo 4 file PDF')).toBeVisible();
  const each = await downloadFile(page, 'Tách PDF', panel(page, region));
  expect(Object.keys(unzipSync(new Uint8Array(each.data)))).toHaveLength(4);
});

test('xoay, bỏ, đổi thứ tự trang từ hai file, có hình xem trước', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page, ORGANIZE);
  await choose(page, ORGANIZE, 'Chọn file PDF', [
    await pdf('a.pdf', ['A1', 'A2']),
    await pdf('b.pdf', ['B1']),
  ]);
  const region = panel(page, ORGANIZE);
  await expect(region.getByRole('listitem')).toHaveCount(3);
  await expect(region.locator('img[src^="data:image/jpeg"]')).toHaveCount(3);

  await region.getByRole('button', { name: 'Đưa trang 3 lên trước' }).click();
  await region.getByRole('button', { name: 'Bỏ trang 1' }).click();
  await region.getByRole('button', { name: 'Xoay trang 1' }).click();
  await expect(region.locator('img').first()).toHaveAttribute('data-rotation', '90');
  const out = await downloadFile(page, 'Lưu PDF');
  expect(out.name).toBe('b-sua.pdf');
  expect(await names(out.data)).toEqual(['B1', 'A2']);
  const doc = await PDFDocument.load(out.data);
  expect(doc.getPages().map((p) => p.getRotation().angle)).toEqual([90, 0]);

  // Chuyển mục rồi quay lại vẫn còn.
  await page.getByRole('button', { name: 'Ghép PDF', exact: true }).click();
  await page.getByRole('button', { name: ORGANIZE }).click();
  await expect(region.getByRole('listitem')).toHaveCount(2);
  await region.getByRole('button', { name: 'Xoá hết' }).click();
  await expect(region.getByRole('listitem')).toHaveCount(0);
  await expect(region.getByRole('button', { name: 'Lưu PDF' })).toBeDisabled();
  expect(errors).toEqual([]);
});

test('nhớ mục đang dùng; 375px không tràn ngang', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await open(page, ORGANIZE);
  await choose(page, ORGANIZE, 'Chọn file PDF', [await pdf('tên file rất dài '.repeat(8) + '.pdf', ['A'])]);
  await expect(panel(page, ORGANIZE).getByRole('listitem')).toHaveCount(1);
  await expectNoSideScroll(page);
  await page.getByRole('button', { name: 'Ghép PDF', exact: true }).click();
  await choose(page, 'Ghép PDF', 'Chọn file PDF', [await pdf('x'.repeat(120) + '.pdf', ['A'])]);
  await expect(panel(page, 'Ghép PDF').getByRole('listitem')).toHaveCount(1);
  await expectNoSideScroll(page);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Ghép PDF', exact: true }).first()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
