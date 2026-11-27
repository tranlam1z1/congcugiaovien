import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { expectNoSideScroll, openGroup } from './helpers';

const QUESTIONS = 'Một cộng một?\nA. 1\n*B. 2\n\nThủ đô Việt Nam? | Hà Nội';

async function open(page: Page) {
  await page.goto('/tro-choi-on-tap');
  await expect(page.getByText('Đọc được 6 câu hỏi.')).toBeVisible();
}

const questionBox = (page: Page) => page.getByRole('textbox', { name: 'Bộ câu hỏi' });
const boxes = (page: Page) => page.getByRole('list', { name: 'Hộp quà' }).getByRole('button');
const scores = (page: Page) => page.locator('[data-score]');

test('hộp quà: chơi hết ván, điểm được nhớ sau khi tải lại', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  await open(page);
  await questionBox(page).fill(QUESTIONS);
  await openGroup(page, 'Hộp quà bí mật');
  await page.getByRole('spinbutton', { name: 'Số đội' }).fill('2');
  await page.getByRole('spinbutton', { name: 'Số hộp bất ngờ' }).fill('0');
  await page.getByRole('textbox', { name: /^Tên đội/ }).fill('Hổ\nSóc');
  await expect(boxes(page)).toHaveCount(2);

  await page.getByRole('button', { name: 'Mở hộp 1' }).click();
  await expect(page.locator('[data-correct]')).toHaveCount(0);
  await expect(page.getByText('Hà Nội', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Hiện đáp án' }).click();
  await expect(page.locator('[data-correct], [data-answer]').first()).toContainText(/2|Hà Nội/);
  await page.getByRole('button', { name: 'Đúng (+10)' }).click();
  await expect(page.getByText('Lượt của Sóc')).toBeVisible();

  await page.reload();
  await expect(scores(page)).toHaveText(['10', '0']);
  await expect(page.getByRole('button', { name: 'Hộp 1, đã mở' })).toBeDisabled();

  await page.getByRole('button', { name: 'Mở hộp 2' }).click();
  await page.getByRole('button', { name: 'Đóng hộp' }).click();
  await page.getByRole('button', { name: 'Mở hộp 2' }).click();
  await page.getByRole('button', { name: 'Sai', exact: true }).click();
  await expect(page.getByText('Chiến thắng: Hổ')).toBeVisible();
  await page.getByRole('button', { name: 'Cộng 10 điểm cho Sóc' }).click();
  await expect(page.getByText('Đồng hạng nhất: Hổ, Sóc')).toBeVisible();

  await page.getByRole('button', { name: 'Ván mới' }).click();
  await expect(scores(page)).toHaveText(['0', '0']);
  await expect(boxes(page)).toHaveCount(2);
  expect(errors).toEqual([]);
});

test('hộp bất ngờ tính điểm ngay; bút trình chiếu đi tiếp', async ({ page }) => {
  await open(page);
  await openGroup(page, 'Hộp quà bí mật');
  await page.getByRole('spinbutton', { name: 'Số hộp bất ngờ' }).fill('8');
  await expect(boxes(page)).toHaveCount(14);
  await page.getByRole('button', { name: 'Toàn màn hình' }).click();
  const stage = page.getByRole('dialog', { name: 'Trình chiếu' });

  let surprises = 0;
  for (let i = 1; i <= 14; i++) {
    await stage.getByRole('button', { name: `Mở hộp ${i}`, exact: true }).click();
    const more = stage.getByRole('button', { name: 'Tiếp tục' });
    if (await more.isVisible()) {
      surprises++;
      await expect(stage.getByText(/được cộng \d+ điểm|bị trừ \d+ điểm/)).toBeVisible();
      await page.keyboard.press('PageDown');
    } else {
      const size = await stage.locator('h2').evaluate((h) => parseFloat(getComputedStyle(h).fontSize));
      expect(size).toBeGreaterThanOrEqual(48);
      await page.keyboard.press('PageDown');
      await expect(stage.getByRole('button', { name: 'Hiện đáp án' })).toBeDisabled();
      await stage.getByRole('button', { name: /^Đúng/ }).click();
    }
  }
  expect(surprises).toBe(8);
  await expect(stage.getByText(/Chiến thắng|Đồng hạng/)).toBeVisible();
});

test('rung chuông vàng: đếm ngược, lật đáp án, loại học sinh', async ({ page }) => {
  await page.clock.install();
  await open(page);
  await page.getByRole('button', { name: 'Rung chuông vàng' }).click();
  await openGroup(page, 'Rung chuông vàng');
  await page.getByRole('spinbutton', { name: 'Số giây mỗi câu' }).fill('5');
  await page.getByRole('textbox', { name: /^Học sinh/ }).fill('An\nBình\nAn');
  await expect(page.getByText('Câu 1/6 · Còn 3/3 bạn')).toBeVisible();

  const timer = page.getByRole('timer');
  await expect(timer).toHaveText('0:05');
  await page.getByRole('button', { name: 'Bắt đầu đếm' }).click();
  await page.clock.runFor(2000);
  await expect(timer).toHaveText('0:03');
  await page.clock.runFor(4000);
  await expect(page.getByText('Hết giờ! Giơ bảng.')).toBeVisible();
  await expect(page.locator('[data-correct]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Hiện đáp án' }).click();
  await expect(page.locator('[data-correct]')).toHaveText(/Hà Nội/);

  // Hai em trùng tên được loại riêng.
  const students = page.getByRole('list', { name: 'Học sinh' });
  await students.getByRole('button', { name: 'An', exact: true }).first().click();
  await expect(page.getByText('Còn 2/3 bạn')).toBeVisible();
  await page.getByRole('button', { name: 'Câu tiếp' }).click();
  await expect(page.getByText('Câu 2/6 · Còn 2/3 bạn')).toBeVisible();
  await expect(page.locator('[data-correct]')).toHaveCount(0);
  await expect(timer).toHaveText('0:05');

  await page.reload();
  await expect(page.getByText('Câu 2/6 · Còn 2/3 bạn')).toBeVisible();
  await page.getByRole('button', { name: /^Cứu trợ/ }).click();
  await expect(page.getByText('Còn 3/3 bạn')).toBeVisible();

  // Một phím cho ba bước: đếm, lật, sang câu.
  await page.getByRole('button', { name: 'Toàn màn hình' }).click();
  await page.keyboard.press('PageDown');
  await expect(page.getByRole('button', { name: 'Tạm dừng' })).toBeVisible();
  await page.keyboard.press('PageDown');
  await expect(page.locator('[data-correct]')).toHaveCount(1);
  await page.keyboard.press('PageDown');
  await expect(page.getByText('Câu 3/6')).toBeVisible();
});

test('lỗi nhập được báo; lưu và mở file .txt', async ({ page }) => {
  await open(page);
  await questionBox(page).fill('Thiếu đáp án\nA. x\nB. y');
  await expect(page.getByRole('alert')).toContainText('chưa đánh dấu đáp án đúng');
  await expect(page.getByText('Nhập câu hỏi ở mục “Câu hỏi” để bắt đầu.')).toBeVisible();

  await questionBox(page).fill(QUESTIONS);
  const wait = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Lưu file .txt' }).click();
  const download = await wait;
  expect(download.suggestedFilename()).toBe('cau-hoi-on-tap.txt');
  expect(await readFile(await download.path(), 'utf8')).toBe(QUESTIONS);

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Xoá hết' }).click();
  await expect(questionBox(page)).toHaveValue('');
  await page.getByLabel('Mở file .txt').setInputFiles({
    name: 'on-tap.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(`﻿${QUESTIONS}`, 'utf8'),
  });
  await expect(questionBox(page)).toHaveValue(QUESTIONS);
  await expect(page.getByText('Đọc được 2 câu hỏi.')).toBeVisible();
});

test('375px không tràn ngang ở cả hai trò', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto('/tro-choi-on-tap');
  await expect(boxes(page).first()).toBeVisible();
  await expectNoSideScroll(page);
  await page.getByRole('button', { name: 'Mở hộp 1', exact: true }).click();
  await expectNoSideScroll(page);
  await page.getByRole('button', { name: 'Rung chuông vàng' }).click();
  await expect(page.getByRole('timer')).toBeVisible();
  await expectNoSideScroll(page);
});
