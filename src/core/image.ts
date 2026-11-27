/** Xử lý ảnh giáo viên chọn (logo), hoàn toàn trên máy. */

const toCanvas = (width: number, height: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
};

export const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Không đọc được ảnh'));
    image.src = src;
  });

/** Đọc file ảnh thành PNG data URL, thu nhỏ để cạnh dài không quá `maxSize` px. */
export async function readImageFile(file: File, maxSize = 600): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const image = await loadImage(url);
    // SVG không khai kích thước thì lấy khung vuông.
    const width = image.naturalWidth || maxSize;
    const height = image.naturalHeight || maxSize;
    const scale = Math.min(1, maxSize / Math.max(width, height));
    const canvas = toCanvas(width * scale, height * scale);
    canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type RotatedImage = {
  url: string;
  /** Kích thước khung bao so với bề rộng ảnh gốc. */
  widthRatio: number;
  heightRatio: number;
};

/** Xoay sẵn trên canvas để bản in và PDF không phải dùng CSS transform. */
export async function rotateImage(src: string, degrees: number): Promise<RotatedImage> {
  const image = await loadImage(src);
  const { naturalWidth: w, naturalHeight: h } = image;
  const radians = (degrees * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const canvas = toCanvas(w * cos + h * sin, w * sin + h * cos);
  const ctx = canvas.getContext('2d')!;
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(radians);
  ctx.drawImage(image, -w / 2, -h / 2);
  return {
    url: canvas.toDataURL('image/png'),
    widthRatio: canvas.width / w,
    heightRatio: canvas.height / w,
  };
}
