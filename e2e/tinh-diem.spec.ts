import { expect, test, type Page } from '@playwright/test';

const row = (page: Page, name: string) => page.getByRole('listitem', { name, exact: true });
const verdict = (page: Page) => page.getByRole('region', { name: 'Kết quả' });

/** Điền cùng một bộ điểm cho cả 8 môn chấm điểm của mẫu THCS. */
async function fillAll(page: Page, regular: string, midterm: string, final: string) {
  for (const input of await page.getByRole('textbox', { name: 'Thường xuyên' }).all()) {
    await input.fill(regular);
  }
  for (const input of await page.getByRole('textbox', { name: 'Giữa kỳ' }).all()) {
    await input.fill(midterm);
  }
  for (const input of await page.getByRole('textbox', { name: 'Cuối kỳ' }).all()) {
    await input.fill(final);
  }
}

async function open(page: Page) {
  await page.goto('/tinh-diem-xep-loai');
  await expect(row(page, 'Toán')).toBeVisible();
}

test('tính điểm học kỳ, xếp loại và điều chỉnh theo khoản 3', async ({ page }) => {
  await open(page);
  await expect(page.getByText('chỉ để tham khảo').first()).toBeVisible();
  await expect(verdict(page)).toContainText('Còn 8 môn chưa đủ điểm');

  await fillAll(page, '8 9', '8,5', '9');
  await expect(row(page, 'Toán').locator('output')).toHaveText('8,7');
  await expect(verdict(page)).toContainText('Gợi ý xếp loại: Tốt');

  const maths = row(page, 'Toán');
  await maths.getByRole('textbox', { name: 'Thường xuyên' }).fill('4 4');
  await maths.getByRole('textbox', { name: 'Giữa kỳ' }).fill('4');
  await maths.getByRole('textbox', { name: 'Cuối kỳ' }).fill('4');
  await expect(verdict(page)).toContainText('Gợi ý xếp loại: Khá');
  await expect(verdict(page)).toContainText('Theo mức điểm thì là Đạt');

  await row(page, 'Nghệ thuật').getByRole('combobox', { name: 'Kết quả' }).selectOption('fail');
  await expect(verdict(page)).toContainText('Gợi ý xếp loại: Đạt');
});

test('điểm sai báo ngay tại môn đó', async ({ page }) => {
  await open(page);
  await fillAll(page, '8 9', '8', '9');
  const maths = row(page, 'Toán');
  await maths.getByRole('textbox', { name: 'Giữa kỳ' }).fill('11');
  await expect(maths.getByRole('alert')).toContainText('“11” không phải điểm');
  await expect(maths.getByRole('textbox', { name: 'Giữa kỳ' })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
  await expect(verdict(page)).toContainText('Còn 1 môn chưa đủ điểm');
});

test('chế độ cả năm; thêm, bớt môn', async ({ page }) => {
  await open(page);
  await page.getByRole('button', { name: 'Điểm cả năm' }).click();
  const maths = row(page, 'Toán');
  await maths.getByRole('textbox', { name: 'TB học kỳ I', exact: true }).fill('6,4');
  await maths.getByRole('textbox', { name: 'TB học kỳ II' }).fill('6,5');
  await expect(maths.locator('output')).toHaveText('6,5');

  await page.getByRole('button', { name: 'Thêm môn' }).click();
  await expect(row(page, 'Môn 13')).toBeVisible();
  await page.getByRole('button', { name: 'Bớt môn Môn 13' }).click();
  await expect(row(page, 'Môn 13')).toHaveCount(0);
});

test('nhớ điểm sau khi tải lại; "Về mặc định" hỏi trước khi xoá', async ({ page }) => {
  await open(page);
  const input = row(page, 'Toán').getByRole('textbox', { name: 'Thường xuyên' });
  await input.fill('7 8');
  await page.reload();
  await expect(input).toHaveValue('7 8');

  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Về mặc định' }).click();
  await expect(input).toHaveValue('7 8');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Về mặc định' }).click();
  await expect(input).toHaveValue('');
});

test('chép kết quả vào bộ nhớ tạm', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await open(page);
  await fillAll(page, '8 9', '8,5', '9');
  await page.getByRole('button', { name: 'Chép kết quả' }).click();
  await expect(page.getByText('Đã chép.')).toBeVisible();
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain('Toán: 8,7');
  expect(text).toContain('Gợi ý xếp loại: Tốt');
});

test('không chép tự động được thì bôi đen sẵn nội dung', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('blocked')) },
    });
  });
  await open(page);
  await page.getByRole('button', { name: 'Chép kết quả' }).click();
  await expect(page.getByRole('textbox', { name: 'Nội dung để chép' })).toBeFocused();
});

test('điện thoại 375px không tràn ngang', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await open(page);
  await fillAll(page, '8 9 10 7,5 6,5', '8,5', '9');
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
  ).toBeLessThanOrEqual(0);
});
