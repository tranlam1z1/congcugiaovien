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
  await page.goto('/the-tu-vung-tieng-anh');
  await expect(page.getByText(/^[1-9]\d* trang A4$/)).toBeVisible();
}

const select = (page: Page, name: string) => page.getByRole('combobox', { name, exact: true });
const list = (page: Page) => page.getByRole('textbox', { name: /^Danh sách thẻ/ });

/** Tỉ lệ điểm ảnh khác nhau rõ rệt giữa hai ảnh cùng cỡ. */
function difference(a: Pixels, b: Pixels) {
  expect([a.width, a.height]).toEqual([b.width, b.height]);
  let count = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    if (Math.abs(a.data[i]! - b.data[i]!) > 96) count++;
  }
  return count / (a.data.length / 4);
}

/** Tìm thẻ có nội dung tràn khung. */
const overflowing = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.a4-page [data-card]')]
      .filter(
        (card) =>
          card.scrollHeight > card.clientHeight + 1 || card.scrollWidth > card.clientWidth + 1,
      )
      .map((card) => card.dataset.card),
  );

test('PDF có từ, phiên âm, nghĩa và khớp bản in ở cả hai mặt', async ({ page }) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  await open(page);
  await expect(page.getByText('4 trang A4')).toBeVisible();
  const printed = await printPdf(page);
  const exported = (await downloadFile(page, 'Tải PDF')).data;
  for (const data of [printed, exported]) {
    const pages = await readPdf(data);
    expect(pages).toHaveLength(await pageCount(page));
    expect(pages[0]!.text).toContain('rabbit');
    expect(pages[2]!.text).toContain('elephant');
    expect(pages[1]!.text).toContain(squash('con mèo'));
    expect(pages[1]!.text).toContain(squash('/kæt/'));
  }
  for (const number of [1, 2]) {
    const a = await rasterize(printed, 4, number);
    const b = await rasterize(exported, 4, number);
    expect(difference(a, b), `trang ${number}`).toBeLessThan(0.01);
  }
  expect(errors).toEqual([]);
});

test('mọi chủ đề, số thẻ và mặt trước: không thẻ nào tràn khung', async ({ page }) => {
  test.setTimeout(180_000);
  await open(page);
  await openGroup(page, 'Thẻ');
  const topics = await select(page, 'Chủ đề theo lớp')
    .locator('option')
    .evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value).filter(Boolean));
  expect(topics).toHaveLength(15);
  for (const topic of topics) {
    await select(page, 'Chủ đề theo lớp').selectOption(topic);
    for (const perPage of ['4', '8']) {
      await select(page, 'Số thẻ mỗi trang').selectOption(perPage);
      for (const front of ['hinh-tu', 'nghia']) {
        await select(page, 'Mặt trước hiện').selectOption(front);
        await expect.poll(() => overflowing(page), { message: `${topic} ${perPage} ${front}` }).toEqual(
          [],
        );
      }
    }
  }
  // Từ và nghĩa dài nhất cho phép.
  await list(page).fill(`${'incomprehensibility'} | /${'ˌɪnˌkɒmprɪˌhensəˈbɪləti'}/ | ${'sự không thể hiểu được '.repeat(3)}`);
  await select(page, 'Mặt trước hiện').selectOption('hinh-tu');
  await expect.poll(() => overflowing(page)).toEqual([]);
  // Chữ hoa rộng nhất.
  await list(page).fill(`${'W'.repeat(30)} | ${'M'.repeat(60)}`);
  await expect(page.locator('.a4-page [data-card^="WWW"]').first()).toBeVisible();
  expect(await overflowing(page)).toEqual([]);
});

test('tùy chọn mặt sau, màu và số, danh sách trống', async ({ page }) => {
  await open(page);
  await openGroup(page, 'Thẻ');
  await page.getByRole('checkbox', { name: /^In kèm mặt sau/ }).uncheck();
  await expect(page.getByText('2 trang A4')).toBeVisible();
  await select(page, 'Chủ đề theo lớp').selectOption({ label: 'Lớp 1 · Colours' });
  await expect(page.locator('.a4-page [data-visual="colour"]')).toHaveCount(8);
  await select(page, 'Chủ đề theo lớp').selectOption({ label: 'Lớp 1 · Numbers' });
  await expect(page.locator('.a4-page [data-visual="number"]')).toHaveCount(8);
  await list(page).fill('');
  await expect(page.getByText('Nhập từ ở mục “Từ vựng” để tạo thẻ.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'In ngay' })).toBeDisabled();
});

test('trình chiếu: lật thẻ bằng phím, đọc từ, xáo thẻ', async ({ page }) => {
  await page.addInitScript(() => {
    const spoken: string[] = [];
    Object.assign(window, { spoken });
    window.speechSynthesis.speak = (u) => void spoken.push(`${u.lang}:${u.text}`);
  });
  const spoken = () => page.evaluate(() => (window as unknown as { spoken: string[] }).spoken);
  await open(page);
  await openGroup(page, 'Trình chiếu');
  await page.getByRole('checkbox', { name: /^Tự đọc từ/ }).check();
  expect(await spoken()).toEqual([]);
  await page.getByRole('button', { name: 'Toàn màn hình' }).click();
  const stage = page.getByRole('dialog', { name: 'Trình chiếu' });
  const card = stage.locator('[data-stage-card]');
  await expect(card).toContainText('cat');
  await expect.poll(spoken).toEqual(['en-GB:cat']);

  await page.keyboard.press('PageDown');
  await expect(card).toContainText('con mèo');
  await expect(card).toContainText('/kæt/');
  await page.keyboard.press('PageDown');
  await expect(card).toContainText('dog');
  await expect(stage.getByText('Thẻ 2/8')).toBeVisible();
  await page.keyboard.press('PageUp');
  await expect(stage.getByText('Thẻ 1/8')).toBeVisible();
  await page.keyboard.press('PageUp');
  await expect(stage.getByText('Thẻ 8/8')).toBeVisible();
  await stage.getByRole('button', { name: 'Nghe' }).click();
  await expect.poll(async () => (await spoken()).at(-1)).toBe('en-GB:elephant');

  const size = await card.locator('span').last().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(size).toBeGreaterThanOrEqual(48);
  await stage.getByRole('button', { name: 'Xáo thẻ' }).click();
  await expect(stage.getByText('Thẻ 1/8')).toBeVisible();
  await expect(stage.getByRole('button', { name: 'Theo thứ tự' })).toBeVisible();
  await stage.getByRole('button', { name: 'Thoát toàn màn hình' }).click();
  await expect(stage).toBeHidden();
});

test('nhớ tùy chọn, "Về mặc định" xoá được; 375px không tràn ngang', async ({ page }) => {
  await open(page);
  await list(page).fill('moon | mặt trăng');
  await page.reload();
  await expect(list(page)).toHaveValue('moon | mặt trăng');
  await page.getByRole('button', { name: 'Về mặc định' }).click();
  await expect(list(page)).toHaveValue(/^cat \| \/kæt\/ \| con mèo\n/);
  await page.setViewportSize({ width: 375, height: 740 });
  await expectNoSideScroll(page);
  await expect(page.getByRole('button', { name: 'Toàn màn hình' })).toBeVisible();
});
