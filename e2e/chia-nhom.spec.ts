import { expect, test, type Page } from '@playwright/test';
import writeXlsxFile from 'write-excel-file/node';
import {
  downloadFile,
  expectNoSideScroll,
  findOverflow,
  openGroup,
  printFonts,
  readPdf,
  squash,
} from './helpers';

const NAMES = [
  'Lê Văn An, Nam',
  'Phạm Thị Bình, Nữ',
  'Võ Chí Cường, Nam',
  'Đỗ Mỹ Duyên, Nữ',
  'Hồ Quốc Em, Nam',
  'Ngô Thu Giang, Nữ',
  'Bùi Đức Huy, Nam',
  'Đặng Ngọc Khuê, Nữ',
  'Trương Gia Lâm, Nam',
  'Mai Phương Linh, Nữ',
  'Vũ Hải Nam, Nam',
  'Lý Kim Oanh, Nữ',
];

const list = (page: Page) => page.getByRole('textbox', { name: /Học sinh \(mỗi dòng một em\)/ });
const cards = (page: Page) => page.locator('.a4-page section[data-item]');
const memberNames = async (page: Page) =>
  (await cards(page).locator('li').allTextContents()).map((t) =>
    t.replace(/^\d+\./, '').replace(' (NT)', ''),
  );

async function open(page: Page) {
  await page.goto('/chia-nhom');
  await expect(list(page)).toBeVisible();
}

async function fill(page: Page) {
  await open(page);
  await list(page).fill(NAMES.join('\n'));
  await expect(cards(page)).toHaveCount(4);
}

test('chưa có danh sách thì nhắc nhập và khoá nút in', async ({ page }) => {
  await open(page);
  await expect(page.getByText('Chưa có học sinh.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'In ngay' })).toBeDisabled();
});

test('chia đủ mọi em, cân bằng nam nữ, tách cặp, đặt tên nhóm', async ({ page }) => {
  await fill(page);
  await expect(page.getByText('12 em · 6 nam, 6 nữ')).toBeVisible();
  await openGroup(page, 'Cách chia');
  await page.getByRole('spinbutton', { name: 'Số nhóm' }).fill('3');
  await openGroup(page, 'Ràng buộc');
  await page.getByRole('checkbox', { name: 'Cân bằng nam nữ' }).check();
  await page
    .getByRole('textbox', { name: 'Cặp không ngồi cùng nhóm' })
    .fill('Lê Văn An - Phạm Thị Bình\nAi Đó - Lê Văn An');
  await expect(page.getByText('Không khớp với danh sách lớp: Ai Đó - Lê Văn An')).toBeVisible();
  await openGroup(page, 'Tên nhóm');
  await page.getByRole('textbox', { name: /Tên các nhóm/ }).fill('Sơn Ca\nHọa Mi');

  for (let i = 0; i < 5; i++) {
    await expect(cards(page)).toHaveCount(3);
    await expect(cards(page).locator('h3')).toHaveText(['Sơn Ca', 'Họa Mi', 'Nhóm 3']);
    expect((await memberNames(page)).sort()).toEqual(NAMES.map((n) => n.split(',')[0]!).sort());
    for (const card of await cards(page).all()) {
      const text = (await card.textContent())!;
      expect(text.includes('Lê Văn An') && text.includes('Phạm Thị Bình')).toBe(false);
      const girls = NAMES.filter((n) => n.endsWith('Nữ') && text.includes(n.split(',')[0]!));
      expect(girls).toHaveLength(2);
      await expect(card.locator('b')).toHaveCount(1);
    }
    await page.getByRole('button', { name: 'Đổi bộ khác' }).click();
  }

  const pdf = await readPdf((await downloadFile(page, 'Tải PDF')).data);
  const all = pdf.map((p) => p.text).join('');
  for (const line of NAMES) expect(all).toContain(squash(line.split(',')[0]!));
});

test('danh sách và nhiều lớp được nhớ; xoá dữ liệu trên máy', async ({ page }) => {
  await fill(page);
  await page.getByRole('textbox', { name: 'Tên lớp' }).fill('3A');
  await page.getByRole('button', { name: 'Thêm lớp' }).click();
  await list(page).fill('Em Một\nEm Hai');
  await page.reload();
  await expect(list(page)).toHaveValue('Em Một\nEm Hai');
  await page.getByRole('combobox', { name: 'Lớp đang dùng' }).selectOption({ label: '3A' });
  await expect(list(page)).toHaveValue(NAMES.join('\n'));

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Xoá dữ liệu trên máy này' }).click();
  await expect(list(page)).toHaveValue('');
  await page.reload();
  await expect(list(page)).toHaveValue('');
  await expect(
    page.getByRole('combobox', { name: 'Lớp đang dùng' }).locator('option'),
  ).toHaveCount(1);
});

test('nhập danh sách từ file Excel và CSV, không gửi gì ra ngoài', async ({
  page,
  baseURL,
}) => {
  const external: string[] = [];
  page.on('request', (r) => {
    if (/^https?:/.test(r.url()) && !r.url().startsWith(baseURL!)) external.push(r.url());
  });
  await open(page);
  const rows = [
    ['STT', 'Họ và tên', 'Giới tính'],
    [1, 'Lê Văn An', 'Nam'],
    [2, 'Phạm Thị Bình', 'Nữ'],
  ].map((row) => row.map((value) => ({ value })));
  const buffer = await writeXlsxFile(rows).toBuffer();

  const input = page.getByLabel('Nhập từ Excel');
  await input.setInputFiles({ name: 'lop3a.xlsx', mimeType: 'application/xlsx', buffer });
  await expect(list(page)).toHaveValue('Lê Văn An, Nam\nPhạm Thị Bình, Nữ');
  await expect(page.getByText('Đã nhập 2 em từ file.')).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await input.setInputFiles({
    name: 'lop.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('﻿Họ tên;Giới tính\r\nVõ Chi;Nữ\r\n'),
  });
  await expect(list(page)).toHaveValue('Võ Chi, Nữ');

  await input.setInputFiles({
    name: 'hong.xlsx',
    mimeType: 'application/xlsx',
    buffer: Buffer.from('không phải excel'),
  });
  await expect(page.getByText('Chưa đọc được file.')).toBeVisible();
  expect(external).toEqual([]);
});

test('trình chiếu: chữ lớn, đổi nhóm bằng phím, thoát được', async ({ page }) => {
  await fill(page);
  await page.getByRole('button', { name: 'Toàn màn hình' }).click();
  const stage = page.getByRole('dialog', { name: 'Trình chiếu' });
  await expect(stage).toBeVisible();
  const smallest = await stage
    .locator('li li span')
    .first()
    .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(smallest).toBeGreaterThanOrEqual(48);

  await expect(stage.getByRole('button', { name: 'Đổi bộ khác' })).toBeInViewport();
  for (const key of ['ArrowRight', 'PageDown']) {
    const before = await stage.locator('ul').first().textContent();
    await page.keyboard.press(key);
    await expect(stage.locator('ul').first()).not.toHaveText(before!);
  }
  await page.getByRole('button', { name: 'Thoát toàn màn hình' }).click();
  await expect(stage).toBeHidden();
});

test('không tên nào tràn thẻ hay tràn trang, với mọi font, cỡ chữ, hướng giấy', async ({
  page,
}) => {
  test.setTimeout(180_000);
  // Khóa React trùng làm thẻ cũ còn nằm lại trên trang.
  const errors: string[] = [];
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  await open(page);
  await list(page).fill(
    Array.from({ length: 45 }, (_, i) => `Nguyễn Thị Phương Thương ${i + 1}`).join('\n'),
  );
  await expect(cards(page).first()).toBeVisible();
  const problems: string[] = [];
  for (const [font, family] of await printFonts(page)) {
    for (const largeText of [false, true]) {
      for (const orientation of ['portrait', 'landscape']) {
        for (const groupTotal of [1, 6]) {
          const found = await findOverflow(
            page,
            'kcc:tool:chia-nhom',
            {
              font,
              largeText,
              orientation,
              groupTotal,
              title: 'Chia nhóm thảo luận bài học Tự nhiên và Xã hội tuần này của lớp',
              school: 'Trường Tiểu học Nguyễn Thị Minh Khai',
            },
            family,
          );
          problems.push(
            ...found.map((p) => `${font} ${largeText} ${orientation} ${groupTotal}: ${p}`),
          );
        }
      }
    }
  }
  expect(problems).toEqual([]);
  expect(errors).toEqual([]);
});

test('hai nhóm trùng tên vẫn đúng số thẻ sau khi đổi tùy chọn', async ({ page }) => {
  await fill(page);
  await openGroup(page, 'Tên nhóm');
  await page.getByRole('textbox', { name: /Tên các nhóm/ }).fill(Array(4).fill('Sao').join('\n'));
  await openGroup(page, 'Cách chia');
  const count = page.getByRole('spinbutton', { name: 'Số nhóm' });
  for (const n of ['2', '4', '3']) {
    await count.fill(n);
    await expect(cards(page)).toHaveCount(Number(n));
    expect(await memberNames(page)).toHaveLength(NAMES.length);
  }
});

test('điện thoại 375px không tràn ngang', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto('/chia-nhom');
  await page.getByRole('button', { name: 'Tùy chọn' }).click();
  await list(page).fill(NAMES.join('\n'));
  await page.getByRole('button', { name: 'Xong' }).click();
  await expect(cards(page)).toHaveCount(4);
  await expectNoSideScroll(page);
});
