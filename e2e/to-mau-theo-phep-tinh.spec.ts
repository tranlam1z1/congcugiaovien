import { expect, test, type Page } from '@playwright/test';
import {
  downloadFile,
  expectNoSideScroll,
  findOverflow,
  openGroup,
  pageCount,
  printFonts,
  printPdf,
  readPdf,
  squash,
} from './helpers';

const KEY = 'kcc:tool:to-mau-theo-phep-tinh';
const sheets = (page: Page) => page.locator('.a4-page:not([data-plain])');
const cells = (page: Page) => sheets(page).locator('[data-cell]');

async function open(page: Page) {
  await page.goto('/to-mau-theo-phep-tinh');
  await expect(page.getByText(/^[1-9]\d* trang A4$/)).toBeVisible();
}

test('ô nào cũng tính ra một số trong bảng màu; PDF và bản in đủ trang', async ({ page }) => {
  await open(page);
  await expect(cells(page)).toHaveCount(64);
  const results = await sheets(page).locator('[data-legend] b').allTextContents();
  for (const text of await cells(page).allTextContents()) {
    const [a, sign, b] = text.split(' ');
    expect(sign).toBe('+');
    expect(results, text).toContain(String(Number(a) + Number(b)));
  }
  const total = await pageCount(page);
  expect(total).toBe(2);
  const pdf = await readPdf((await downloadFile(page, 'Tải PDF')).data);
  expect(pdf).toHaveLength(total);
  expect(pdf[0]!.text).toContain(squash('Tính rồi tô màu'));
  expect(pdf[1]!.text).toContain(squash('Đáp án'));
  expect(await readPdf(await printPdf(page))).toHaveLength(total);
});

test('đổi phép tính, số ô, nhiều trang; nhớ tùy chọn và về mặc định', async ({ page }) => {
  await open(page);
  await page.getByRole('combobox', { name: 'Phép tính', exact: true }).selectOption('chia');
  await openGroup(page, 'Hình tô màu');
  await page.getByRole('combobox', { name: 'Số phép tính mỗi trang' }).selectOption('100');
  await openGroup(page, 'Số phiếu và học sinh');
  await page.getByRole('spinbutton', { name: 'Số phiếu khác nhau' }).fill('5');
  await expect(sheets(page)).toHaveCount(5);
  await expect(cells(page)).toHaveCount(500);
  await expect(cells(page).first()).toContainText(':');
  // Mỗi trang một hình khác nhau.
  const names = await page.locator('.a4-page[data-plain] h3').allTextContents();
  expect(new Set(names.map((n) => n.split('·')[1])).size).toBe(5);

  await page.reload();
  await expect(cells(page)).toHaveCount(500);
  await page.getByRole('button', { name: 'Về mặc định' }).click();
  await expect(cells(page)).toHaveCount(64);
});

test('không tràn ô hay tràn trang với mọi font, phép tính, số ô, cỡ chữ', async ({ page }) => {
  test.setTimeout(240_000);
  await open(page);
  const problems: string[] = [];
  for (const [font, family] of await printFonts(page)) {
    for (const operation of ['cong-tru', 'nhan', 'chia']) {
      for (const count of [64, 80, 100]) {
        for (const largeText of [false, true]) {
          const options = {
            font,
            largeText,
            operation,
            range: 100,
            cells: count,
            picture: 'ngoi-nha',
            school: 'Trường Tiểu học Nguyễn Thị Minh Khai, Lớp 1A',
            title: 'Phiếu tô màu ôn tập cuối tuần dành cho các bạn học sinh lớp Một',
          };
          const found = await findOverflow(page, KEY, options, family);
          const narrow = await page
            .locator('.a4-page [data-cell]')
            .evaluateAll((list) =>
              list.some((el) => el.scrollWidth > el.clientWidth + 1) ? ['chữ tràn ô'] : [],
            );
          problems.push(
            ...[...found, ...narrow].map((p) => `${font} ${operation} ${count} ${largeText}: ${p}`),
          );
        }
      }
    }
  }
  expect(problems).toEqual([]);
});

test('điện thoại 375px không tràn ngang', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await open(page);
  await expectNoSideScroll(page);
});
