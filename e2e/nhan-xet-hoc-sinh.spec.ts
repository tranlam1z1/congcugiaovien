import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { readSheet } from 'read-excel-file/node';
import {
  downloadFile,
  expectNoSideScroll,
  openGroup,
  pageCount,
  printPdf,
  readPdf,
  squash,
} from './helpers';

const NAMES = ['Nguyễn Minh An', 'Trần Bảo Ngọc', 'Phạm Đức Quý'];

async function open(page: Page, names = NAMES) {
  await page.goto('/nhan-xet-hoc-sinh');
  await page.getByRole('textbox', { name: /^Học sinh/ }).fill(names.join('\n'));
  await expect(page.getByText(/^[1-9]\d* trang A4$/)).toBeVisible();
}

const comment = (page: Page, name: string) =>
  page.getByRole('textbox', { name: `Nhận xét cho ${name}`, exact: true });
const row = (page: Page, name: string) =>
  page.getByRole('listitem').filter({ has: page.getByRole('heading', { name }) });
const select = (page: Page, name: string) => page.getByRole('combobox', { name, exact: true });

/** Bản in theo sau ô nhập một nhịp: đợi lời nhận xét em đầu khớp rồi mới đo. */
async function printedMatches(page: Page, name: string) {
  const text = await comment(page, name).inputValue();
  // Năm ô đầu là dòng tiêu đề, ô thứ mười là lời nhận xét của em đầu.
  await expect(page.locator('.a4-page [data-cell]').nth(9)).toHaveText(text.trim(), {
    useInnerText: false,
  });
}

/** Ô trong bảng in bị cắt chữ. */
const clipped = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('.a4-page [data-cell]')]
      .filter((cell) => cell.scrollHeight > cell.clientHeight + 1)
      .map((cell) => cell.textContent!.slice(0, 40)),
  );

test('chọn mức, sửa tay, viết lại; bản in đi theo', async ({ page }) => {
  await open(page);
  await expect(comment(page, 'Nguyễn Minh An')).toHaveValue(/^Em|Em /);
  const first = await comment(page, 'Nguyễn Minh An').inputValue();

  await page.getByRole('button', { name: 'Viết lại cho Nguyễn Minh An' }).click();
  await expect(comment(page, 'Nguyễn Minh An')).not.toHaveValue(first);

  await row(page, 'Trần Bảo Ngọc').getByRole('combobox', { name: 'Học tập' }).selectOption('chua');
  await expect(page.locator('.a4-page [data-table]')).toContainText('Chưa hoàn thành');

  await comment(page, 'Phạm Đức Quý').fill('Quý tiến bộ rõ rệt.');
  await expect(row(page, 'Phạm Đức Quý')).toContainText('đã sửa tay');
  await expect(page.locator('.a4-page [data-table]')).toContainText('Quý tiến bộ rõ rệt.');

  // Đổi xưng hô không ghi đè lời đã sửa tay.
  await openGroup(page, 'Cách viết');
  await select(page, 'Xưng hô').selectOption('con');
  await expect(comment(page, 'Nguyễn Minh An')).toHaveValue(/Con|con/);
  await expect(comment(page, 'Phạm Đức Quý')).toHaveValue('Quý tiến bộ rõ rệt.');

  // Từ chối thì giữ lời đã sửa, đồng ý thì viết lại.
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Viết lại cho Phạm Đức Quý' }).click();
  await expect(comment(page, 'Phạm Đức Quý')).toHaveValue('Quý tiến bộ rõ rệt.');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Viết lại tất cả' }).click();
  await expect(comment(page, 'Phạm Đức Quý')).not.toHaveValue('Quý tiến bộ rõ rệt.');

  await page.reload();
  await expect(
    row(page, 'Trần Bảo Ngọc').getByRole('combobox', { name: 'Học tập' }),
  ).toHaveValue('chua');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Xoá hết' }).click();
  await expect(
    row(page, 'Trần Bảo Ngọc').getByRole('combobox', { name: 'Học tập' }),
  ).toHaveValue('tot');
  await expect(page.getByRole('button', { name: 'Xoá hết' })).toBeDisabled();
});

test('chép, CSV, Excel và PDF cùng nội dung; không gửi tên ra ngoài', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const requests: string[] = [];
  page.on('request', (request) =>
    requests.push(`${request.method()} ${decodeURIComponent(request.url())} ${request.postData() ?? ''}`),
  );
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await open(page);
  const text = await comment(page, 'Trần Bảo Ngọc').inputValue();

  await page.getByRole('button', { name: 'Chép tất cả' }).click();
  await expect(page.getByText('Đã chép 4 dòng').or(page.getByText('Đã chép 3 dòng'))).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain(`Trần Bảo Ngọc\tHoàn thành tốt\tTốt\t${text}`);

  const csv = await downloadFile(page, 'Tải CSV');
  expect(csv.name).toBe('nhan-xet-hoc-sinh-lop-cua-toi.csv');
  expect(csv.data.toString('utf8')).toContain(`"Trần Bảo Ngọc","Hoàn thành tốt","Tốt","${text}"`);

  const wait = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Tải Excel' }).click();
  const download = await wait;
  expect(download.suggestedFilename()).toBe('nhan-xet-hoc-sinh-lop-cua-toi.xlsx');
  const rows = await readSheet(await readFile(await download.path()));
  expect(rows).toHaveLength(NAMES.length + 1);
  expect(rows[2]).toEqual([expect.anything(), 'Trần Bảo Ngọc', 'Hoàn thành tốt', 'Tốt', text]);

  for (const data of [await printPdf(page), (await downloadFile(page, 'Tải PDF')).data]) {
    const pages = await readPdf(data);
    expect(pages).toHaveLength(await pageCount(page));
    const all = pages.map((p) => p.text).join('');
    for (const name of NAMES) expect(all).toContain(squash(name));
    expect(all).toContain(squash('Bản nháp'));
  }
  expect(requests.filter((r) => NAMES.some((name) => r.includes(name)))).toEqual([]);
  expect(errors).toEqual([]);
});

test('lớp đông, tên dài, mọi trọng tâm: không ô nào bị cắt chữ', async ({ page }) => {
  test.setTimeout(120_000);
  const names = Array.from(
    { length: 45 },
    (_, i) => `Nguyễn Hoàng Bảo Ngọc Phương Quỳnh ${i + 1}`,
  );
  await open(page, names);
  await openGroup(page, 'Cách viết');
  await select(page, 'Mức học tập mặc định cho cả lớp').selectOption('chua');
  for (const focus of ['chung', 'toan', 'tieng-viet', 'tieng-anh', 'khac']) {
    await select(page, 'Trọng tâm').selectOption(focus);
    if (focus === 'khac') await page.getByRole('textbox', { name: 'Tên môn' }).fill('Tự nhiên và Xã hội');
    await printedMatches(page, names[0]!);
    await expect.poll(() => clipped(page), { message: focus }).toEqual([]);
  }
  await comment(page, names[0]!).fill(`${'Nghiêng ngả MMMM WWWW '.repeat(27)}`.slice(0, 600));
  await printedMatches(page, names[0]!);
  await expect.poll(() => clipped(page), { message: 'lời dài' }).toEqual([]);
  // Chữ rộng nhất, viết liền không có chỗ ngắt.
  await comment(page, names[0]!).fill('W'.repeat(600));
  await printedMatches(page, names[0]!);
  expect(await clipped(page)).toEqual([]);
  await expect(page.locator('.a4-page [data-cell]')).toHaveCount(
    5 * (names.length + (await page.locator('.a4-page').count())),
  );
  const pages = await readPdf((await downloadFile(page, 'Tải PDF')).data);
  expect(pages).toHaveLength(await pageCount(page));
});

test('chưa có lớp thì khoá in; 375px không tràn ngang', async ({ page }) => {
  await page.goto('/nhan-xet-hoc-sinh');
  await expect(page.getByText('Chưa có học sinh.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'In ngay' })).toBeDisabled();
  await page.getByRole('textbox', { name: /^Học sinh/ }).fill(NAMES.join('\n'));
  await page.setViewportSize({ width: 375, height: 740 });
  await expect(comment(page, NAMES[0]!)).toBeVisible();
  await expectNoSideScroll(page);
});
