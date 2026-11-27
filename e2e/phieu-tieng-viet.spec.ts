import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const squash = (text: string) => text.normalize('NFC').replace(/\s+/g, '');
const KEY = 'kcc:tool:phieu-tieng-viet';

async function pdfPages(data: Buffer) {
  const doc = await getDocument({ data: new Uint8Array(data) }).promise;
  const pages: string[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const content = await (await doc.getPage(n)).getTextContent();
    pages.push(squash(content.items.map((i) => ('str' in i ? i.str : '')).join('')));
  }
  return pages;
}

const sheets = (page: Page) => page.locator('.a4-page:not([data-plain])');
const items = (page: Page) => sheets(page).locator('[data-item]');
const answers = (page: Page) => page.locator('.a4-page[data-plain] li b');
const form = (page: Page) => page.getByRole('combobox', { name: 'Dạng bài' });
const list = (page: Page) => page.getByRole('textbox', { name: /Mỗi dòng một/ });

async function open(page: Page) {
  await page.goto('/phieu-tieng-viet');
  await expect(page.getByText(/^[1-9]\d* trang A4$/)).toBeVisible();
}

async function download(page: Page) {
  const wait = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Tải PDF' }).click();
  return pdfPages(await readFile(await (await wait).path()));
}

test('điền âm đầu: chỗ trống cộng đáp án thành đúng từ', async ({ page }) => {
  await open(page);
  await expect(sheets(page)).toContainText('Âm đầu cho sẵn');
  await expect(items(page)).toHaveCount(16);
  const words = await answers(page).allTextContents();
  const shown = await items(page).evaluateAll((list) =>
    list.map((li) => [li.children[1]!.textContent!, li.children[3]!.textContent!]),
  );
  shown.forEach(([before, after], i) => {
    const word = words[i]!;
    expect(word.startsWith(before!) && word.endsWith(after!), word).toBe(true);
    expect(word.length).toBeGreaterThan(before!.length + after!.length);
  });
  await page.getByRole('checkbox', { name: 'Cho sẵn âm, vần để chọn' }).uncheck();
  await expect(sheets(page)).not.toContainText('cho sẵn');
});

test('nối từ và sắp xếp câu; PDF đủ trang, đúng dấu', async ({ page }) => {
  await open(page);
  await form(page).selectOption('noi');
  await expect(sheets(page).first()).toContainText('Nối để được từ đúng');
  await expect(answers(page)).toHaveCount(16);
  let pdf = await download(page);
  expect(pdf).toHaveLength(Number((await page.getByText(/^\d+ trang A4$/).textContent())![0]));
  expect(pdf[0]).toContain(squash('Nối để được từ đúng'));

  await form(page).selectOption('sap-xep');
  await expect(list(page)).toHaveValue(/Bé đi học/);
  await expect(items(page)).toHaveCount(8);
  pdf = await download(page);
  expect(pdf[0]).toContain(squash('Sắp xếp các từ thành câu'));
  expect(pdf.at(-1)).toContain(squash('Mẹ mua cá ở chợ.'));
});

test('danh sách rỗng hoặc không dùng được thì báo và khoá nút in', async ({ page }) => {
  await open(page);
  await list(page).fill('');
  await expect(page.getByText(/Chưa có từ nào dùng được/)).toBeVisible();
  await expect(page.getByText('0 trang A4')).toBeVisible();
  await expect(page.getByRole('button', { name: 'In ngay' })).toBeDisabled();

  await list(page).fill('áo\ncon cá');
  await expect(page.getByText(/Bỏ qua 1 dòng không tách được/)).toBeVisible();
  await expect(items(page)).toHaveCount(1);
  await page.getByRole('button', { name: 'Dùng danh sách mẫu' }).click();
  await expect(items(page)).toHaveCount(16);
});

test('nhớ danh sách, trộn lại được, "Về mặc định" xoá được', async ({ page }) => {
  await open(page);
  await list(page).fill('con cá\nlá cờ\nbó hoa\nghế gỗ\nnhà lá\ntổ chim');
  await page.reload();
  await expect(items(page)).toHaveCount(6);
  const before = await sheets(page).first().locator('ol').textContent();
  await page.getByRole('button', { name: 'Đổi bộ khác' }).click();
  await expect(sheets(page).first().locator('ol')).not.toHaveText(before!);
  await page.getByRole('button', { name: 'Về mặc định' }).click();
  await expect(items(page)).toHaveCount(16);
});

test('không mục nào tràn cột hay tràn trang, với mọi font, dạng bài, cỡ chữ', async ({ page }) => {
  test.setTimeout(240_000);
  await open(page);
  const fonts = await page.evaluate(async () => {
    const module = await import('/src/core/print/fonts.ts' as string);
    return module.PRINT_FONTS.map((f: { id: string; family: string }) => [f.id, f.family]);
  });

  // Từ và câu dài sát giới hạn.
  const words = [
    'nghiêng nghiêng',
    'khuỷu tay',
    'trường tiểu học',
    'con chuồn chuồn ớt',
    'Mặt Trời | chiếu sáng',
    'những chiếc | thuyền buồm',
    'Nguyễn Thị Phương Thương',
    'quyển truyện tranh',
    ...Array.from({ length: 20 }, (_, i) => `chim ${['ri', 'sẻ', 'sâu', 'én', 'yến'][i % 5]} ${i}`),
  ].join('\n');
  const sentences = Array.from(
    { length: 12 },
    (_, i) =>
      `Buổi sáng ${i}, những chú chim nghiêng cánh bay qua cánh đồng lúa chín vàng ươm của quê em.`,
  ).join('\n');

  const problems: string[] = [];
  for (const [font, family] of fonts) {
    for (const kind of ['dien', 'noi', 'sap-xep']) {
      for (const largeText of [false, true]) {
        for (const columns of [2, 3]) {
          const options = {
            font,
            largeText,
            columns,
            form: kind,
            hide: 'both',
            words,
            sentences,
            school: 'Trường Tiểu học Nguyễn Thị Minh Khai, Lớp 1A',
            title: 'Phiếu ôn tập tiếng Việt cuối tuần dành cho các bạn học sinh lớp Một',
          };
          const found = await page.evaluate(
            async ({ key, options, family }) => {
              localStorage.setItem(key, JSON.stringify(options));
              dispatchEvent(new StorageEvent('storage'));
              const frame = () => new Promise((done) => requestAnimationFrame(done));
              await frame();
              await document.fonts.load(`13pt "${family}"`, 'Ế0');
              await document.fonts.load(`bold 13pt "${family}"`, 'Ế0');
              await document.fonts.ready;
              await frame();

              const issues: string[] = [];
              if (!document.querySelector('[data-item]')) issues.push('không có mục nào');
              for (const item of document.querySelectorAll<HTMLElement>('[data-item]')) {
                if (item.scrollWidth > item.clientWidth + 1) {
                  issues.push(`tràn cột: ${item.textContent?.slice(0, 40)}`);
                }
              }
              for (const sheet of document.querySelectorAll<HTMLElement>('.a4-page')) {
                const box = sheet.getBoundingClientRect();
                const mm = box.height / 297;
                for (const el of sheet.querySelectorAll('*')) {
                  const r = el.getBoundingClientRect();
                  if (r.bottom > box.bottom - 8 * mm || r.right > box.right - 8 * mm) {
                    issues.push(`tràn trang: ${el.textContent?.slice(0, 40)}`);
                    break;
                  }
                }
              }
              return issues.slice(0, 2);
            },
            { key: KEY, options, family },
          );
          problems.push(...found.map((p) => `${font} ${kind} ${largeText} ${columns}: ${p}`));
        }
      }
    }
  }
  expect(problems).toEqual([]);
});

test('điện thoại 375px: đổi dạng bài trong ngăn kéo, không tràn ngang', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await open(page);
  await page.getByRole('button', { name: 'Tùy chọn' }).click();
  const drawer = page.getByRole('dialog', { name: 'Tùy chọn' });
  await drawer.getByRole('combobox', { name: 'Dạng bài' }).selectOption('noi');
  await drawer.getByRole('button', { name: 'Xong' }).click();
  await expect(sheets(page).first()).toContainText('Nối để được từ đúng');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
  ).toBeLessThanOrEqual(0);
});
