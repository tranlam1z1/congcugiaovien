import { defineConfig, devices } from '@playwright/test';

const DEV = 'http://localhost:5173';
const PREVIEW = 'http://localhost:4173';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // 8 Chrome cùng lúc làm máy chậm tới mức test hết giờ khi mở trang hoặc in.
  workers: 4,
  reporter: 'list',
  // Máy chủ dev biên dịch công cụ khi mở lần đầu, chạy song song thì có lúc quá 5 giây.
  expect: { timeout: 15_000 },
  use: {
    // Dùng Chrome đã cài trên máy, không tải trình duyệt riêng.
    ...devices['Desktop Chrome'],
    channel: 'chrome',
    locale: 'vi-VN',
  },
  projects: [
    { name: 'dev', testIgnore: /build\.spec/, use: { baseURL: DEV } },
    // Bản build đã prerender. Chạy `npm run build` trước.
    { name: 'build', testMatch: /build\.spec/, use: { baseURL: PREVIEW } },
  ],
  webServer: [
    { command: 'npm run dev -- --port 5173 --strictPort', url: DEV, reuseExistingServer: true },
    {
      command: 'npm run preview -- --port 4173 --strictPort',
      url: PREVIEW,
      reuseExistingServer: true,
    },
  ],
});
