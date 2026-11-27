/**
 * `@pdf-lib/fontkit` có lỗi khi cắt bớt font: bảng `loca` ghi dạng ngắn (vị trí chia đôi)
 * kể cả khi glyph dài lẻ byte, làm mất chữ trong PDF (Andika, Playpen Sans, Patrick Hand,
 * Pangolin...). Ép dùng dạng dài. Phần chữ vẫn trích được nên chỉ nhìn mới thấy lỗi.
 */
import fontkit from '@pdf-lib/fontkit';

type Subset = {
  loca: { version?: number };
  /** Chỉ có ở font TrueType. */
  _addGlyph?: (glyphId: number) => number;
};

type Font = { createSubset: () => Subset };

type Create = (data: Uint8Array, postscriptName?: string) => Font;

const create = fontkit.create as unknown as Create;

export const pdfFontkit = {
  ...fontkit,
  create: ((data, postscriptName) => {
    const font = create(data, postscriptName);
    const createSubset = font.createSubset.bind(font);
    font.createSubset = () => {
      const subset = createSubset();
      const addGlyph = subset._addGlyph;
      if (addGlyph) {
        subset._addGlyph = function (this: Subset, glyphId) {
          this.loca.version = 1;
          return addGlyph.call(this, glyphId);
        };
      }
      return subset;
    };
    return font;
  }) satisfies Create,
} as unknown as typeof fontkit;
