import { expect, test, type Page } from '@playwright/test';
import { expectNoSideScroll, openGroup } from './helpers';

// Micro giả của Chrome phát tiếng bíp, tự đồng ý xin quyền.
test.use({
  launchOptions: {
    args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
  },
  contextOptions: { reducedMotion: 'reduce' },
});

const NAMES = ['Lê Văn An', 'Phạm Thị Bình', 'Võ Chí Cường', 'Đỗ Mỹ Duyên', 'Hồ Quốc Em'];

const stage = (page: Page) => page.locator('.stage');
const tab = (page: Page, name: string) =>
  page.getByRole('group', { name: 'Chọn công cụ' }).getByRole('button', { name });
const button = (page: Page, name: string) => stage(page).getByRole('button', { name, exact: true });

async function open(page: Page) {
  await page.goto('/cong-cu-tren-lop');
  await expect(tab(page, 'Vòng quay gọi tên')).toBeVisible();
}

async function fillClass(page: Page) {
  await page.getByRole('textbox', { name: /Học sinh/ }).fill(NAMES.join('\n'));
}

test('vòng quay: mỗi em đúng một lần, nhớ sau khi tải lại, gọi lại từ đầu', async ({ page }) => {
  await open(page);
  await expect(stage(page)).toContainText('Chưa có học sinh');
  await fillClass(page);
  const result = stage(page).locator('[aria-live="assertive"]');
  const called: string[] = [];
  for (let i = 1; i <= NAMES.length; i++) {
    await button(page, 'Quay').click();
    await expect(stage(page)).toContainText(
      i < NAMES.length ? `Đã gọi ${i}/5 em.` : 'Đã gọi đủ 5 em.',
    );
    called.push((await result.textContent())!);
    if (i === 2) {
      await page.reload();
      await expect(stage(page)).toContainText('Đã gọi 2/5 em.');
    }
  }
  expect([...called].sort()).toEqual([...NAMES].sort());
  await expect(button(page, 'Quay')).toBeDisabled();
  await button(page, 'Gọi lại từ đầu').click();
  await expect(stage(page)).toContainText('Đã gọi 0/5 em.');
  await expect(result).toHaveText('');
});

test('vòng quay có hiệu ứng: kim dừng đúng tên được gọi', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await open(page);
  await fillClass(page);
  await button(page, 'Quay').click();
  await expect(button(page, 'Quay')).toBeDisabled();
  await expect(stage(page)).toContainText('Đã gọi 1/5 em.', { timeout: 10_000 });
  const winner = (await stage(page).locator('[aria-live="assertive"]').textContent())!;
  // Điểm ngay dưới kim phải thuộc ô mang tên em được gọi.
  const under = await page.locator('[data-wheel]').evaluate((el) => {
    const matrix = new DOMMatrix(getComputedStyle(el).transform);
    const turned = (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
    const labels = [...el.querySelectorAll('text')];
    const slice = 360 / labels.length;
    const angle = (((-turned % 360) + 360) % 360) / slice;
    return labels[Math.floor(angle)]!.textContent;
  });
  expect(under).toBe(winner);
});

test('đếm ngược: chạy, tạm dừng, chạy tiếp, hết giờ, đặt lại', async ({ page }) => {
  await page.clock.install();
  await open(page);
  await tab(page, 'Đếm ngược').click();
  const timer = stage(page).getByRole('timer');
  await expect(timer).toHaveText('5:00');
  await button(page, '1 phút').click();
  await expect(timer).toHaveText('1:00');
  await button(page, 'Bắt đầu').click();
  await page.clock.runFor(20_000);
  await expect(timer).toHaveText('0:40');
  await button(page, 'Tạm dừng').click();
  await page.clock.runFor(30_000);
  await expect(timer).toHaveText('0:40');
  await button(page, 'Chạy tiếp').click();

  // Chuyển công cụ, đồng hồ vẫn chạy.
  await tab(page, 'Bốc thăm').click();
  await page.clock.runFor(10_000);
  await expect(tab(page, 'Đếm ngược')).toContainText('0:30');
  await page.clock.runFor(31_000);
  await tab(page, 'Đếm ngược').click();
  await expect(stage(page)).toContainText('Hết giờ!');
  await expect(timer).toHaveText('0:00');
  await button(page, 'Đặt lại').click();
  await expect(timer).toHaveText('1:00');
});

test('bốc thăm: không lặp, xếp thứ tự cả lượt, danh sách tự nhập', async ({ page }) => {
  await open(page);
  await tab(page, 'Bốc thăm').click();
  const history = stage(page).getByRole('list', { name: 'Thứ tự đã bốc' }).locator('li b');
  await button(page, 'Rút thăm').click();
  await button(page, 'Rút thăm').click();
  await expect(history).toHaveCount(2);
  await button(page, 'Xếp thứ tự cả lượt').click();
  await expect(history).toHaveCount(10);
  expect((await history.allTextContents()).map(Number).sort((a, b) => a - b)).toEqual(
    Array.from({ length: 10 }, (_, i) => i + 1),
  );
  await expect(button(page, 'Rút thăm')).toBeDisabled();
  await button(page, 'Bốc lại từ đầu').click();
  await expect(history).toHaveCount(0);

  await page.getByRole('combobox', { name: 'Bốc từ' }).selectOption('danh-sach');
  await expect(stage(page)).toContainText('Chưa có mục nào');
  await page.getByRole('textbox', { name: 'Mỗi dòng một mục' }).fill('Tổ Một\nTổ Hai');
  await button(page, 'Rút thăm').click();
  await expect(stage(page).locator('[data-result]')).toHaveText(/^Tổ (Một|Hai)$/);

  await page.getByRole('button', { name: 'Về mặc định' }).click();
  await expect(tab(page, 'Vòng quay gọi tên')).toHaveAttribute('aria-pressed', 'true');
});

/** Ghi lại các luồng micro để kiểm đã tắt hẳn. */
const watchMicrophone = (page: Page) =>
  page.addInitScript(() => {
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    const tracks: MediaStreamTrack[] = [];
    Object.assign(window, { tracks });
    navigator.mediaDevices.getUserMedia = async (constraints) => {
      const stream = await original(constraints);
      tracks.push(...stream.getTracks());
      return stream;
    };
  });

const trackStates = (page: Page) =>
  page.evaluate(() =>
    (window as unknown as { tracks: MediaStreamTrack[] }).tracks.map((t) => t.readyState),
  );

test('đo tiếng ồn: bật đèn theo micro, tắt hẳn khi bấm tắt hoặc rời mục', async ({ page }) => {
  await watchMicrophone(page);
  await open(page);
  await tab(page, 'Đo tiếng ồn').click();
  // Chỉ xin quyền khi giáo viên bấm.
  expect(await trackStates(page)).toEqual([]);
  await button(page, 'Bật micro').click();
  await expect(stage(page).locator('[data-light][data-on]')).toHaveCount(1);
  await expect
    .poll(async () =>
      Number(await stage(page).getByRole('meter').getAttribute('aria-valuenow')),
    )
    .toBeGreaterThan(0);
  await button(page, 'Tắt micro').click();
  await expect(stage(page)).toContainText('Micro đang tắt');
  expect(await trackStates(page)).toEqual(['ended']);

  await button(page, 'Bật micro').click();
  await expect(button(page, 'Tắt micro')).toBeVisible();
  await tab(page, 'Bốc thăm').click();
  expect(await trackStates(page)).toEqual(['ended', 'ended']);
});

test('từ chối micro thì hướng dẫn cách bật lại', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = () =>
      Promise.reject(new DOMException('no', 'NotAllowedError'));
  });
  await open(page);
  await tab(page, 'Đo tiếng ồn').click();
  await button(page, 'Bật micro').click();
  await expect(stage(page).getByRole('alert')).toContainText('cho phép Micro');
  await expect(button(page, 'Bật micro')).toBeEnabled();
});

test('trình chiếu: chữ lớn, điều khiển bằng Space và bút, không tràn màn hình', async ({
  page,
}) => {
  await page.clock.install();
  await open(page);
  await fillClass(page);
  await page.getByRole('button', { name: 'Toàn màn hình' }).click();
  const dialog = page.getByRole('dialog', { name: 'Trình chiếu' });
  await expect(button(page, 'Quay')).toBeFocused();
  await page.keyboard.press('Space');
  await page.clock.runFor(100);
  await expect(dialog).toContainText('Đã gọi 1/5 em.');
  await page.keyboard.press('PageDown');
  await page.clock.runFor(100);
  await expect(dialog).toContainText('Đã gọi 2/5 em.');

  const size = (selector: string) =>
    dialog
      .locator(selector)
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(await size('[aria-live="assertive"]')).toBeGreaterThanOrEqual(48);

  for (const name of ['Vòng quay gọi tên', 'Đếm ngược', 'Đo tiếng ồn', 'Bốc thăm']) {
    await tab(page, name).click();
    const overflow = await dialog.evaluate((el) => [
      el.scrollWidth - el.clientWidth,
      el.scrollHeight - el.clientHeight,
    ]);
    expect(overflow, name).toEqual([0, 0]);
  }

  await tab(page, 'Đếm ngược').click();
  const timer = dialog.getByRole('timer');
  await expect(button(page, 'Bắt đầu')).toBeFocused();
  await page.keyboard.press('Space');
  await page.clock.runFor(3000);
  await expect(timer).toHaveText('4:57');
  await page.keyboard.press('ArrowRight');
  await expect(button(page, 'Chạy tiếp')).toBeVisible();
  await page.keyboard.press('PageUp');
  await expect(timer).toHaveText('5:00');

  await page.getByRole('button', { name: 'Thoát toàn màn hình' }).click();
  await expect(dialog).toBeHidden();
});

test('không gửi gì ra ngoài; điện thoại 375px không tràn ngang ở mọi mục', async ({
  page,
  baseURL,
}) => {
  const external: string[] = [];
  page.on('request', (r) => {
    if (/^https?:/.test(r.url()) && !r.url().startsWith(baseURL!)) external.push(r.url());
  });
  await page.setViewportSize({ width: 375, height: 740 });
  await open(page);
  await page.getByRole('button', { name: 'Tùy chọn' }).click();
  await openGroup(page, 'Danh sách lớp');
  await page
    .getByRole('textbox', { name: /Học sinh/ })
    .fill(Array.from({ length: 40 }, (_, i) => `Nguyễn Thị Phương Thương ${i + 1}`).join('\n'));
  await page.getByRole('button', { name: 'Xong' }).click();
  await button(page, 'Quay').click();
  await expect(stage(page)).toContainText('Đã gọi 1/40 em.');
  for (const name of ['Vòng quay gọi tên', 'Đếm ngược', 'Đo tiếng ồn', 'Bốc thăm']) {
    await tab(page, name).click();
    await expectNoSideScroll(page);
  }
  expect(external).toEqual([]);
});
