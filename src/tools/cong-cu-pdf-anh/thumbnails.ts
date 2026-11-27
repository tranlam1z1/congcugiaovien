/** Đếm trang và vẽ hình thu nhỏ bằng pdfjs (chạy trong worker riêng của nó). */
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { ToolError } from './pdfOps';

const WIDTH = 160;

export async function openPdf(file: File) {
  // Chỉ nạp khi cần: thư viện không chạy được lúc dựng sẵn HTML.
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  let document;
  try {
    document = await task.promise;
  } catch (error) {
    void task.destroy();
    throw new ToolError(
      (error as Error).name === 'PasswordException'
        ? `“${file.name}” có mật khẩu. Hãy gỡ mật khẩu rồi chọn lại.`
        : `Không đọc được “${file.name}”. File có thể bị hỏng hoặc không phải PDF.`,
    );
  }
  return {
    pages: document.numPages,
    /** Ảnh JPEG của một trang (tính từ 0). */
    async thumbnail(index: number) {
      const page = await document.getPage(index + 1);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: WIDTH / Math.max(base.width, base.height) });
      const canvas = window.document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvas, viewport }).promise;
      page.cleanup();
      return canvas.toDataURL('image/jpeg', 0.75);
    },
    close: () => void task.destroy(),
  };
}

export type OpenPdf = Awaited<ReturnType<typeof openPdf>>;
