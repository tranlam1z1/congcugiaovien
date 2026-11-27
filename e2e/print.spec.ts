import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const PT_PER_MM = 72 / 25.4;
const squash = (text: string) => text.normalize('NFC').replace(/\s+/g, '');

async function readPdf(data: Buffer) {
  const doc = await getDocument({ data: new Uint8Array(data) }).promise;
  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const [, , width, height] = page.view;
    const content = await page.getTextContent();
    const items = content.items.flatMap((item) => ('str' in item ? [item] : []));
    pages.push({
      width: width! / PT_PER_MM,
      height: height! / PT_PER_MM,
      // Chrome cắt chữ thành nhiều mảnh nhỏ khi in, nên so chuỗi đã bỏ khoảng trắng.
      text: squash(items.map((i) => i.str).join('')),
      items,
    });
  }
  return pages;
}

const pageCount = async (page: Page) => {
  const label = await page.getByText(/^\d+ trang A4$/).textContent();
  return Number(label!.split(' ')[0]);
};

async function open(page: Page) {
  await page.goto('/_khung-thu');
  await expect(page.getByText(/^[1-9]\d* trang A4$/)).toBeVisible();
}

for (const [label, orientation, width, height] of [
  ['A4 dọc', 'portrait', 210, 297],
  ['A4 ngang', 'landscape', 297, 210],
] as const) {
  test(`bản in và PDF ${label}: đúng khổ, đủ trang, chữ vector`, async ({ page }) => {
    await open(page);
    await page.getByLabel('Hướng giấy').selectOption(orientation);
    await page.locator('summary', { hasText: 'Học sinh' }).click();
    await page.getByRole('spinbutton', { name: 'Số phiếu khác nhau' }).fill('3');
    await expect(page.getByText('4 trang A4')).toBeVisible();
    const expected = await pageCount(page);

    // Đường in của trình duyệt: không thừa trang trắng, không lẫn giao diện web.
    const printed = await readPdf(await page.pdf({ preferCSSPageSize: true }));
    expect(printed).toHaveLength(expected);

    // Thu nhỏ xem trước: PDF vẫn phải đúng kích thước thật.
    await page.getByRole('button', { name: 'Thu nhỏ' }).click();
    await page.getByRole('button', { name: 'Thu nhỏ' }).click();
    await expect(page.getByRole('button', { name: /Mức thu phóng/ })).not.toHaveText('100%');

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Tải PDF' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe('khung-thu.pdf');
    const exported = await readPdf(await readFile(await file.path()));
    expect(exported).toHaveLength(expected);

    for (const pages of [printed, exported]) {
      for (const p of pages) {
        expect(Math.abs(p.width - width)).toBeLessThan(0.5);
        expect(Math.abs(p.height - height)).toBeLessThan(0.5);
        expect(p.text).not.toContain(squash('Tải PDF'));
        expect(p.text).not.toContain(squash('Công cụ liên quan'));
      }
      expect(pages[0]!.text).toContain(squash('Phiếu thử: Đường đi của chữ Ế, Ỡ, Ự'));
      expect(pages.at(-1)!.text).toContain(squash('Đáp án'));
    }

    // Chữ trong PDF xuất ra nằm đúng chỗ như bản in của trình duyệt (lệch dưới 1 mm).
    const position = (pages: typeof printed, word: string) => {
      const item = pages[0]!.items.find((i) => i.str.startsWith(word))!;
      return [item.transform[4]! / PT_PER_MM, item.transform[5]! / PT_PER_MM];
    };
    for (const word of ['Phi', 'Câu']) {
      const [a, b] = [position(printed, word), position(exported, word)];
      expect(Math.abs(a[0]! - b[0]!), `${word} x`).toBeLessThan(1);
      expect(Math.abs(a[1]! - b[1]!), `${word} y`).toBeLessThan(1);
    }
  });
}

test('tùy chọn nhớ sau khi tải lại; "Về mặc định" xoá được', async ({ page }) => {
  await open(page);
  const title = page.getByRole('textbox', { name: 'Tiêu đề phiếu' });
  await title.fill('Ôn tập cuối tuần');
  await page.reload();
  await expect(title).toHaveValue('Ôn tập cuối tuần');
  await page.getByRole('button', { name: 'Về mặc định' }).click();
  await expect(title).toHaveValue('');
});

test('"Đổi bộ khác" đổi nội dung; nhập lại mã đề ra đúng bộ cũ', async ({ page }) => {
  await open(page);
  const questions = page.locator('.a4-page').first().locator('ol');
  const before = await questions.textContent();
  await page.getByRole('button', { name: 'Đổi bộ khác' }).click();
  await expect(questions).not.toHaveText(before!);

  await page.locator('summary', { hasText: 'Mã đề' }).click();
  const seed = page.getByRole('spinbutton', { name: 'Mã đề' });
  await seed.fill('100001');
  await seed.press('Enter');
  await expect(questions).toHaveText(before!);
});

test('mỗi học sinh một phiếu in sẵn tên', async ({ page }) => {
  await open(page);
  await page.locator('summary', { hasText: 'Học sinh' }).click();
  await page.getByRole('textbox', { name: /Danh sách học sinh/ }).fill('An\nBình\n\nChi');
  await expect(page.getByText('4 trang A4')).toBeVisible();
  await expect(page.locator('.a4-page').nth(1)).toContainText('Bình');
});

test('toàn màn hình che giao diện, chữ từ 48px, thoát được', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Toàn màn hình' }).click();
  const stage = page.getByRole('dialog', { name: 'Trình chiếu' });
  await expect(stage).toBeVisible();
  const size = await stage.evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(size).toBeGreaterThanOrEqual(48);
  await page.getByRole('button', { name: 'Thoát toàn màn hình' }).click();
  await expect(stage).toBeHidden();
});

test('điện thoại: ngăn kéo Tùy chọn và thanh nút dính đáy', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await open(page);
  await expect(page.getByRole('textbox', { name: 'Tiêu đề phiếu' })).toBeHidden();
  await page.getByRole('button', { name: 'Tùy chọn' }).click();
  const drawer = page.getByRole('dialog', { name: 'Tùy chọn' });
  await drawer.getByRole('textbox', { name: 'Tiêu đề phiếu' }).fill('Phiếu trên điện thoại');
  await drawer.getByRole('button', { name: 'Xong' }).click();
  await expect(drawer).toBeHidden();
  await expect(page.locator('.a4-page').first()).toContainText('Phiếu trên điện thoại');
  for (const name of ['Đổi bộ khác', 'Tải PDF', 'In ngay']) {
    await expect(page.getByRole('button', { name })).toBeInViewport();
  }
});
