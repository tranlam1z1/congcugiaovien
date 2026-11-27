import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import { PDFDocument } from 'pdf-lib';

test('HTML dựng sẵn có nội dung và thẻ SEO', async ({ request }) => {
  const html = await (await request.get('/giay-khen')).text();
  expect(html).toContain('<title>Giấy khen | Kho Công Cụ Giáo Viên</title>');
  expect(html).toContain('property="og:title"');
  expect(html).toContain('"@type":"SoftwareApplication"');
  expect(html).toMatch(/<h1[^>]*>Giấy khen<\/h1>/);
});

test('hydrate không báo lỗi; trang lạ hiện 404', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));

  for (const path of ['/', '/lop-2', '/giay-khen', '/gioi-thieu', '/#nhom=tro-choi']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  }
  await expect(page.locator('#cong-cu').getByRole('article')).toHaveCount(9);
  expect(errors).toEqual([]);

  await page.goto('/khong-co-trang-nay');
  await expect(page.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeVisible();
});

test('công cụ phieu-toan: dựng sẵn đủ SEO, hydrate với tùy chọn đã lưu', async ({
  page,
  request,
}) => {
  const html = await (await request.get('/phieu-toan')).text();
  expect(html).toContain('"@type":"FAQPage"');
  expect(html).toContain('Cách dùng');
  expect(html).toContain('class="a4-page"');

  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  await page.addInitScript(() =>
    localStorage.setItem('kcc:tool:phieu-toan', JSON.stringify({ range: 100, copies: 2 })),
  );
  await page.goto('/phieu-toan');
  await expect(page.getByText('3 trang A4')).toBeVisible();
  expect(errors).toEqual([]);
});

for (const [slug, stored, expected] of [
  ['phieu-tieng-viet', { form: 'noi' }, 'Nối để được từ đúng'],
  ['tinh-diem-xep-loai', { mode: 'year' }, 'TB học kỳ II'],
  ['giay-o-ly', { page: 'a5', pages: 2 }, '2 trang A5'],
  ['chia-nhom', { by: 'size' }, 'Số em mỗi nhóm (tối đa)'],
  ['tao-ma-qr', { link: 'a.vn', perPage: 4 }, '1 trang A4'],
  ['o-chu-tim-tu', { kind: 'o-chu' }, 'Hàng ngang'],
  ['to-mau-theo-phep-tinh', { cells: 100, copies: 2 }, '3 trang A4'],
  ['cong-cu-tren-lop', { tab: 'dem-nguoc', minutes: 7 }, '7:00'],
  ['tap-viet-chu', { text: 'mẹ', students: 'An\nBình' }, '2 trang A4'],
  ['tap-viet-tieng-anh', { lettering: 'cursive', text: 'cat', students: 'An\nBình' }, '2 trang A4'],
  ['the-tu-vung-tieng-anh', { perPage: 4 }, '4 trang A4'],
  ['nhan-xet-hoc-sinh', { pronoun: 'con' }, 'Chưa có học sinh.'],
  ['tro-choi-on-tap', { tab: 'chuong-vang' }, 'Câu 1/6'],
  ['cong-cu-pdf-anh', { tab: 'tach' }, 'Chọn file cần tách'],
] as const) {
  test(`${slug}: dựng sẵn và hydrate với tùy chọn đã lưu`, async ({ page, request }) => {
    const html = await (await request.get(`/${slug}`)).text();
    expect(html).toContain('"@type":"FAQPage"');
    expect(html).toContain('Cách dùng');

    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
    await page.addInitScript(
      ([key, value]) => localStorage.setItem(key!, value!),
      [`kcc:tool:${slug}`, JSON.stringify(stored)],
    );
    await page.goto(`/${slug}`);
    await expect(page.getByText(expected).first()).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test('cong-cu-pdf-anh: Web Worker và hình xem trước chạy trên bản build', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const doc = await PDFDocument.create();
  doc.addPage([200, 300]);
  doc.addPage([200, 300]);
  const file = { name: 'de.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await doc.save()) };

  await page.goto('/cong-cu-pdf-anh');
  await page.getByRole('button', { name: 'Xoay, xoá, sắp xếp trang' }).click();
  const region = page.getByRole('region', { name: 'Xoay, xoá, sắp xếp trang' });
  await region.getByLabel('Chọn file PDF').setInputFiles(file);
  await expect(region.locator('img[src^="data:image/jpeg"]')).toHaveCount(2);
  const wait = page.waitForEvent('download');
  await region.getByRole('button', { name: 'Lưu PDF' }).click();
  const saved = await PDFDocument.load(await readFile(await (await wait).path()));
  expect(saved.getPageCount()).toBe(2);
  expect(errors).toEqual([]);
});

test('trang thử khung in không có trong bản build', async ({ page }) => {
  await page.goto('/_khung-thu');
  await expect(page.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeVisible();
});
