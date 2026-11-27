import { expect, test } from '@playwright/test';

test('tìm không dấu, chọn bằng Enter; phím "/" mở ô tìm', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  await page.keyboard.press('/');
  const search = page.getByRole('combobox', { name: 'Tìm công cụ' });
  await expect(search).toBeFocused();
  await expect(search).toHaveValue('');

  await search.fill('giay khen');
  await expect(page.getByRole('option').first()).toContainText('Giấy khen');
  await search.press('Enter');
  await expect(page).toHaveURL('/giay-khen');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Giấy khen');
  await expect(page).toHaveTitle(/Giấy khen/);
});

test('không có kết quả thì dẫn tới Góp ý', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('combobox').fill('xyzkhongco');
  await page.getByRole('link', { name: 'Đề xuất công cụ mới' }).click();
  await expect(page).toHaveURL('/gioi-thieu#gop-y');
  await expect(page.getByRole('heading', { name: 'Góp ý' })).toBeInViewport();
});

test('lọc nhóm nằm trên URL, chia sẻ được', async ({ page }) => {
  await page.goto('/#nhom=de-kiem-tra');
  const grid = page.locator('#cong-cu');
  await expect(grid.getByRole('article')).toHaveCount(4);
  await expect(grid).toBeInViewport();

  await grid.getByRole('link', { name: 'Tô màu và vẽ' }).click();
  await expect(page).toHaveURL('/#nhom=to-mau-ve');
  await expect(grid.getByRole('article')).toHaveCount(4);
  await grid.getByRole('link', { name: 'Tất cả' }).click();
  await expect(grid.getByRole('article')).toHaveCount(60);
});

test('menu Lớp mở trang lớp xếp theo môn', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Lớp', exact: true }).click();
  await page.getByRole('banner').getByRole('link', { name: 'Lớp 1', exact: true }).click();
  await expect(page).toHaveURL('/lop-1');
  const headings = page.getByRole('main').getByRole('heading', { level: 2 });
  await expect(headings).toHaveText(['Toán', 'Tiếng Việt', 'Tiếng Anh', 'Âm nhạc', 'Chung']);

  await page.goto('/thcs-thpt');
  await expect(page.getByRole('heading', { level: 2, name: 'Đề và kiểm tra' })).toBeVisible();
});

test('ghim và dùng gần đây được nhớ sau khi tải lại', async ({ page }) => {
  await page.goto('/sudoku');
  await expect(page.getByText('Công cụ này đang được làm')).toBeVisible();
  await page.getByRole('button', { name: 'Ghim Sudoku' }).first().click();
  await page.goto('/');
  await page.reload();
  for (const title of ['Đã ghim', 'Dùng gần đây']) {
    const section = page.locator('section', { has: page.getByRole('heading', { name: title }) });
    await expect(section.getByRole('link', { name: 'Sudoku' })).toBeVisible();
  }
});

test('đổi giao diện sáng tối và nhớ lựa chọn', async ({ page }) => {
  await page.goto('/');
  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Đổi giao diện sáng hoặc tối' }).click();
  await expect(html).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'dark');
});

test('điện thoại 375px không tràn ngang', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  for (const path of ['/', '/lop-3', '/giay-o-ly', '/gioi-thieu', '/_khung-thu']) {
    await page.goto(path);
    // Trang công cụ có cả tiêu đề lẫn trang A4; chỉ cần một trong hai đã hiện.
    await expect(
      page.getByRole('heading', { level: 1 }).or(page.locator('.a4-page')).first(),
    ).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test('không gửi request ra ngoài máy chủ của trang', async ({ page, baseURL }) => {
  const external: string[] = [];
  page.on('request', (request) => {
    const url = request.url();
    if (/^https?:/.test(url) && !url.startsWith(baseURL!)) external.push(url);
  });
  await page.goto('/_khung-thu');
  await expect(page.getByText(/^[1-9]\d* trang A4$/)).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Tải PDF' }).click();
  await download;
  await page.goto('/');
  expect(external).toEqual([]);
});
