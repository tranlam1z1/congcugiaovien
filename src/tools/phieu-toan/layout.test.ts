import { describe, expect, it } from 'vitest';
import { PRINT_FONTS } from '@/core/print/fonts';
import { FORMS, RANGES, toConfig } from './generator';
import { layoutSheet, maxColumns } from './layout';

const items = (n: number) => Array.from({ length: n }, (_, i) => i);

describe('chia trang', () => {
  it('không mất câu, hàng nằm gọn trong trang A4', () => {
    for (const form of FORMS) {
      for (const large of [false, true]) {
        for (const columns of [1, 3, 5]) {
          for (const count of [1, 17, 100]) {
            const { rowHeight, pages } = layoutSheet(items(count), { form }, columns, large);
            expect(pages.flat()).toEqual(items(count));
            for (const page of pages) {
              const height = Math.ceil(page.length / columns) * rowHeight;
              expect(height).toBeLessThanOrEqual(273 - (large ? 68 : 54) + 0.001);
            }
          }
        }
      }
    }
  });

  it('luôn cho từ 1 đến 5 cột, chữ to hoặc số dài thì ít cột hơn', () => {
    for (const font of PRINT_FONTS) {
      for (const form of FORMS) {
        for (const range of RANGES) {
          const config = toConfig({ ops: ['add'], form, range });
          const normal = maxColumns(config, font, false);
          const large = maxColumns(config, font, true);
          expect(large).toBeGreaterThanOrEqual(1);
          expect(normal).toBeLessThanOrEqual(5);
          expect(large).toBeLessThanOrEqual(normal);
        }
      }
    }
    const font = PRINT_FONTS[0];
    expect(maxColumns(toConfig({ range: 1000, form: 'o-trong' }), font, true)).toBeLessThan(
      maxColumns(toConfig({ range: 10, form: 'ngang' }), font, false),
    );
  });
});
