import { readFile } from 'node:fs/promises';
import { createCanvas } from '@napi-rs/canvas';
import { expect, type Locator, type Page } from '@playwright/test';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

export const PT_PER_MM = 72 / 25.4;
export const squash = (text: string) => text.normalize('NFC').replace(/\s+/g, '');

const load = (data: Buffer) => getDocument({ data: new Uint8Array(data) }).promise;

/** Kích thước (mm) và chữ của từng trang. */
export async function readPdf(data: Buffer) {
  const doc = await load(data);
  const pages: { width: number; height: number; text: string }[] = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const content = await page.getTextContent();
    pages.push({
      width: page.view[2]! / PT_PER_MM,
      height: page.view[3]! / PT_PER_MM,
      text: squash(content.items.map((i) => ('str' in i ? i.str : '')).join('')),
    });
  }
  return pages;
}

export type Pixels = { data: Uint8ClampedArray; width: number; height: number };

/** Dựng một trang PDF thành ảnh với độ phân giải cho trước (điểm ảnh trên mm). */
export async function rasterize(
  data: Buffer,
  pixelsPerMm: number,
  pageNumber = 1,
): Promise<Pixels> {
  const page = await (await load(data)).getPage(pageNumber);
  const viewport = page.getViewport({ scale: pixelsPerMm / PT_PER_MM });
  const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
  const context = canvas.getContext('2d');
  await page.render({
    canvas: canvas as unknown as HTMLCanvasElement,
    canvasContext: context as unknown as CanvasRenderingContext2D,
    viewport,
  }).promise;
  return context.getImageData(0, 0, canvas.width, canvas.height);
}

/** Chrome chạy ngầm thỉnh thoảng báo "Printing failed" khi nhiều trang in cùng lúc: thử lại. */
export async function printPdf(page: Page) {
  try {
    return await page.pdf({ preferCSSPageSize: true });
  } catch (error) {
    if (!String(error).includes('Printing failed')) throw error;
    return page.pdf({ preferCSSPageSize: true });
  }
}

export const pageCount = async (page: Page) => {
  const label = await page.getByText(/^\d+ trang /).textContent();
  return Number(label!.split(' ')[0]);
};

export async function downloadFile(page: Page, button: string, within: Page | Locator = page) {
  const wait = page.waitForEvent('download');
  await within.getByRole('button', { name: button }).click();
  const download = await wait;
  return { name: download.suggestedFilename(), data: await readFile(await download.path()) };
}

export async function openGroup(page: Page, title: string) {
  const group = page.locator('details', { has: page.locator('summary', { hasText: title }) });
  if ((await group.getAttribute('open')) === null) await group.locator('summary').click();
}

export async function expectNoSideScroll(page: Page) {
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
  ).toBeLessThanOrEqual(0);
}

/**
 * Đặt tùy chọn công cụ rồi tìm mục tràn khung hoặc tràn lề trang (lề 12 mm, cho lấn 4 mm).
 */
export function findOverflow(page: Page, key: string, options: object, family: string) {
  return page.evaluate(
    async ({ key, options, family }) => {
      localStorage.setItem(key, JSON.stringify(options));
      dispatchEvent(new StorageEvent('storage'));
      const frame = () => new Promise((done) => requestAnimationFrame(done));
      await frame();
      await document.fonts.load(`13pt "${family}"`, 'Ế0');
      await document.fonts.load(`bold 13pt "${family}"`, 'Ế0');
      await document.fonts.ready;
      await frame();

      const issues: string[] = [];
      if (!document.querySelector('[data-item]')) issues.push('không có mục nào');
      for (const item of document.querySelectorAll<HTMLElement>('[data-item]')) {
        const wide = [item, ...item.querySelectorAll<HTMLElement>('li, p, h3')].find(
          (el) => el.scrollWidth > el.clientWidth + 1,
        );
        if (wide) issues.push(`tràn khung: ${wide.textContent?.slice(0, 40)}`);
      }
      for (const sheet of document.querySelectorAll<HTMLElement>('.a4-page')) {
        const box = sheet.getBoundingClientRect();
        const mm = box.width / Number(sheet.dataset.width);
        for (const el of sheet.querySelectorAll('[data-item], [data-item] *')) {
          const r = el.getBoundingClientRect();
          if (r.bottom > box.bottom - 8 * mm || r.right > box.right - 8 * mm) {
            issues.push(`tràn trang: ${el.textContent?.slice(0, 40)}`);
            break;
          }
        }
      }
      return issues.slice(0, 2);
    },
    { key, options, family },
  );
}

export const printFonts = (page: Page) =>
  page.evaluate(async () => {
    const module = await import('/src/core/print/fonts.ts' as string);
    return module.PRINT_FONTS.map((f: { id: string; family: string }) => [f.id, f.family]) as [
      string,
      string,
    ][];
  });
