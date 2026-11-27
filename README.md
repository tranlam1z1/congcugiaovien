# Kho Công Cụ Giáo Viên

Công cụ in A4 và trình chiếu cho giáo viên, chạy hoàn toàn trên trình duyệt. Đặc tả: [PRD.md](PRD.md).

## Lệnh

Cần Node.js 22 trở lên. Trên Windows PowerShell chặn script thì dùng `npm.cmd` thay `npm`.

| Lệnh | Việc làm |
| --- | --- |
| `npm install` | Cài thư viện |
| `npm run dev` | Chạy khi phát triển, http://localhost:5173 |
| `npm run build` | Kiểm kiểu, build, dựng sẵn HTML vào `dist/` |
| `npm run preview` | Xem bản build |
| `npm test` | Unit test |
| `npm run test:e2e` | Test trên Chrome đã cài (chạy `npm run build` trước) |

Đặt biến `SITE_URL=https://ten-mien` khi build để có `sitemap.xml` và thẻ canonical.

Trang thử khung in (chỉ có khi `npm run dev`): http://localhost:5173/_khung-thu

## Thêm một công cụ

Mỗi công cụ là một thư mục `src/tools/<slug>/`. Cả 60 công cụ đã có `meta.ts`; thêm `index.tsx`
là công cụ chạy được và nhãn "Sắp có" tự mất. Không phải sửa trang chủ, menu hay router.

```
src/tools/phieu-toan/
  meta.ts        # đã có: tên, nhóm, lớp, môn, từ khóa, giai đoạn, mức truy cập, hướng dẫn, FAQ
  index.tsx      # export default function Tool({ tool }) { return <ToolLayout tool={tool} ... /> }
  generator.ts   # logic sinh đề thuần, dùng createRng(seed), có unit test
```

[src/tools/phieu-toan/](src/tools/phieu-toan/) là công cụ mẫu chuẩn, công cụ in mới làm theo:

| File | Việc |
| --- | --- |
| `meta.ts` | Thông tin, hướng dẫn, FAQ |
| `generator.ts` + `generator.test.ts` | Logic sinh đề thuần theo seed, ép tùy chọn đã lưu về hợp lệ, test quy tắc trên hàng nghìn cấu hình |
| `layout.ts` + `layout.test.ts` | Chiều cao hàng cố định (mm), số cột tối đa, chia trang |
| `Pages.tsx`, `QuestionItem.tsx` | Trang bài tập và trang đáp án |
| `Options.tsx`, `index.tsx` | Nhóm tùy chọn và ghép vào `ToolLayout` |
| `e2e/phieu-toan.spec.ts` | Không tràn cột, tràn trang; PDF mọi font; in đúng số trang |

Phần dùng chung:

- `ToolLayout`: nhóm tùy chọn, "Đổi bộ khác" (`seed`), "Kèm đáp án", "Về mặc định", In, PDF, toàn màn hình.
- `useToolOptions(slug, DEFAULTS)`: nhớ tùy chọn. `COMMON_DEFAULTS`, `sheetNames()`, `HeaderFields`,
  `FontFields`, `SheetCountFields` cho tùy chọn chung (PRD 4.0).
- `A4Page`, `SheetHeader`, `AnswerKeyPage`, `paginate()`, `packByHeight()`: dựng trang. Nội dung tràn
  trang bị cắt, công cụ phải tự chia trang.

- `AnswerPages` cho trang đáp án dạng chữ, `AnswerGrids` cho đáp án dạng hình (4 phiếu/trang);
  `splitSyllable()` tách âm đầu và vần.
- `ToolLayout paper={...}` cho khổ khác A4; `useClassStore()` và `ClassListPanel` cho danh sách
  lớp dùng chung (IndexedDB); `ImageField` cho logo; `usePresenting()` cho phím khi trình chiếu.

Công cụ tập viết dùng chung [src/core/handwriting/](src/core/handwriting/): dựng chữ nối nét từ font
(`cursive.ts`, `useHandwriting()`), ngắt dòng và giới hạn trang (`lines.ts`), màu và cỡ nét
(`style.ts`). Chữ in tiếng Anh trên giấy 4 dòng tự vẽ ở
[printFont.ts](src/tools/tap-viet-tieng-anh/printFont.ts).

Công cụ không in (vd `tinh-diem-xep-loai`) đặt `mode: 'screen'` và tự dựng giao diện, không dùng
`ToolLayout`.

[PrintDemo.tsx](src/app/dev/PrintDemo.tsx) thử thêm A4 ngang, SVG theo mm và toàn màn hình.

## In và PDF

Xem trước, bản in và PDF cùng đọc từ một DOM. "In ngay" dùng `window.print()`. "Tải PDF" vẽ lại
DOM bằng pdf-lib: chữ vector, nhúng font đang chọn.

Trong trang A4 chỉ dùng những thứ PDF vẽ được: chữ, màu nền, viền, `<img>`, SVG cơ bản.
Chưa hỗ trợ `::before`/`::after`, dấu đầu dòng, ô nhập, gradient, đổ bóng, CSS transform,
`<use>`, clip-path (xem đầu file [exportPdf.ts](src/core/export/exportPdf.ts)).

Font chọn được khai báo ở [fonts.ts](src/core/print/fonts.ts): thêm file TTF đầy đủ dấu và độ rộng
chữ số, xem trước và PDF tự dùng được. Ký tự font không có (ví dụ một số ký hiệu hình) sẽ mất
trong PDF: vẽ bằng viền hoặc SVG.

## Chưa làm

49 công cụ còn lại (đã xong `phieu-toan`, `phieu-tieng-viet`, `tinh-diem-xep-loai`, `giay-o-ly`,
`chia-nhom`, `tao-ma-qr`, `o-chu-tim-tu`, `to-mau-theo-phep-tinh`, `cong-cu-tren-lop`,
`tap-viet-chu`, `tap-viet-tieng-anh`), tài khoản và quản trị (PRD mục 6–7), PWA offline, font
tập viết HP001 (`tap-viet-chu` đang dùng Playwrite VN, đổi ở
[cursive.ts](src/core/handwriting/cursive.ts)), xuất Word. Email liên hệ để trống trong
[src/core/site.ts](src/core/site.ts) nên form Góp ý chưa bật.
