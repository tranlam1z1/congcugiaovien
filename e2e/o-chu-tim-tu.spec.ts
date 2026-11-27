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

const KEY = 'kcc:tool:o-chu-tim-tu';
const sheets = (page: Page) => page.locator('.a4-page:not([data-plain])');
const answers = (page: Page) => page.locator('.a4-page[data-plain]');
const kind = (page: Page) => page.getByRole('combobox', { name: 'Loại ô chữ' });
const list = (page: Page) => page.getByRole('textbox', { name: 'Mỗi dòng một từ' });

async function open(page: Page) {
  await page.goto('/o-chu-tim-tu');
  await expect(page.getByText(/^[1-9]\d* trang A4$/)).toBeVisible();
}

test('tìm từ: lưới đúng cỡ, có danh sách từ, đáp án tô ô; PDF và bản in đủ trang', async ({
  page,
}) => {
  await open(page);
  await expect(sheets(page).locator('[data-grid] span')).toHaveCount(144);
  await expect(sheets(page).locator('li')).toHaveCount(12);
  expect(await answers(page).locator('[data-marked]').count()).toBeGreaterThan(20);

  const total = await pageCount(page);
  const pdf = await readPdf((await downloadFile(page, 'Tải PDF')).data);
  expect(pdf).toHaveLength(total);
  expect(pdf[0]!.text).toContain(squash('Tìm và khoanh tròn'));
  expect(pdf[0]!.text).toContain(squash('trường học'));
  expect(pdf.at(-1)!.text).toContain(squash('Đáp án'));
  expect(await readPdf(await printPdf(page))).toHaveLength(total);

  await openGroup(page, 'Loại và độ khó');
  await page.getByRole('checkbox', { name: 'Hiện danh sách từ cần tìm' }).uncheck();
  await expect(sheets(page).locator('li')).toHaveCount(0);
});

test('ô chữ: ô trống trên phiếu, có gợi ý ngang dọc, đáp án điền chữ', async ({ page }) => {
  await open(page);
  await kind(page).selectOption('o-chu');
  await expect(sheets(page).first()).toContainText('Hàng ngang');
  await expect(sheets(page).first()).toContainText('Hàng dọc');
  await expect(sheets(page).first()).toContainText('Nơi em đến học mỗi ngày');
  const cells = sheets(page).locator('[data-cell]');
  expect(await cells.count()).toBeGreaterThan(30);
  // Phiếu học sinh chỉ có số thứ tự, đáp án có chữ.
  expect((await cells.allTextContents()).join('')).toMatch(/^\d+$/);
  expect((await answers(page).locator('[data-cell]').allTextContents()).join('')).toContain('H');
  const pdf = await readPdf((await downloadFile(page, 'Tải PDF')).data);
  expect(pdf).toHaveLength(await pageCount(page));
  expect(pdf[0]!.text).toContain(squash('Hàng ngang'));
});

test('báo từ bị loại; danh sách rỗng thì khoá nút in; nhớ tùy chọn', async ({ page }) => {
  await open(page);
  await openGroup(page, 'Danh sách từ');
  await list(page).fill('con cá\nmột cụm từ dài hơn cả lưới này');
  await expect(page.getByText(/Dài hơn lưới.*một cụm từ dài/)).toBeVisible();
  await expect(page.getByText('Xếp được 1/2 từ.')).toBeVisible();
  await list(page).fill('');
  await expect(page.getByText('0 trang A4')).toBeVisible();
  await expect(page.getByRole('button', { name: 'In ngay' })).toBeDisabled();

  await list(page).fill('con cá\nlá cờ');
  await page.reload();
  await expect(sheets(page).locator('li')).toHaveCount(2);
  await page.getByRole('button', { name: 'Về mặc định' }).click();
  await expect(sheets(page).locator('li')).toHaveCount(12);
});

test('không tràn khung hay tràn trang với mọi font, loại, cỡ lưới, cỡ chữ', async ({ page }) => {
  test.setTimeout(240_000);
  await open(page);
  const words = [
    'nghiêng nghiêng | ' + 'Một gợi ý rất dài để thử xuống dòng trong cột hẹp '.repeat(2).slice(0, 100),
    ...Array.from(
      { length: 39 },
      (_, i) =>
        `${['con mèo', 'bông hoa', 'trường học', 'MMMMM', 'khuỷu tay'][i % 5]} ${i} | Gợi ý cho từ số ${i} khá là dài dòng văn tự để chiếm nhiều dòng`,
    ),
  ].join('\n');

  const problems: string[] = [];
  for (const [font, family] of await printFonts(page)) {
    for (const type of ['tim-tu', 'o-chu']) {
      for (const size of [6, 20]) {
        for (const largeText of [false, true]) {
          const options = {
            font,
            gridFont: font,
            largeText,
            size,
            kind: type,
            level: 'kho',
            words,
            school: 'Trường Tiểu học Nguyễn Thị Minh Khai, Lớp 1A',
            title: 'Phiếu ôn tập tiếng Việt cuối tuần dành cho các bạn học sinh lớp Một',
          };
          const found = await findOverflow(page, KEY, options, family);
          problems.push(...found.map((p) => `${font} ${type} ${size} ${largeText}: ${p}`));
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
