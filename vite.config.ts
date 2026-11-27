import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  optimizeDeps: {
    // Thư viện chỉ nạp khi dùng tới: gói sẵn để máy chủ dev không tải lại trang giữa chừng.
    include: [
      '@pdf-lib/fontkit',
      'idb-keyval',
      'pdf-lib',
      'pdfjs-dist/legacy/build/pdf.mjs',
      'qrcode',
      'read-excel-file/browser',
      'write-excel-file/browser',
    ],
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
});
