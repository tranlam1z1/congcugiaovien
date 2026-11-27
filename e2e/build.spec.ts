import { expect, test } from '@playwright/test';

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

test('trang thử khung in không có trong bản build', async ({ page }) => {
  await page.goto('/_khung-thu');
  await expect(page.getByRole('heading', { name: 'Không tìm thấy trang' })).toBeVisible();
});
