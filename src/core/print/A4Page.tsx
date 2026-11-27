import { useContext, type ReactNode } from 'react';
import { DEFAULT_MARGIN_MM } from './paper';
import { PageContext } from './PrintSheet';

/**
 * Một trang in đúng kích thước thật (mặc định A4, đổi khổ ở `PrintSheet`). Xem trước, bản in và PDF cùng dùng DOM này.
 * Nội dung tràn bị cắt: dùng `paginate()` để chia trang trước.
 */
export function A4Page({
  children,
  margin = DEFAULT_MARGIN_MM,
  large = false,
  plain = false,
}: {
  children?: ReactNode;
  /** Lề (mm). */
  margin?: number;
  /** Chữ to cho lớp 1. */
  large?: boolean;
  /** Bỏ qua font giáo viên chọn. */
  plain?: boolean;
}) {
  const { width, height } = useContext(PageContext);
  return (
    <div
      className="a4-page"
      data-a4-page
      data-width={width}
      data-height={height}
      data-large={large || undefined}
      data-plain={plain || undefined}
      style={{ width: `${width}mm`, height: `${height}mm`, padding: `${margin}mm` }}
    >
      {children}
    </div>
  );
}
