import { createContext, type CSSProperties, type ReactNode } from 'react';
import { getPrintFont, PRINT_FONT_FACE_CSS, type PrintFontId } from './fonts';
import { A4, A4_PAGE, orientPage, type Orientation, type PageSize } from './paper';

/** Kích thước trang (mm) đã tính theo hướng giấy. */
export const PageContext = createContext<{ width: number; height: number }>(A4.portrait);

/** Bọc các trang in: đặt khổ giấy @page, font và kích thước cho từng trang. */
export function PrintSheet({
  orientation = 'portrait',
  paper = A4_PAGE,
  font = 'be-vietnam-pro',
  children,
}: {
  orientation?: Orientation;
  paper?: PageSize;
  font?: PrintFontId;
  children: ReactNode;
}) {
  const { family, leading = 1 } = getPrintFont(font);
  const style = { '--print-font': `'${family}'`, '--print-leading': leading } as CSSProperties;
  const { width, height } = orientPage(paper, orientation);
  return (
    <PageContext.Provider value={{ width, height }}>
      {/* Ghi thẳng CSS để HTML dựng sẵn không mã hoá dấu nháy. */}
      <style dangerouslySetInnerHTML={{ __html: PRINT_FONT_FACE_CSS }} />
      <style>{`@page { size: ${width}mm ${height}mm; margin: 0; }`}</style>
      <div className="print-sheet" style={style}>
        {children}
      </div>
    </PageContext.Provider>
  );
}
