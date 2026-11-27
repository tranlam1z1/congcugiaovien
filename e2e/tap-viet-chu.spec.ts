import { expect, test, type Page } from '@playwright/test';
import {
  downloadFile,
  expectNoSideScroll,
  openGroup,
  pageCount,
  printPdf,
  rasterize,
  readPdf,
  squash,
  type Pixels,
} from './helpers';

async function open(page: Page) {
  await page.goto('/tap-viet-chu');
  await expect(page.getByText(/^[1-9]\d* trang A4$/)).toBeVisible();
}

const select = (page: Page, name: string) => page.getByRole('combobox', { name, exact: true });
const number = (page: Page, name: string) => page.getByRole('spinbutton', { name });
const content = (page: Page) => page.getByRole('textbox', { name: /^Nội dung/ });
const samples = (page: Page, kind: string) => page.locator(`.a4-page [data-sample="${kind}"]`);

/** Tỉ lệ điểm ảnh khác nhau rõ rệt giữa hai ảnh cùng cỡ. */
function difference(a: Pixels, b: Pixels) {
  expect([a.width, a.height]).toEqual([b.width, b.height]);
  let count = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    if (Math.abs(a.data[i]! - b.data[i]!) > 96) count++;
  }
  return count / (a.data.length / 4);
}

const inked = (image: Pixels) => {
  let count = 0;
  for (let i = 0; i < image.data.length; i += 4) if (image.data[i]! < 128) count++;
  return count / (image.data.length / 4);
};

test('PDF khớp bản in với cả ba kiểu chữ để tô', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  await open(page);
  await content(page).fill('Bé yêu quê nhà\nẪ Ỗ g y');
  await openGroup(page, 'Kiểu chữ mẫu');
  // Chữ đậm để so điểm ảnh rõ ràng.
  await number(page, 'Độ mờ (%)').fill('0');

  for (const style of ['mo', 'cham', 'rong']) {
    await select(page, 'Kiểu chữ để tô').selectOption(style);
    await expect(samples(page, style).first()).toBeAttached();
    const total = await pageCount(page);
    const printed = await printPdf(page);
    const exported = (await downloadFile(page, 'Tải PDF')).data;
    for (const data of [printed, exported]) {
      const pages = await readPdf(data);
      expect(pages, style).toHaveLength(total);
      expect(Math.abs(pages[0]!.width - 210)).toBeLessThan(0.5);
      expect(Math.abs(pages[0]!.height - 297)).toBeLessThan(0.5);
      expect(pages[0]!.text).toContain(squash('Luyện viết chữ'));
    }
    const a = await rasterize(printed, 4);
    const b = await rasterize(exported, 4);
    expect(inked(b), style).toBeGreaterThan(0.004);
    expect(difference(a, b), style).toBeLessThan(0.008);
  }
  expect(errors).toEqual([]);
});

test('chữ không đè đầu phiếu, không ra ngoài lề ở mọi cỡ', async ({ page }) => {
  test.setTimeout(90_000);
  await open(page);
  await content(page).fill('Ẫ Ỗ Nghiêng g y\nCông cha như núi Thái Sơn, nghĩa mẹ như nước trong nguồn');
  await openGroup(page, 'Đầu phiếu');
  await page.getByRole('textbox', { name: 'Tiêu đề phiếu' }).fill('Bài luyện viết chữ đẹp tuần này'.repeat(2));
  await page.getByRole('textbox', { name: 'Trường, lớp' }).fill('Trường Tiểu học Nguyễn Thị Minh Khai');
  await openGroup(page, 'Cỡ chữ và giấy');
  for (const size of ['1', '3']) {
    for (const cell of ['4', '8']) {
      await select(page, 'Chiều cao chữ thường').selectOption(size);
      await select(page, 'Cạnh một ô').selectOption(cell);
      const issues = () =>
        page.evaluate(() => {
          const found: string[] = [];
          for (const sheet of document.querySelectorAll<HTMLElement>('.a4-page')) {
            const box = sheet.getBoundingClientRect();
            const mm = box.width / 210;
            const title = sheet.querySelector('[data-writing-header] h2')!.getBoundingClientRect();
            const grid = sheet.querySelector('[data-grid]')!.getBoundingClientRect();
            if (grid.top < title.bottom) found.push('lưới đè đầu phiếu');
            for (const path of sheet.querySelectorAll('[data-sample]')) {
              const r = path.getBoundingClientRect();
              if (r.top < title.bottom) found.push('chữ đè đầu phiếu');
              if (r.left < box.left + 8 * mm || r.right > box.right - 8 * mm) found.push('chữ ra lề');
              if (r.bottom > box.bottom - 6 * mm) found.push('chữ ra đáy');
            }
          }
          return [...new Set(found)];
        });
      await expect.poll(issues, { message: `${size} ô × ${cell} mm` }).toEqual([]);
    }
  }
});

test('mẫu có sẵn, loại giấy, đường kẻ, số dòng và danh sách học sinh', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Chữ số', exact: true }).click();
  await expect(content(page)).toHaveValue('0\n1\n2\n3\n4\n5\n6\n7\n8\n9');
  await expect(page.locator('.a4-page svg').first()).toHaveAttribute('aria-label', /: 0, 1/);

  await content(page).fill('a');
  await openGroup(page, 'Số dòng');
  await number(page, 'Số dòng cho mỗi mẫu').fill('3');
  await number(page, 'Dòng trống sau mỗi mẫu').fill('0');
  await expect(samples(page, 'model')).toHaveCount(3);
  await openGroup(page, 'Kiểu chữ mẫu');
  // Chỉ một chữ mỗi dòng thì dòng đầu làm mẫu, hai dòng sau để tô.
  await page.getByRole('checkbox', { name: 'Lặp chữ cho đầy dòng' }).uncheck();
  await expect(samples(page, 'model')).toHaveCount(1);
  await expect(samples(page, 'mo')).toHaveCount(2);
  await page.getByRole('checkbox', { name: 'Lặp chữ cho đầy dòng' }).check();
  await page.getByRole('checkbox', { name: 'Lặp chữ cho đầy dòng' }).uncheck();
  await expect(page.locator('.a4-page [data-sample]')).toHaveCount(3);
  await page.getByRole('checkbox', { name: 'Chữ mẫu đầu dòng in đậm' }).uncheck();
  await expect(samples(page, 'model')).toHaveCount(0);
  await expect(samples(page, 'mo')).toHaveCount(3);

  await openGroup(page, 'Cỡ chữ và giấy');
  await select(page, 'Loại giấy').selectOption('trang');
  await expect(page.locator('.a4-page [data-grid]')).toHaveCount(0);
  await page.getByRole('checkbox', { name: 'Đường chân và đường cao chữ' }).uncheck();
  await expect(page.locator('.a4-page [data-guide]')).toHaveCount(0);

  await openGroup(page, 'Danh sách học sinh');
  await page
    .getByRole('textbox', { name: /^Danh sách học sinh/ })
    .fill('Nguyễn Minh Ân\nTrần Bảo Ngọc');
  await expect(page.getByText('2 trang A4')).toBeVisible();
  const pages = await readPdf((await downloadFile(page, 'Tải PDF')).data);
  expect(pages[0]!.text).toContain(squash('Nguyễn Minh Ân'));
  expect(pages[1]!.text).toContain(squash('Trần Bảo Ngọc'));
});

test('nội dung trống thì khoá nút in; ký tự lạ được báo', async ({ page }) => {
  await open(page);
  await content(page).fill('');
  await expect(page.getByText('Nhập nội dung ở mục')).toBeVisible();
  await expect(page.getByRole('button', { name: 'In ngay' })).toBeDisabled();
  await content(page).fill('bé 汉');
  await expect(page.getByText(/không có ký tự: 汉/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'In ngay' })).toBeEnabled();
});

test('không tải được font thì báo và cho tải lại', async ({ page }) => {
  let blocked = true;
  // Chỉ chặn lần tải file font, không chặn module chứa đường dẫn của nó.
  await page.route(/PlaywriteVN_400Regular\.ttf$/, (route) =>
    blocked ? route.abort() : route.continue(),
  );
  await page.goto('/tap-viet-chu');
  await expect(page.getByText('Chưa tải được font tập viết')).toBeVisible();
  await expect(page.getByRole('button', { name: 'In ngay' })).toBeDisabled();
  blocked = false;
  await page.getByRole('button', { name: 'Tải lại font' }).click();
  await expect(page.getByText(/^[1-9]\d* trang A4$/)).toBeVisible();
});

test('nhớ tùy chọn, "Về mặc định" xoá được; 375px không tràn ngang', async ({ page }) => {
  await open(page);
  await content(page).fill('mẹ');
  await openGroup(page, 'Cỡ chữ và giấy');
  await select(page, 'Cạnh một ô').selectOption('8');
  await page.reload();
  await expect(content(page)).toHaveValue('mẹ');
  await page.getByRole('button', { name: 'Về mặc định' }).click();
  await expect(content(page)).toHaveValue('a\nă\nâ\nbé\nBà bế bé.');
  await page.setViewportSize({ width: 375, height: 740 });
  await expectNoSideScroll(page);
  await expect(page.getByRole('button', { name: 'In ngay' })).toBeVisible();
});
