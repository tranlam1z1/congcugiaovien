// Chạy Vitest/Playwright với đường dẫn đúng chữ hoa thường.
// Trên Windows, mở terminal ở "d:\..." (ổ đĩa viết thường) làm hai công cụ này
// nạp trùng module và hỏng toàn bộ test.
import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import path from 'node:path';

const bins = {
  vitest: 'node_modules/vitest/vitest.mjs',
  playwright: 'node_modules/@playwright/test/cli.js',
};
const [name, ...args] = process.argv.slice(2);
const cwd = realpathSync.native(process.cwd());
const result = spawnSync(process.execPath, [path.join(cwd, bins[name]), ...args], {
  cwd,
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
