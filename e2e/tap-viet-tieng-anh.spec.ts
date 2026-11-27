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
  await page.goto('/tap-viet-tieng-anh');
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

test('PDF khớp bản in với hai kiểu chữ, hai kiểu tô và hình minh họa', async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  await open(page);
  await content(page).fill('apple\nschool\nsun\nVW Mz 48?');
  await openGroup(page, 'Số dòng');
  await number(page, 'Dòng trống sau mỗi mẫu').fill('0');
  // Chữ đậm để so điểm ảnh rõ ràng.
  await number(page, 'Độ mờ (%)').fill('0');

  for (const lettering of ['print', 'cursive']) {
    await select(page, 'Kiểu chữ').selectOption(lettering);
    for (const style of ['mo', 'cham']) {
      const label = `${lettering} ${style}`;
      await select(page, 'Kiểu chữ để tô').selectOption(style);
      await expect(samples(page, style).first()).toBeAttached();
      await expect(page.locator('.a4-page [data-picture]')).toHaveCount(3);
      const total = await pageCount(page);
      const printed = await printPdf(page);
      const exported = (await downloadFile(page, 'Tải PDF')).data;
      for (const data of [printed, exported]) {
        const pages = await readPdf(data);
        expect(pages, label).toHaveLength(total);
        expect(Math.abs(pages[0]!.width - 210)).toBeLessThan(0.5);
        expect(pages[0]!.text).toContain(squash('Luyện viết tiếng Anh'));
      }
      const a = await rasterize(printed, 4);
      const b = await rasterize(exported, 4);
      expect(inked(b), label).toBeGreaterThan(0.004);
      expect(difference(a, b), label).toBeLessThan(0.008);
    }
  }
  expect(errors).toEqual([]);
});

test('chữ và hình không đè đầu phiếu, không ra ngoài lề ở mọi cỡ', async ({ page }) => {
  test.setTimeout(120_000);
  await open(page);
  await content(page).fill('elephant\numbrella\nQ y g\nThe quick brown fox jumps over the lazy dog.');
  await openGroup(page, 'Đầu phiếu');
  await page.getByRole('textbox', { name: 'Tiêu đề phiếu' }).fill('My handwriting practice sheet '.repeat(2));
  await page.getByRole('textbox', { name: 'Trường, lớp' }).fill('Trường Tiểu học Nguyễn Thị Minh Khai');
  for (const lettering of ['print', 'cursive']) {
    await select(page, 'Kiểu chữ').selectOption(lettering);
    for (const size of ['4', '10']) {
      await select(page, 'Khoảng cách dòng kẻ').selectOption(size);
      const issues = () =>
        page.evaluate(() => {
          const found: string[] = [];
          for (const sheet of document.querySelectorAll<HTMLElement>('.a4-page')) {
            const box = sheet.getBoundingClientRect();
            const mm = box.width / 210;
            const title = sheet.querySelector('[data-writing-header] h2')!.getBoundingClientRect();
            for (const el of sheet.querySelectorAll('[data-grid], [data-sample], [data-picture]')) {
              const r = el.getBoundingClientRect();
              if (r.top < title.bottom) found.push('đè đầu phiếu');
              if (r.left < box.left + 8 * mm || r.right > box.right - 8 * mm) found.push('ra lề');
              if (r.bottom > box.bottom - 6 * mm) found.push('ra đáy');
            }
          }
          return [...new Set(found)];
        });
      await expect.poll(issues, { message: `${lettering} ${size} mm` }).toEqual([]);
    }
  }
});

test('gói từ vựng, mẫu có sẵn, hình, số dòng và danh sách học sinh', async ({ page }) => {
  await open(page);
  await select(page, 'Gói từ vựng theo lớp').selectOption({ label: 'Lớp 3 · Fruit' });
  await expect(content(page)).toHaveValue('apple\nbanana\norange\ngrape\ncherry\nmango\nlemon\nwatermelon');
  // Mango và watermelon chưa có hình.
  await expect(page.locator('.a4-page [data-picture]')).toHaveCount(6);
  await page.getByRole('checkbox', { name: 'Kèm hình minh họa từ vựng' }).uncheck();
  await expect(page.locator('.a4-page [data-picture]')).toHaveCount(0);

  await page.getByRole('button', { name: 'Aa – Zz' }).click();
  await expect(content(page)).toHaveValue(/^Aa\nBb\n/);
  await expect(select(page, 'Gói từ vựng theo lớp')).toHaveValue('');

  await content(page).fill('a');
  await openGroup(page, 'Số dòng');
  await number(page, 'Số dòng cho mỗi mẫu').fill('4');
  await expect(samples(page, 'model')).toHaveCount(4);

  await openGroup(page, 'Danh sách học sinh');
  await page.getByRole('textbox', { name: /^Danh sách học sinh/ }).fill('Lê An\nPhạm Bình');
  await expect(page.getByText('2 trang A4')).toBeVisible();
  const pages = await readPdf((await downloadFile(page, 'Tải PDF')).data);
  expect(pages[1]!.text).toContain(squash('Phạm Bình'));
});

test('ký tự lạ được báo; chữ in vẫn dùng được khi không tải được font', async ({ page }) => {
  let blocked = true;
  await page.route(/PlaywriteVN_400Regular\.ttf$/, (route) =>
    blocked ? route.abort() : route.continue(),
  );
  await open(page);
  await content(page).fill('café');
  await expect(page.getByText(/không có ký tự: é/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'In ngay' })).toBeEnabled();

  await select(page, 'Kiểu chữ').selectOption('cursive');
  await expect(page.getByText('Chưa tải được font chữ nối nét')).toBeVisible();
  await expect(page.getByRole('button', { name: 'In ngay' })).toBeDisabled();
  blocked = false;
  await page.getByRole('button', { name: 'Tải lại font' }).click();
  await expect(page.getByText(/^[1-9]\d* trang A4$/)).toBeVisible();
  // Chữ nối nét viết được é.
  await expect(page.getByText(/không có ký tự/)).toHaveCount(0);

  await content(page).fill('');
  await expect(page.getByText('Nhập nội dung ở mục')).toBeVisible();
});

test('nhớ tùy chọn, "Về mặc định" xoá được; 375px không tràn ngang', async ({ page }) => {
  await open(page);
  await select(page, 'Kiểu chữ').selectOption('cursive');
  await content(page).fill('dog');
  await page.reload();
  await expect(content(page)).toHaveValue('dog');
  await expect(select(page, 'Kiểu chữ')).toHaveValue('cursive');
  await page.getByRole('button', { name: 'Về mặc định' }).click();
  await expect(select(page, 'Kiểu chữ')).toHaveValue('print');
  await page.setViewportSize({ width: 375, height: 740 });
  await expectNoSideScroll(page);
  await expect(page.getByRole('button', { name: 'In ngay' })).toBeVisible();
});
