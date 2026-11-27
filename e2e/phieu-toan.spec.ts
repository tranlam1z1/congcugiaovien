import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const squash = (text: string) => text.normalize('NFC').replace(/\s+/g, '');

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
const questions = (page: Page) => sheets(page).locator('[data-question]');

async function open(page: Page) {
  await page.goto('/phieu-toan');
  await expect(page.getByText(/^[1-9]\d* trang A4$/)).toBeVisible();
}

/** Mở nhóm tùy chọn nếu đang gấp. */
async function openGroup(page: Page, title: string) {
  const group = page.locator('details', { has: page.locator('summary', { hasText: title }) });
  if ((await group.getAttribute('open')) === null) await group.locator('summary').click();
}

test('mặc định: một phiếu 30 câu và một trang đáp án', async ({ page }) => {
  await open(page);
  await expect(page.getByText('2 trang A4')).toBeVisible();
  await expect(questions(page)).toHaveCount(30);
  await expect(sheets(page)).toContainText('Phép cộng, trừ trong phạm vi 10');
  await page.getByRole('checkbox', { name: 'Kèm đáp án' }).uncheck();
  await expect(page.getByText('1 trang A4')).toBeVisible();
});

test('đáp án khớp với đề đang hiện', async ({ page }) => {
  await open(page);
  const shown = await questions(page).allTextContents();
  const answers = await page.locator('.a4-page[data-plain] li b').allTextContents();
  expect(answers).toHaveLength(shown.length);
  shown.forEach((text, i) => {
    const [, a, op, b] = text.match(/\)(\d+) ([+−]) (\d+)=/)!;
    const result = op === '+' ? Number(a) + Number(b) : Number(a) - Number(b);
    expect(answers[i], text).toBe(String(result));
  });
});

test('chọn nhanh theo lớp đổi đúng dạng bài', async ({ page }) => {
  await open(page);
  const preset = page.getByRole('button', { name: 'Bảng nhân chia 2–5' });
  await preset.click();
  await expect(preset).toHaveAttribute('aria-pressed', 'true');
  await expect(sheets(page)).toContainText('Bảng nhân, chia 2–5');
  for (const text of await questions(page).allTextContents()) {
    expect(text).toMatch(/\)\d+ [×:] \d+=/);
  }
  await page.getByRole('button', { name: 'So sánh trong 20' }).click();
  await expect(sheets(page)).toContainText('Điền dấu >, <, = vào ô tròn');
});

test('không bỏ chọn được phép tính cuối cùng; báo khi hết câu không trùng', async ({ page }) => {
  await open(page);
  await page.getByRole('checkbox', { name: '− trừ' }).uncheck();
  const add = page.getByRole('checkbox', { name: '+ cộng' });
  await add.click();
  await expect(add).toBeChecked();
  await expect(page.getByText('Cần giữ ít nhất một phép tính.')).toBeVisible();

  await openGroup(page, 'Bố cục và chữ');
  await page.getByRole('spinbutton', { name: 'Số câu' }).fill('100');
  await expect(page.getByText(/chỉ có 45 câu không trùng/)).toBeVisible();
  await expect(questions(page)).toHaveCount(45);
});

test('mỗi học sinh một phiếu, đề khác nhau; nhớ sau khi tải lại và xoá được', async ({ page }) => {
  await open(page);
  await openGroup(page, 'Số phiếu và học sinh');
  await page.getByRole('textbox', { name: /Danh sách học sinh/ }).fill('Lê An\nPhạm Bình');
  await expect(page.getByText('3 trang A4')).toBeVisible();
  await expect(sheets(page).nth(1)).toContainText('Phạm Bình');
  const list = (n: number) => sheets(page).nth(n).locator('ol').textContent();
  expect(await list(0)).not.toBe(await list(1));

  const first = await list(0);
  await page.reload();
  await expect(sheets(page).nth(1)).toContainText('Phạm Bình');
  expect(await list(0)).toBe(first);

  await page.getByRole('button', { name: 'Về mặc định' }).click();
  await expect(page.getByText('2 trang A4')).toBeVisible();
});

test('không câu nào tràn cột hay tràn trang, với mọi font, dạng bài, cỡ chữ', async ({ page }) => {
  test.setTimeout(240_000);
  await open(page);
  const fonts = await page.evaluate(async () => {
    const module = await import('/src/core/print/fonts.ts' as string);
    return module.PRINT_FONTS.map((f: { id: string; family: string }) => [f.id, f.family]);
  });
  expect(fonts.length).toBe(9);

  const problems: string[] = [];
  for (const [font, family] of fonts) {
    for (const form of ['ngang', 'doc', 'o-trong', 'so-sanh', 'so-sanh-phep-tinh']) {
      for (const largeText of [false, true]) {
        for (const count of [100, 7]) {
          const options = {
            font,
            largeText,
            count,
            form: form.replace('-phep-tinh', ''),
            compareExpressions: form.endsWith('phep-tinh'),
            ops: ['add', 'sub', 'mul', 'div'],
            range: 1000,
            columns: 5,
            school: 'Trường Tiểu học Nguyễn Thị Minh Khai, Lớp 3A',
            title: 'Phiếu ôn tập cuối tuần: phép cộng, trừ, nhân, chia trong phạm vi 1000',
          };
          const found = await page.evaluate(
            async ({ options, family }) => {
              localStorage.setItem('kcc:tool:phieu-toan', JSON.stringify(options));
              dispatchEvent(new StorageEvent('storage'));
              const frame = () => new Promise((done) => requestAnimationFrame(done));
              await frame();
              await document.fonts.load(`13pt "${family}"`, 'Ế0');
              await document.fonts.load(`bold 13pt "${family}"`, 'Ế0');
              await document.fonts.ready;
              await frame();

              const issues: string[] = [];
              for (const li of document.querySelectorAll<HTMLElement>('[data-question]')) {
                if (li.scrollWidth > li.clientWidth + 1) issues.push(`tràn cột: ${li.textContent}`);
                const child = li.lastElementChild!.getBoundingClientRect();
                const box = li.getBoundingClientRect();
                if (child.height > box.height + 1) issues.push(`cao quá hàng: ${li.textContent}`);
              }
              for (const sheet of document.querySelectorAll<HTMLElement>('.a4-page')) {
                const box = sheet.getBoundingClientRect();
                // Lề dưới 12 mm theo tỉ lệ đang xem; cho phép lấn 4 mm.
                const limit = box.bottom - (box.height / 297) * 8;
                for (const el of sheet.querySelectorAll('*')) {
                  if (el.getBoundingClientRect().bottom > limit) {
                    issues.push(`tràn trang: ${el.textContent?.slice(0, 40)}`);
                    break;
                  }
                }
              }
              return issues.slice(0, 2);
            },
            { options, family },
          );
          problems.push(...found.map((p) => `${font} ${form} ${largeText} ${count}: ${p}`));
        }
      }
    }
  }
  expect(problems).toEqual([]);
});

test('PDF của mọi font đủ trang và giữ đúng tiếng Việt', async ({ page }) => {
  test.setTimeout(120_000);
  await open(page);
  await openGroup(page, 'Đầu phiếu');
  await page.getByRole('textbox', { name: 'Tiêu đề phiếu' }).fill('Ôn tập: Đường đến lớp Ễ Ữ Ợ');
  await openGroup(page, 'Bố cục và chữ');
  const select = page.getByRole('combobox', { name: 'Font chữ' });
  const values = await select
    .locator('option')
    .evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value));

  for (const value of values) {
    await select.selectOption(value);
    await page.evaluate(() => document.fonts.ready);
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Tải PDF' }).click();
    const pages = await pdfPages(await readFile(await (await download).path()));
    expect(pages, value).toHaveLength(2);
    expect(pages[0], value).toContain(squash('Ôn tập: Đường đến lớp Ễ Ữ Ợ'));
    expect(pages[1], value).toContain(squash('Đáp án'));
  }
});

test('bản in của trình duyệt đúng số trang xem trước', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Cộng trừ trong 100' }).click();
  await openGroup(page, 'Bố cục và chữ');
  await page.getByRole('spinbutton', { name: 'Số câu' }).fill('100');
  await page.getByRole('spinbutton', { name: 'Số cột' }).fill('2');
  // Bản xem trước đếm lại trang sau một nhịp: 3 trang câu hỏi và 1 trang đáp án.
  await expect(page.getByText('4 trang A4')).toBeVisible();
  const printed = await pdfPages(await page.pdf({ preferCSSPageSize: true }));
  expect(printed).toHaveLength(4);
});

test('điện thoại 375px: đổi tùy chọn trong ngăn kéo, không tràn ngang', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await open(page);
  await page.getByRole('button', { name: 'Tùy chọn' }).click();
  const drawer = page.getByRole('dialog', { name: 'Tùy chọn' });
  await drawer.getByRole('button', { name: 'Cộng trừ trong 20' }).click();
  await drawer.getByRole('button', { name: 'Xong' }).click();
  await expect(sheets(page)).toContainText('trong phạm vi 20');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
