/**
 * Xuất các trang `[data-a4-page]` thành PDF vector, nhúng font tiếng Việt.
 * Đọc bố cục từ chính DOM đang xem trước nên PDF khớp bản in.
 *
 * Hỗ trợ: chữ, màu nền, viền (liền, đứt, chấm, bo góc), <img>, và SVG
 * (path, line, rect, circle, ellipse, polyline, polygon, text).
 * Chưa hỗ trợ: ::before/::after, dấu đầu dòng của danh sách, ô nhập,
 * gradient, đổ bóng, CSS transform bên trong trang, <use>, clip-path.
 * Công cụ in phải dựng nội dung trong phạm vi này.
 */
import {
  concatTransformationMatrix,
  LineCapStyle,
  LineJoinStyle,
  PDFDocument,
  popGraphicsState,
  pushGraphicsState,
  rgb,
  setLineJoin,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from 'pdf-lib';
import { MM_PER_PX, PT_PER_MM } from '../print/paper';
import { pdfFontkit } from './fontkit';
import { findPdfFont, type PdfFontFace } from './pdfFonts';

/** Điểm PDF trên một CSS px (chưa tính thu phóng xem trước). */
const PT_PER_PX = MM_PER_PX * PT_PER_MM;

/**
 * Giữ nguyên chữ có dấu dựng sẵn. Một số font (Playpen Sans, Playwrite VN) dùng `ccmp`
 * tách "ớ" thành chữ và dấu rời, mà pdf-lib không đặt dấu đúng chỗ.
 * Liga và calt tắt giống CSS của trang A4.
 */
const FONT_FEATURES: Record<string, boolean> = {
  ccmp: false,
  calt: false,
  liga: false,
  clig: false,
};

type Paint = { color: ReturnType<typeof rgb>; alpha: number };

type PageContext = {
  page: PDFPage;
  height: number;
  /** Đổi tọa độ màn hình sang điểm PDF tính từ góc trên trái trang. */
  x: (screenX: number) => number;
  y: (screenY: number) => number;
};

type Box = { left: number; top: number; width: number; height: number };

function createPaintParser() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  const cache = new Map<string, Paint | null>();

  // Canvas hiểu mọi cú pháp màu CSS (rgb, oklch, color()...).
  return (css: string): Paint | null => {
    if (!css || css === 'none' || css === 'transparent' || css.startsWith('url(')) return null;
    let paint = cache.get(css);
    if (paint === undefined) {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = css;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data as unknown as number[];
      paint = a ? { color: rgb(r! / 255, g! / 255, b! / 255), alpha: a / 255 } : null;
      cache.set(css, paint);
    }
    return paint;
  };
}

/** Vị trí đường chân chữ so với khung chữ mà trình duyệt trả về. */
function createBaselineMeter() {
  const cache = new Map<string, number>();
  return (style: CSSStyleDeclaration): number => {
    const key = `${style.fontStyle} ${style.fontWeight} ${style.fontFamily}`;
    let ratio = cache.get(key);
    if (ratio === undefined) {
      const probe = document.createElement('div');
      probe.style.cssText = 'position:absolute;left:-9999px;top:0;white-space:nowrap;line-height:2';
      probe.style.fontFamily = style.fontFamily;
      probe.style.fontWeight = style.fontWeight;
      probe.style.fontStyle = style.fontStyle;
      probe.style.fontSize = '100px';
      const text = document.createTextNode('Ếg');
      const marker = document.createElement('span');
      marker.style.cssText = 'display:inline-block;width:1px;height:0';
      probe.append(text, marker);
      document.body.append(probe);
      const range = document.createRange();
      range.selectNodeContents(text);
      const textBox = range.getBoundingClientRect();
      ratio = (marker.getBoundingClientRect().bottom - textBox.top) / textBox.height;
      probe.remove();
      cache.set(key, ratio);
    }
    return ratio;
  };
}

function createFontLoader(doc: PDFDocument) {
  const cache = new Map<string, Promise<PDFFont>>();
  return (face: PdfFontFace) => {
    let font = cache.get(face.url);
    if (!font) {
      font = fetch(face.url).then(async (response) => {
        if (!response.ok) throw new Error(`Không tải được font (${response.status})`);
        return doc.embedFont(await response.arrayBuffer(), {
          subset: true,
          features: FONT_FEATURES,
        });
      });
      cache.set(face.url, font);
    }
    return font;
  };
}

function roundedRectPath(w: number, h: number, r: number) {
  if (r <= 0) return `M0 0H${w}V${h}H0Z`;
  const rx = Math.min(r, w / 2);
  const ry = Math.min(r, h / 2);
  return (
    `M${rx} 0H${w - rx}A${rx} ${ry} 0 0 1 ${w} ${ry}V${h - ry}A${rx} ${ry} 0 0 1 ${w - rx} ${h}` +
    `H${rx}A${rx} ${ry} 0 0 1 0 ${h - ry}V${ry}A${rx} ${ry} 0 0 1 ${rx} 0Z`
  );
}

const dashFor = (style: string, width: number) =>
  style === 'dashed' ? [width * 3, width * 2] : style === 'dotted' ? [0, width * 2] : undefined;

export async function buildPdf(root: ParentNode, options: { title?: string } = {}) {
  const pages = [...root.querySelectorAll<HTMLElement>('[data-a4-page]')];
  if (pages.length === 0) throw new Error('Chưa có trang nào để xuất');
  await document.fonts.ready;

  const doc = await PDFDocument.create();
  doc.registerFontkit(pdfFontkit);
  doc.setLanguage('vi-VN');
  if (options.title) doc.setTitle(options.title);

  const parsePaint = createPaintParser();
  const baselineOf = createBaselineMeter();
  const loadFont = createFontLoader(doc);
  const images = new Map<string, Promise<PDFImage>>();

  function drawBox(ctx: PageContext, el: Element, style: CSSStyleDeclaration, opacity: number) {
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const box: Box = {
      left: ctx.x(rect.left),
      top: ctx.y(rect.top),
      width: ctx.x(rect.right) - ctx.x(rect.left),
      height: ctx.y(rect.bottom) - ctx.y(rect.top),
    };
    const sides = (['Top', 'Right', 'Bottom', 'Left'] as const).map((side) => {
      const lineStyle = style[`border${side}Style`];
      const width =
        lineStyle === 'none' || lineStyle === 'hidden'
          ? 0
          : parseFloat(style[`border${side}Width`]) * PT_PER_PX;
      return { side, style: lineStyle, width, paint: parsePaint(style[`border${side}Color`]) };
    });
    const radiusCss = style.borderTopLeftRadius.split(' ')[0]!;
    const radius = radiusCss.endsWith('%')
      ? (parseFloat(radiusCss) / 100) * Math.max(box.width, box.height)
      : parseFloat(radiusCss) * PT_PER_PX;
    const origin = { x: box.left, y: ctx.height - box.top };

    const background = parsePaint(style.backgroundColor);
    if (background) {
      ctx.page.drawSvgPath(roundedRectPath(box.width, box.height, radius), {
        ...origin,
        color: background.color,
        opacity: background.alpha * opacity,
        borderWidth: 0,
      });
    }

    const [top] = sides;
    const uniform = sides.every(
      (s) =>
        s.width === top!.width &&
        s.style === top!.style &&
        style[`border${s.side}Color`] === style.borderTopColor,
    );
    if (radius > 0 && uniform) {
      const { width, paint } = top!;
      if (!width || !paint) return;
      ctx.page.drawSvgPath(
        roundedRectPath(box.width - width, box.height - width, radius - width / 2),
        {
          x: origin.x + width / 2,
          y: origin.y - width / 2,
          borderColor: paint.color,
          borderOpacity: paint.alpha * opacity,
          borderWidth: width,
          borderDashArray: dashFor(top!.style, width),
          borderLineCap: top!.style === 'dotted' ? LineCapStyle.Round : undefined,
        },
      );
      return;
    }

    // Bảng gộp viền: viền nằm giữa cạnh ô thay vì nằm trong khung.
    const collapsed = style.borderCollapse === 'collapse';
    for (const { side, style: lineStyle, width, paint } of sides) {
      if (!width || !paint) continue;
      const inset = collapsed ? 0 : width / 2;
      const startX =
        side === 'Left'
          ? box.left + inset
          : side === 'Right'
            ? box.left + box.width - inset
            : box.left;
      const startY =
        side === 'Top'
          ? box.top + inset
          : side === 'Bottom'
            ? box.top + box.height - inset
            : box.top;
      const start = { x: startX, y: ctx.height - startY };
      const end = side === 'Top' || side === 'Bottom'
        ? { x: start.x + box.width, y: start.y }
        : { x: start.x, y: start.y - box.height };
      ctx.page.drawLine({
        start,
        end,
        thickness: width,
        color: paint.color,
        opacity: paint.alpha * opacity,
        dashArray: dashFor(lineStyle, width),
        lineCap: lineStyle === 'dotted' ? LineCapStyle.Round : undefined,
      });
    }
  }

  async function drawText(
    ctx: PageContext,
    node: Text,
    style: CSSStyleDeclaration,
    opacity: number,
  ) {
    const paint = parsePaint(style.color);
    if (!paint || !node.data.trim()) return;
    const font = await loadFont(
      findPdfFont(style.fontFamily, Number(style.fontWeight), style.fontStyle !== 'normal'),
    );
    const size = parseFloat(style.fontSize) * PT_PER_PX;
    const baseline = baselineOf(style);
    const transform = (text: string) => {
      const value = text.normalize('NFC');
      if (style.textTransform === 'uppercase') return value.toLocaleUpperCase('vi');
      if (style.textTransform === 'lowercase') return value.toLocaleLowerCase('vi');
      if (style.textTransform === 'capitalize')
        return value.replace(/^\p{L}/u, (c) => c.toLocaleUpperCase('vi'));
      return value;
    };
    const range = document.createRange();
    const spaced = parseFloat(style.letterSpacing) > 0;
    const underline = style.textDecorationLine.includes('underline');

    const draw = (start: number, end: number) => {
      range.setStart(node, start);
      range.setEnd(node, end);
      const rects = [...range.getClientRects()].filter((r) => r.width > 0);
      if (rects.length === 0) return;
      // Từ bị ngắt qua hai dòng hoặc có giãn chữ: vẽ từng cụm ký tự.
      if ((rects.length > 1 || spaced) && end - start > 1) {
        let offset = start;
        // Gộp ký tự gốc với dấu tổ hợp đi kèm.
        for (const part of node.data.slice(start, end).match(/\P{M}\p{M}*|\p{M}+/gu) ?? []) {
          draw(offset, offset + part.length);
          offset += part.length;
        }
        return;
      }
      const rect = rects[0]!;
      const x = ctx.x(rect.left);
      const y = ctx.height - ctx.y(rect.top + rect.height * baseline);
      ctx.page.drawText(transform(node.data.slice(start, end)), {
        x,
        y,
        size,
        font,
        color: paint.color,
        opacity: paint.alpha * opacity,
      });
      if (underline) {
        ctx.page.drawLine({
          start: { x, y: y - size * 0.12 },
          end: { x: ctx.x(rect.right), y: y - size * 0.12 },
          thickness: size * 0.05,
          color: paint.color,
          opacity: paint.alpha * opacity,
        });
      }
    };

    for (const match of node.data.matchAll(/\S+/g)) draw(match.index, match.index + match[0].length);
  }

  async function drawSvg(ctx: PageContext, svg: SVGSVGElement, opacity: number) {
    const rect = svg.getBoundingClientRect();
    const originX = ctx.x(rect.left);
    const originY = ctx.y(rect.top);
    const shapes = svg.querySelectorAll<SVGGraphicsElement>(
      'path, line, rect, circle, ellipse, polyline, polygon, text',
    );

    for (const shape of shapes) {
      if (shape.closest('defs, clipPath, mask, pattern, symbol, marker')) continue;
      const style = getComputedStyle(shape);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      const m = shape.getCTM();
      if (!m) continue;

      let alpha = opacity;
      for (let el: Element | null = shape; el && el !== svg; el = el.parentElement) {
        alpha *= Number(getComputedStyle(el).opacity);
      }
      const fill = parsePaint(style.fill);
      const stroke = parsePaint(style.stroke);
      const strokeWidth = parseFloat(style.strokeWidth) || 0;

      // Ma trận từ tọa độ SVG sang PDF, bù phép lật trục y của drawSvgPath.
      const matrix = concatTransformationMatrix(
        PT_PER_PX * m.a,
        -PT_PER_PX * m.b,
        -PT_PER_PX * m.c,
        PT_PER_PX * m.d,
        originX + PT_PER_PX * m.e,
        ctx.height - originY - PT_PER_PX * m.f,
      );

      if (shape instanceof SVGTextElement) {
        const text = shape.textContent?.trim().normalize('NFC');
        if (!text || !fill) continue;
        const font = await loadFont(
          findPdfFont(style.fontFamily, Number(style.fontWeight), style.fontStyle !== 'normal'),
        );
        const start = shape.getStartPositionOfChar(0);
        ctx.page.pushOperators(pushGraphicsState(), matrix);
        ctx.page.drawText(text, {
          x: start.x,
          y: -start.y,
          size: parseFloat(style.fontSize),
          font,
          color: fill.color,
          opacity: fill.alpha * alpha * Number(style.fillOpacity),
        });
        ctx.page.pushOperators(popGraphicsState());
        continue;
      }

      const d = pathOf(shape);
      const hasStroke = stroke !== null && strokeWidth > 0;
      const hasFill = fill !== null && !(shape instanceof SVGLineElement);
      if (!d || (!hasFill && !hasStroke)) continue;
      const dash = style.strokeDasharray;
      ctx.page.pushOperators(pushGraphicsState(), matrix);
      // drawSvgPath không đặt kiểu góc nên đặt trước, trong cùng trạng thái đồ họa.
      if (hasStroke && style.strokeLinejoin === 'round') {
        ctx.page.pushOperators(setLineJoin(LineJoinStyle.Round));
      }
      ctx.page.drawSvgPath(d, {
        x: 0,
        y: 0,
        color: hasFill ? fill.color : undefined,
        opacity: hasFill ? fill.alpha * alpha * Number(style.fillOpacity) : undefined,
        borderColor: hasStroke ? stroke.color : undefined,
        borderOpacity: hasStroke ? stroke.alpha * alpha * Number(style.strokeOpacity) : undefined,
        borderWidth: hasStroke ? strokeWidth : 0,
        borderDashArray: dash && dash !== 'none' ? dash.split(/[\s,]+/).map(parseFloat) : undefined,
        borderLineCap:
          style.strokeLinecap === 'round'
            ? LineCapStyle.Round
            : style.strokeLinecap === 'square'
              ? LineCapStyle.Projecting
              : LineCapStyle.Butt,
      });
      ctx.page.pushOperators(popGraphicsState());
    }
  }

  async function drawImage(ctx: PageContext, img: HTMLImageElement, opacity: number) {
    await img.decode();
    let embedded = images.get(img.currentSrc);
    if (!embedded) {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width * 4;
      canvas.height = img.naturalHeight || img.height * 4;
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      embedded = doc.embedPng(canvas.toDataURL('image/png'));
      images.set(img.currentSrc, embedded);
    }
    const image = await embedded;
    const rect = img.getBoundingClientRect();
    const width = ctx.x(rect.right) - ctx.x(rect.left);
    const height = ctx.y(rect.bottom) - ctx.y(rect.top);
    // object-fit: contain giữ tỉ lệ ảnh và canh giữa trong khung.
    const fit =
      getComputedStyle(img).objectFit === 'contain'
        ? Math.min(width / image.width, height / image.height)
        : null;
    const drawn = fit ? { width: image.width * fit, height: image.height * fit } : { width, height };
    ctx.page.drawImage(image, {
      x: ctx.x(rect.left) + (width - drawn.width) / 2,
      y: ctx.height - ctx.y(rect.bottom) + (height - drawn.height) / 2,
      ...drawn,
      opacity,
    });
  }

  async function walk(ctx: PageContext, el: Element, inherited: number) {
    const style = getComputedStyle(el);
    if (style.display === 'none') return;
    const opacity = inherited * Number(style.opacity);
    const visible = style.visibility === 'visible';

    if (el instanceof SVGSVGElement) {
      if (visible) await drawSvg(ctx, el, opacity);
      return;
    }
    if (visible) drawBox(ctx, el, style, opacity);
    if (el instanceof HTMLImageElement) {
      if (visible) await drawImage(ctx, el, opacity);
      return;
    }
    for (const child of el.childNodes) {
      if (child instanceof Element) await walk(ctx, child, opacity);
      else if (child instanceof Text && visible) await drawText(ctx, child, style, opacity);
    }
  }

  for (const element of pages) {
    const width = Number(element.dataset.width) * PT_PER_MM;
    const height = Number(element.dataset.height) * PT_PER_MM;
    const rect = element.getBoundingClientRect();
    if (rect.width === 0) throw new Error('Trang xem trước đang bị ẩn');
    const scale = width / rect.width;
    const ctx: PageContext = {
      page: doc.addPage([width, height]),
      height,
      x: (screenX) => (screenX - rect.left) * scale,
      y: (screenY) => (screenY - rect.top) * scale,
    };
    for (const child of element.childNodes) {
      if (child instanceof Element) await walk(ctx, child, 1);
      else if (child instanceof Text)
        await drawText(ctx, child, getComputedStyle(element), 1);
    }
  }

  return doc.save();
}

function pathOf(shape: SVGGraphicsElement): string {
  if (shape instanceof SVGPathElement) return shape.getAttribute('d') ?? '';
  if (shape instanceof SVGLineElement) {
    const { x1, y1, x2, y2 } = shape;
    return `M${x1.baseVal.value} ${y1.baseVal.value}L${x2.baseVal.value} ${y2.baseVal.value}`;
  }
  if (shape instanceof SVGRectElement) {
    const x = shape.x.baseVal.value;
    const y = shape.y.baseVal.value;
    const w = shape.width.baseVal.value;
    const h = shape.height.baseVal.value;
    const r = Math.min(shape.rx.baseVal.value || shape.ry.baseVal.value, w / 2, h / 2);
    if (!r) return `M${x} ${y}H${x + w}V${y + h}H${x}Z`;
    return (
      `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}` +
      `A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}` +
      `V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`
    );
  }
  if (shape instanceof SVGCircleElement || shape instanceof SVGEllipseElement) {
    const cx = shape.cx.baseVal.value;
    const cy = shape.cy.baseVal.value;
    const rx = shape instanceof SVGCircleElement ? shape.r.baseVal.value : shape.rx.baseVal.value;
    const ry = shape instanceof SVGCircleElement ? rx : shape.ry.baseVal.value;
    return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 0 ${cx + rx} ${cy}A${rx} ${ry} 0 1 0 ${cx - rx} ${cy}Z`;
  }
  const points = shape.getAttribute('points')?.trim().split(/[\s,]+/) ?? [];
  if (points.length < 4) return '';
  const pairs: string[] = [];
  for (let i = 0; i + 1 < points.length; i += 2) pairs.push(`${points[i]} ${points[i + 1]}`);
  return `M${pairs.join('L')}${shape instanceof SVGPolygonElement ? 'Z' : ''}`;
}

export async function exportPdf(root: ParentNode, fileName: string, title?: string) {
  const bytes = await buildPdf(root, { title });
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName}.pdf`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
