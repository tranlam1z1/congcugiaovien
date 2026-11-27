# PRD – Nền tảng công cụ học liệu cho giáo viên

Nov 26, 2026 · @Trần Lâm

## 1. Tổng quan

Xây một web gồm khoảng 60 công cụ in ấn và tương tác cho giáo viên Việt Nam, tương đương chức năng của [hoclieu.app](https://hoclieu.app/), dùng thương hiệu và giao diện riêng. Khách dùng thử 10 công cụ không cần đăng nhập; giáo viên tạo tài khoản để mở thêm công cụ theo gói Free, Pro hoặc Trường. Mọi xử lý vẫn chạy trên máy người dùng.

**Tên tạm:** "Kho Công Cụ Giáo Viên" (chốt tên và tên miền sau). Không dùng lại tên, logo, nội dung chữ hay hình ảnh của hoclieu.app; chỉ tham khảo danh sách chức năng.

### Mục tiêu

- Giáo viên tạo được phiếu, đề, giấy, thẻ in A4 đẹp trong dưới 1 phút, không cần cài phần mềm.
- Có công cụ trình chiếu và quản lý lớp dùng ngay trên máy chiếu hoặc tivi.
- Không thu thập dữ liệu học sinh: tên học sinh và file không rời khỏi trình duyệt; tài khoản chỉ lưu email, gói và nội dung giáo viên tự lưu.
- Có nguồn thu để duy trì web từ gói Pro và gói Trường.

### Đối tượng

| Nhóm | Nhu cầu chính |
| --- | --- |
| Giáo viên tiểu học (lớp 1–5) | Phiếu toán, tiếng Việt, tập viết, trò chơi, quản lý lớp |
| Giáo viên tiếng Anh | Tập viết tiếng Anh, flashcard, ô chữ, quiz |
| Giáo viên THCS/THPT | Trộn đề trắc nghiệm, ma trận đề, phiếu trả lời, công cụ PDF |
| Phụ huynh | Phiếu cuối tuần, ôn hè, tô màu, tập tô |
| Tổ trưởng chuyên môn, trung tâm | Lịch năm học, thời khóa biểu, điểm danh, thu nộp |

### Nguyên tắc sản phẩm

1. **Chạy hoàn toàn trên trình duyệt (client-side):** công cụ xử lý trên máy; tài khoản chỉ dùng để mở quyền theo gói, dữ liệu học sinh không gửi lên server; dữ liệu nhập lưu ở localStorage/IndexedDB của máy.
2. **In là sản phẩm chính:** mỗi công cụ in ra đúng khổ A4 (dọc/ngang), canh lề chuẩn, có nút In và Tải PDF.
3. **Sinh ngẫu nhiên có kiểm soát:** mỗi lần bấm "Tạo lại" ra bộ đề mới, kèm đáp án ở trang riêng; có mã seed để tạo lại đúng bộ cũ.
4. **Bám chương trình GDPT 2018** và các văn bản đánh giá: Thông tư 27/2020 (tiểu học), Thông tư 22/2021 (THCS/THPT).
5. **Tiếng Việt chuẩn:** font hỗ trợ đầy đủ dấu, có font chữ viết tay tiểu học cho tập viết.

### Ngoài phạm vi

- Đồng bộ danh sách lớp, điểm danh, nhận xét học sinh lên đám mây; ứng dụng di động riêng.
- Nội dung sách giáo khoa có bản quyền (không chép bài trong SGK; chỉ sinh bài theo dạng).

## 2. Kiến trúc kỹ thuật

Phần công khai là web tĩnh (SPA + prerender) chạy hoàn toàn trên trình duyệt, tài khoản, thanh toán và khu quản trị dùng chung một backend nhẹ (mục 6, 7); mỗi công cụ là một module đăng ký vào một registry chung, nên thêm công cụ mới không phải sửa trang chủ hay menu.

### Công nghệ

| Lớp | Lựa chọn | Ghi chú |
| --- | --- | --- |
| Khung | Vite + React 18 + TypeScript | Code-splitting theo từng công cụ (React.lazy) |
| Định tuyến | React Router, URL tiếng Việt không dấu (/phieu-toan, /lop-1) | Prerender tĩnh để SEO (vite-plugin-ssg hoặc react-snap) |
| Giao diện | Tailwind CSS + bộ component riêng | Font: Be Vietnam Pro (UI), font viết tay tiểu học tự host |
| Trạng thái | Zustand hoặc useState + hook useLocalState | Lưu tùy chọn mỗi công cụ vào localStorage |
| Dữ liệu lớn | IndexedDB (idb-keyval) | Danh sách học sinh, điểm danh, thu nộp |
| In / PDF | CSS @page A4 + window.print(); xuất PDF bằng pdf-lib hoặc html2canvas + jsPDF | In là đường chính, PDF là phụ |
| PDF utilities | pdf-lib (ghép, tách, xoay, watermark, đánh số), pdfjs-dist (PDF sang ảnh) | Chạy trong Web Worker |
| Đọc/ghi file | SheetJS (Excel danh sách HS), docx (xuất Word cho nhận xét, đề) | Nhập danh sách từ Excel hoặc dán từ clipboard |
| QR | qrcode | Xuất PNG/SVG |
| Xử lý ảnh | Canvas API (ảnh thành tranh tô màu: grayscale + edge detection) | Chạy trong Web Worker |
| Kiểm thử | Vitest (bộ sinh đề, đáp án), Playwright (in, điều hướng) |  |
| Triển khai | Cloudflare Pages / Vercel / Netlify, PWA dùng offline | Không cần server |

### Cấu trúc thư mục

```
src/
  app/            # router, layout, trang chủ, trang lớp, giới thiệu
  core/
    registry.ts   # danh sách công cụ (metadata)
    rng.ts        # sinh số ngẫu nhiên có seed (mulberry32)
    print/        # A4Page, PrintSheet, AnswerKeyPage, @page CSS
    export/       # exportPdf, exportPng, exportDocx
    storage/      # useLocalState, IndexedDB helpers
    vi/           # dữ liệu tiếng Việt: âm, vần, thanh, từ theo chủ đề
  components/     # ToolLayout, OptionPanel, NumberField, StudentListInput...
  tools/
    phieu-toan/
      index.tsx   # UI công cụ
      generator.ts# logic sinh đề thuần (test được)
      meta.ts     # slug, tên, nhóm, lớp, môn, từ khóa
    ...           # mỗi công cụ một thư mục
public/fonts, public/clipart (hình minh họa tự vẽ hoặc giấy phép mở)
```

### Metadata mỗi công cụ (registry)

```ts
type ToolMeta = {
  slug: string;            // 'phieu-toan'
  name: string;            // 'Phiếu toán tự động'
  group: ToolGroup;        // 1 trong 8 nhóm
  grades: Grade[];         // [1,2,3] | ['thcs-thpt']
  subjects: Subject[];     // 'toan' | 'tieng-viet' | 'tieng-anh' | 'am-nhac' | 'chung'
  mode: 'print' | 'present' | 'both';
  keywords: string[];      // phục vụ tìm kiếm không dấu
  isNew?: boolean;
  phase: 1 | 2 | 3 | 4;
};
```

### Khung chung mỗi công cụ (ToolLayout)

- **Trái:** bảng tùy chọn (lớp, dạng bài, số câu, cỡ chữ, tiêu đề, tên trường/lớp, dòng "Họ tên: ......").
- **Phải:** xem trước trang A4 thật, thu phóng, lật nhiều trang.
- **Thanh hành động:** Tạo lại · In · Tải PDF · (tuỳ công cụ) Tải PNG/Word · Kèm đáp án · Toàn màn hình (công cụ trình chiếu).
- Trên điện thoại: bảng tùy chọn thành ngăn kéo dưới, xem trước chiếm toàn màn.

## 3. Trang chủ và điều hướng

Người dùng tìm công cụ theo ba cách: gõ tìm kiếm, lọc theo nhóm, hoặc vào trang theo lớp.

### Các trang

| Đường dẫn | Nội dung |
| --- | --- |
| `/` | Hero ngắn ("Dùng thử không cần đăng nhập · Chạy trên máy bạn"), ô tìm kiếm, lối tắt Lớp 1–5 và THCS/THPT, mục "Mới", lưới toàn bộ công cụ (`#cong-cu`) có chip lọc 8 nhóm |
| `/#nhom=<tên nhóm>` | Trạng thái lọc nhóm nằm trên URL, chia sẻ được |
| `/lop-1` … `/lop-5` | Công cụ phù hợp lớp đó, xếp theo môn (Toán, Tiếng Việt, Tiếng Anh, Âm nhạc, Chung) |
| `/thcs-thpt` | Công cụ cho cấp 2–3: đề, ma trận, tính điểm TT22, quản lý lớp, PDF |
| `/<slug-công-cụ>` | Trang công cụ (ToolLayout) + đoạn hướng dẫn ngắn + 3–4 công cụ liên quan |
| `/gioi-thieu` | Giới thiệu, câu hỏi thường gặp, mục Góp ý (`#gop-y`): form mở mailto hoặc Google Form |
| `/quyen-rieng-tu` | Cam kết không gửi dữ liệu lên server; analytics ẩn danh (nếu dùng) |

Thêm khu `/admin/*` cho quản trị viên: không hiện trên menu công khai, chặn index (noindex, robots.txt), chi tiết ở mục 6.

Thêm các trang tài khoản: `/dang-nhap` (Google hoặc mã qua email), `/bang-gia` (so sánh gói), `/tai-khoan` (gói hiện tại, ngày hết hạn, lịch sử thanh toán, nội dung đã lưu), `/thanh-toan` (mã QR và kết quả). Header có nút Đăng nhập, sau khi đăng nhập thành ảnh đại diện kèm nhãn gói. Thẻ công cụ người dùng chưa đủ quyền hiện nhãn Free hoặc Pro có ổ khoá; bấm vào vẫn xem trước được, khi bấm In hoặc Tải PDF thì mở hộp thoại đăng nhập hoặc nâng cấp (mục 7).

### Tìm kiếm

- Tìm tức thì, không phân biệt dấu và hoa thường ("phieu toan" tìm ra "Phiếu toán").
- Khớp theo tên, từ khóa, nhóm, lớp; gợi ý khi gõ và phím tắt `/` để mở ô tìm.
- Không có kết quả: hiện liên kết "Đề xuất công cụ mới" trỏ tới Góp ý.

### Thẻ công cụ trên lưới

Biểu tượng, tên, mô tả một dòng, nhãn lớp, nhãn "Mới", biểu tượng chế độ (In / Trình chiếu). Ghi nhớ "Dùng gần đây" (localStorage) và cho ghim công cụ yêu thích lên đầu trang chủ.

### Header và footer

- Header: logo, ô tìm, menu Lớp (dropdown), menu Nhóm công cụ, nút đổi giao diện sáng/tối.
- Footer: Giới thiệu, Góp ý, Quyền riêng tư, email liên hệ.

### Bố cục giao diện (khung dây)

Mỗi màn hình chỉ có một việc chính: trang chủ để tìm công cụ, trang công cụ để chỉnh rồi in. Hai khung dây dưới đây là bố cục chuẩn cho cả 60 công cụ.

&#91;embedded content: khung dây trang chủ · máy tính\]

Trang chủ đi từ trên xuống theo thứ tự người dùng cần: ô tìm kiếm, lối tắt theo lớp, công cụ mới, rồi lưới có lọc nhóm.

&#91;embedded content: khung dây trang công cụ · máy tính\]

Mọi trang công cụ dùng chung một khung này (`ToolLayout`), chỉ khác phần tùy chọn bên trái.

### Quy tắc bố cục

- **Bề rộng:** nội dung tối đa 1200 px, căn giữa. Lưới công cụ 4 cột trên máy tính, 2 cột trên máy tính bảng, 1 cột trên điện thoại.
- **Một nút nổi bật mỗi màn hình:** ô tìm kiếm ở trang chủ, nút In ngay ở trang công cụ. Các nút còn lại để dạng viền, không tô màu.
- **Trang công cụ:** cột tùy chọn rộng cố định 320 px (khoảng một phần ba), phần còn lại là bản xem trước. Nhóm tùy chọn gấp mở được, mở sẵn hai nhóm đầu, luôn có nút Về mặc định ở cuối cột.
- **Điện thoại:** bản xem trước nằm trên cùng, tùy chọn thành ngăn kéo "Tùy chọn" từ dưới lên, thanh Đổi bộ khác, Tải PDF, In ngay dính ở đáy màn hình.
- **Công cụ trình chiếu** (vòng quay, đếm ngược, trò chơi): bấm Toàn màn hình thì ẩn header và cột tùy chọn, chữ tối thiểu 48 px, nút lớn bấm được từ xa.
- **Dễ đọc:** chữ giao diện tối thiểu 16 px, vùng bấm tối thiểu 44 px, nền sáng một tông kem, một màu nhấn duy nhất, đúng chữ tiếng Việt có dấu ở mọi cỡ.
- **Nhất quán:** cùng một việc thì cùng một tên nút ở mọi công cụ (Đổi bộ khác, Tải PDF, In ngay, Về mặc định), cùng một vị trí.

## 4. Đặc tả công cụ

Có 60 công cụ chia 8 nhóm. Cột "GĐ" là giai đoạn làm (xem mục 8); mức truy cập theo gói ở mục 7. Mọi công cụ in ấn đều có bộ tùy chọn chung dưới đây; bảng từng nhóm chỉ ghi phần riêng.

### 4.0 Tùy chọn chung (component dùng lại)

- **Tiêu đề phiếu:** bỏ trống thì dùng tiêu đề mặc định của công cụ.
- **Dòng "Họ và tên / Lớp":** bật/tắt.
- **Danh sách tên học sinh (tuỳ chọn, tối đa 60):** mỗi em một phiếu có tên in sẵn.
- **Số phiếu/đề khác nhau:** mỗi bản một trang, nội dung khác nhau.
- **Kèm trang đáp án cho thầy cô:** bật/tắt, in ở cuối.
- **Font chữ:** bộ font mở (Andika, Mali, Playpen Sans, Quicksand, Itim, Patrick Hand, Pangolin, Playwrite VN) + font tập viết tiểu học HP001 (nét thanh) và HP001 Đậm, mặc định cho các công cụ tập viết; Playwrite VN làm font dự phòng.
- **Chữ to cho lớp 1.**
- **Nút:** Đổi bộ khác (sinh lại, giữ tùy chọn) · Về mặc định · Tải PDF · In ngay.
- **Xem trước trực tiếp** + bộ đếm "N trang A4".
- **Quy tắc toán:** phép trừ không ra số âm, phép chia luôn chia hết, không trùng câu trong một phiếu.

### 4.1 Phiếu bài tập (15 công cụ)

| Slug | Công cụ | Chức năng và tùy chọn riêng | GĐ |
| --- | --- | --- | --- |
| phieu-toan | Phiếu toán tự sinh (lớp 1–3) | Chọn nhanh theo lớp (cộng trừ phạm vi 10, 20, 100; bảng nhân chia 2–5, 6–9; so sánh trong 20). Phép tính + − × :. Phạm vi 10/20/50/100/1000. Dạng: tính ngang, đặt tính dọc, điền số vào ô trống, so sánh >, <, =. Số câu, số cột. Bắt buộc chọn ít nhất 1 phép tính | 1 |
| phieu-toan-lop-4-5 | Phiếu toán lớp 4–5 | Số nhiều chữ số, nhân chia số có 2–3 chữ số, phân số (rút gọn, quy đồng, cộng trừ nhân chia), số thập phân, tìm x, tính nhanh, đổi đơn vị đo | 2 |
| phieu-so-lop-1-3 | Phiếu số lớp 1–3 | Đếm hình viết số, số liền trước/liền sau, tách số (chục, đơn vị), đọc viết số, sắp xếp tăng/giảm, tia số | 2 |
| toan-loi-van-lop-1-3 | Toán lời văn lớp 1–3 | Mẫu đề có biến (tên, đồ vật, số); dạng thêm bớt, nhiều hơn/ít hơn, gấp/giảm một số lần, chia đều; khung "Bài giải / Phép tính / Đáp số" | 2 |
| phieu-dong-ho-tien | Đồng hồ và tiền Việt Nam | **Đồng hồ:** mức giờ đúng / giờ rưỡi / 15 phút / 5 phút; kiểu đọc giờ, vẽ kim, trộn; 6 hoặc 12 đồng hồ/trang. **Tiền:** chọn mệnh giá, tính tổng, tính tiền thừa. Hình tiền tự vẽ giản lược, không mô phỏng tiền thật | 2 |
| phieu-tieng-viet | Phiếu tiếng Việt lớp 1 | Danh sách từ (mỗi dòng một từ, có mẫu). Dạng: điền âm/vần (ẩn âm đầu, vần, hoặc cả hai — cần bộ tách âm tiết tiếng Việt), nối từ, sắp xếp câu. 2 hoặc 3 cột, nút Trộn lại | 1 |
| phieu-luyen-tu-va-cau | Luyện từ và câu | Tìm từ chỉ sự vật/hoạt động/đặc điểm, điền dấu câu, đặt câu theo mẫu (Ai là gì? Ai làm gì? Ai thế nào?), từ trái nghĩa/đồng nghĩa; nhập danh sách từ theo chủ đề | 3 |
| phieu-ghep-hinh-cau | Ghép hình thành câu | Câu được cắt thành mảnh (theo từ), in thành thẻ để cắt rời; học sinh ghép lại; có bản đáp án | 3 |
| phieu-bai-tap-cuoi-tuan-lop-1-2 | Phiếu cuối tuần lớp 1–2 | Chọn tuần 1–35; mỗi phiếu 2 trang gồm Toán + Tiếng Việt theo mức độ tuần đó (ngân hàng dạng bài theo tuần, không chép SGK) | 3 |
| phieu-bai-tap-cuoi-tuan-lop-3-4 | Phiếu cuối tuần lớp 3–4 | Như trên, nội dung lớp 3–4, thêm phần viết đoạn ngắn theo gợi ý | 3 |
| bai-tap-on-tet-on-he | Ôn Tết, ôn hè | Chọn lớp + số ngày (vd 30 ngày hè); mỗi ngày một trang trộn toán, tiếng Việt, trò chơi nhỏ; trang bìa + bảng theo dõi ngày | 3 |
| phieu-hoc-tap-khung-trong | Phiếu học tập khung trống | Sơ đồ tư duy, sơ đồ Venn, KWL, bảng so sánh, chuỗi sự kiện, 5W1H, phiếu đọc sách; sửa tiêu đề từng ô | 2 |
| hinh-khai-trien | Hình khai triển (cắt, gấp, dán) | Hình lập phương, hộp chữ nhật, hình trụ, hình nón, lăng trụ, chóp; kích thước theo cm; mép dán, nét gấp nét đứt; in đúng tỉ lệ | 4 |
| phieu-tiet-tau | Phiếu tiết tấu (Âm nhạc) | Sinh mẫu tiết tấu 2/4, 3/4, 4/4 từ nốt tròn, trắng, đen, móc đơn, lặng; dạng vỗ theo, điền nốt còn thiếu, đếm phách. Vẽ bằng SVG (hoặc VexFlow) | 4 |
| phieu-doc-ten-not | Đọc tên nốt | Nốt trên khuông khóa Sol (tuỳ chọn khóa Fa), phạm vi nốt, học sinh viết tên (Đô Rê Mi… hoặc C D E…) | 4 |

### 4.2 Đề và kiểm tra (4 công cụ)

| Slug | Công cụ | Chức năng và tùy chọn riêng | GĐ |
| --- | --- | --- | --- |
| tron-de-trac-nghiem | Trộn đề trắc nghiệm | Dán đề (hoặc chép từ Word): "Câu 1.", phương án A. B. C. D. mỗi dòng, đánh `*` trước đáp án đúng (nhiều đáp án đúng được). Báo số câu đọc được. Số mã đề, mã đầu tiên giữ nguyên thứ tự; đảo câu, đảo đáp án; phương án bắt đầu "Cả…", "Tất cả…", "Không có đáp án" luôn đứng cuối. Đầu đề: trường, tên bài, thời gian, cỡ chữ Vừa/Lớn. Bảng đáp án mọi mã (dạng "3-B,C"). Mở rộng: nhập file .docx, xuất Word | 2 |
| ma-tran-de-kiem-tra | Ma trận đề kiểm tra | Thông tin trường, môn, lớp, thời gian. Điểm mỗi câu theo mức Nhận biết / Thông hiểu / Vận dụng. Mỗi chủ đề: tên, yêu cầu cần đạt, số câu NB/TH/VD; thêm/bớt chủ đề. Tự tính tổng điểm, tổng câu, tỉ lệ từng mức; cảnh báo khi tổng khác 10. Xuất A4 ngang (PDF, Word) | 2 |
| phieu-tra-loi-trac-nghiem | Phiếu trả lời trắc nghiệm | Số câu (10–120), số phương án (A–D/E), ô tô tròn, ô mã đề và số báo danh; thêm phần Đúng/Sai và trả lời ngắn theo cấu trúc đề 2025; 1, 2 hoặc 4 phiếu/trang | 2 |
| tinh-diem-xep-loai | Tính điểm và gợi ý xếp loại (TT22) | Chế độ ĐTBmhk / ĐTBmcn. Bảng môn: điểm thường xuyên (cách nhau dấu cách, thập phân dấu phẩy), giữa kỳ, cuối kỳ; môn chấm điểm hoặc nhận xét (Đạt/Chưa đạt); thêm/bớt môn; nút Chép kết quả. Công thức và quy tắc xếp loại ở dưới. Ghi rõ "chỉ để tham khảo" | 1 |

Quy tắc tính (Thông tư 22/2021), làm tròn 1 chữ số thập phân:

```latex
\text{ĐTBmhk} = \frac{\sum \text{ĐĐGTX} + 2\cdot\text{ĐĐGgk} + 3\cdot\text{ĐĐGck}}{n_{TX} + 5}
\qquad
\text{ĐTBmcn} = \frac{\text{ĐTBmhk}_{I} + 2\cdot\text{ĐTBmhk}_{II}}{3}
```

- **Tốt:** môn nhận xét đều Đạt; môn chấm điểm đều ≥ 6,5 và ít nhất 6 môn ≥ 8,0.
- **Khá:** môn nhận xét đều Đạt; môn chấm điểm đều ≥ 5,0 và ít nhất 6 môn ≥ 6,5.
- **Đạt:** tối đa 1 môn nhận xét Chưa đạt; ít nhất 6 môn ≥ 5,0; không môn nào dưới 3,5.
- **Chưa đạt:** các trường hợp còn lại.

### 4.3 Trò chơi và ô chữ (9 công cụ)

| Slug | Công cụ | Chức năng và tùy chọn riêng | GĐ |
| --- | --- | --- | --- |
| tro-choi-on-tap | Trò chơi ôn tập trình chiếu | **Nhập câu hỏi:** cách nhau dòng trống; trắc nghiệm A–D (`*` trước đáp án hoặc dòng "Đáp án: B"); trả lời ngắn "Câu hỏi \| Đáp án"; đếm số câu; nút câu mẫu, xoá hết, lưu/mở file .txt. **Hộp quà bí mật:** tối đa 8 đội, điểm mỗi câu đúng, hộp bất ngờ cộng/trừ điểm, bảng điểm. **Rung chuông vàng:** đếm ngược (chỉnh được giây), lật đáp án, bấm tên HS sai để loại. Âm thanh bật/tắt, toàn màn hình, chữ lớn cho tivi | 1 |
| o-chu-tim-tu | Ô chữ và tìm từ | Hai loại: tìm từ ẩn, ô chữ có gợi ý ("từ \| gợi ý"). Kích thước lưới 6–20. Độ khó: dễ (ngang, dọc), vừa (+ chéo), khó (mọi hướng, kể cả ngược). Giữ dấu tiếng Việt trong ô; hiện danh sách từ cần tìm; font ô. Ghép cụm từ liền trong lưới; báo từ bị loại khi không xếp được | 1 |
| o-chu-tu-khoa-hang-doc | Ô chữ từ khóa hàng dọc | Nhập từ khóa + các hàng ngang (đáp án \| câu hỏi); tự căn để chữ của từ khóa thẳng cột. Hai chế độ: in phiếu và trình chiếu (bấm hàng để mở đáp án) | 2 |
| bingo | Bingo | Lưới 3×3, 4×4, 5×5; nội dung từ danh sách từ/số/phép tính; ô FREE ở giữa; số thẻ (mỗi thẻ xáo khác nhau); thẻ gọi cho giáo viên + chế độ gọi ngẫu nhiên trên màn hình | 2 |
| the-tro-choi-hoa-ong-dung-sai | Thẻ trò chơi Hoa – Ong – Đúng sai | In thẻ Đúng/Sai, A/B/C/D, thẻ hoa và ong để học sinh giơ lên trả lời; chọn màu, số bộ, kích thước | 3 |
| me-cung | Mê cung | Kích thước (5×5 đến 30×30), hình vuông/tròn; điểm vào/ra có hình minh họa; biến thể mê cung phép tính (đi theo ô có kết quả đúng); trang đáp án vẽ đường đi | 3 |
| sudoku | Sudoku | 4×4, 6×6, 9×9; độ khó 3 mức; dùng số hoặc hình (cho lớp nhỏ); 1, 2, 4 hoặc 6 bài/trang; bảo đảm nghiệm duy nhất | 3 |
| day-quy-luat | Dãy quy luật | Dãy số (cộng/trừ/nhân đều), dãy hình, màu, lặp AB, ABC, AAB; điền phần tử còn thiếu | 3 |
| ma-phuong-thap-so | Ma phương và tháp số | Ma phương 3×3; tháp số cộng 3–5 tầng (ô trên bằng tổng hai ô dưới); phạm vi số; số ô để trống | 3 |

### 4.4 Giấy và tập viết (5 công cụ)

Nhóm này cần in đúng kích thước thật (mm): vẽ bằng SVG theo đơn vị mm, và nhắc người dùng in tỉ lệ 100%, tắt "Fit to page".

| Slug | Công cụ | Chức năng và tùy chọn riêng | GĐ |
| --- | --- | --- | --- |
| tap-viet-chu | Tạo bài tập viết chữ | Mẫu có sẵn: chữ thường, chữ HOA, chữ số 0–9, dấu thanh, câu mẫu; ô nhập (mỗi dòng một mẫu, câu dài tự xuống dòng). Cỡ chữ thường 1 / 1,5 / 2 / 3 ô. Kiểu nét: tô mờ, nét chấm, viền rỗng; độ mờ (mặc định 65%); màu xám đen/xanh dương/đỏ/xanh lá; chữ mẫu đầu dòng đậm; lặp cho đầy dòng. Số dòng mỗi mẫu, dòng trống sau mẫu. Giấy ô ly / dòng kẻ / trắng; ô 4, 5, 6, 8 mm; đường chân và đường cao chữ | 1 |
| giay-o-ly | Giấy ô ly và hơn 40 loại giấy | Loại chính: ô ly, dòng kẻ ngang, chấm bi, trắng. Danh sách thêm: kẻ dọc, milimét, chia cột, khuông nhạc, tab guitar/ukulele, sơ đồ hợp âm, thư pháp nét nghiêng, Cornell, isometric, lục giác, Séyès, storyboard, pinyin, ô điền tự/mễ tự/cửu cung/hồi cung, genkō yōshi, tiếng Anh 3 và 4 dòng, kiểu Đức, Braille, đan len, nhật ký, ghi chép họp, kế hoạch dự án, to-do, phác thảo. Ô 3/4/5/6/8/10 mm; 6 màu nét; độ đậm (mặc định 45%); kẻ đậm mỗi 2/4/5/10 dòng. Khổ A3, A4, A5, B4, B5, Letter, Legal… hoặc tùy chỉnh 50–600 mm; dọc/ngang; số trang; lề đỏ bên trái; watermark chữ; logo (cỡ, độ đậm, xoay, vị trí). Mỗi loại giấy là một hàm vẽ riêng, thêm dần | 1 |
| tap-to-net-co-ban | Tập tô nét cơ bản | Nét thẳng, xiên, cong, sóng, răng cưa, vòng, xoắn ốc; nét đứt để tô; hình minh họa đầu và cuối nét (con ong đến bông hoa); độ dày và số dòng mỗi trang | 2 |
| giay-khuong-nhac | Giấy khuông nhạc trống | Số khuông/trang (6–12), khoảng cách, khóa Sol/Fa/kép in sẵn, ô tên bài | 3 |
| tap-viet-tieng-anh | Phiếu tập viết tiếng Anh | Giấy 4 dòng (đường giữa nét đứt); chữ cái a–z, A–Z, từ vựng, câu; kiểu print hoặc cursive; tô mờ, nét chấm; kèm hình minh họa từ vựng (tuỳ chọn); gói từ vựng theo chủ đề lớp 1–5 | 1 |

### 4.5 Quản lý lớp học (9 công cụ)

Dùng chung một **danh sách lớp** (nhập một lần, dán mỗi dòng một tên hoặc nhập từ Excel), lưu trên máy, có nhiều lớp và nút "Xoá dữ liệu trên máy này" cho máy dùng chung.

| Slug | Công cụ | Chức năng và tùy chọn riêng | GĐ |
| --- | --- | --- | --- |
| cong-cu-tren-lop | Công cụ trên lớp | **Vòng quay gọi tên:** ngẫu nhiên đều, mỗi em một lần cho tới khi "Gọi lại từ đầu", chữ lớn cho tivi. **Đếm ngược:** nhập phút, bắt đầu/tạm dừng, toàn màn hình, chuông hết giờ. **Đo tiếng ồn:** xin quyền micro, độ nhạy, đèn xanh/vàng/đỏ, không ghi âm. **Bốc thăm:** danh sách mục bất kỳ (số câu, thứ tự thuyết trình) | 1 |
| chia-nhom | Chia nhóm ngẫu nhiên | Theo số nhóm hoặc số em/nhóm; cân bằng nam/nữ (tuỳ chọn cột giới tính); cặp không ngồi cùng nhóm; đặt tên nhóm, nhóm trưởng ngẫu nhiên; hiển thị trình chiếu + in | 1 |
| so-do-cho-ngoi | Sơ đồ chỗ ngồi | Số dãy, số bàn mỗi dãy, số chỗ mỗi bàn; kéo thả đổi chỗ; xếp ngẫu nhiên hoặc theo thứ tự; vị trí bảng và bàn giáo viên; in A4 ngang, xem từ phía học sinh hoặc giáo viên | 2 |
| thoi-khoa-bieu | Thời khóa biểu | Thứ 2–6 (tuỳ chọn thứ 7), số tiết sáng/chiều; gõ môn vào ô, tô màu theo môn; giờ vào tiết; mẫu in cho lớp và cho học sinh dán vở | 2 |
| nhan-xet-hoc-sinh | Nhận xét học sinh (TT27) | Xưng hô Em/Con/Tên bé. Trọng tâm Chung/Toán/Tiếng Việt (mở rộng: Tiếng Anh và các môn khác). Mỗi em: Học tập (Hoàn thành tốt / Hoàn thành / Chưa hoàn thành), Phẩm chất (Tốt / Đạt / Cần cố gắng). Mức mặc định cho cả lớp. Nhận xét ghép ngẫu nhiên từ kho câu mở đầu, thân, lời khuyên; sửa tay từng em. Viết lại (giữ mức), Chép tất cả, Tải CSV/Excel, In/PDF, Xoá hết. Ghi chú "bản nháp, cần rà soát" | 1 |
| diem-danh-thu-nop | Điểm danh và thu nộp | **Điểm danh tháng:** chọn tháng/năm, có học thứ Bảy, ngày nghỉ (tô xám). **Thu nộp:** tên các khoản cách nhau dấu phẩy, mỗi khoản kèm cột ký và ghi chú. Dòng trống dự phòng; tiêu đề, lớp, GVCN; A4 ngang; lặp dòng tiêu đề khi sang trang. Danh sách trống vẫn in được bảng trống | 2 |
| phan-cong-truc-nhat | Phân công trực nhật | Xoay vòng theo tổ/nhóm/cặp; theo tuần hoặc ngày; các việc (lau bảng, quét lớp, tưới cây…); xuất bảng dán tường cho cả tháng/học kỳ | 3 |
| lich-nam-hoc | Lịch năm học | Năm học (vd 2026–2027), ngày khai giảng, học kỳ, ngày lễ và nghỉ Tết (âm lịch quy đổi), đánh số tuần học 1–35; thêm sự kiện riêng; dạng 1 trang cả năm hoặc mỗi tháng 1 trang | 3 |
| thu-moi-phu-huynh | Thư mời họp phụ huynh | Mẫu thư (họp đầu năm, cuối kỳ, sự kiện); điền trường, lớp, thời gian, địa điểm, nội dung; trộn tên HS từ danh sách để in từng thư; phần giấy hồi đáp cắt rời; 1 hoặc 2 thư/trang | 3 |

### 4.6 Thẻ, bảng và khen thưởng (9 công cụ)

| Slug | Công cụ | Chức năng và tùy chọn riêng | GĐ |
| --- | --- | --- | --- |
| giay-khen | Giấy khen | 6–10 mẫu viền tự thiết kế; danh hiệu (Học sinh xuất sắc, Chăm ngoan, Tiến bộ…); trộn danh sách tên và thành tích để in hàng loạt; ngày, nơi ký, người ký; logo trường; A4 hoặc A5 ngang | 2 |
| bang-thi-dua | Bảng thi đua | Bảng dán tường theo tổ/cá nhân, cột tuần hoặc tiêu chí; chế độ trình chiếu bấm cộng/trừ sao, lưu trên máy; bảng xếp hạng | 2 |
| phieu-doi-qua | Phiếu đổi quà (vé thưởng) | Vé khen ("Em được chọn chỗ ngồi", "Miễn 1 bài tập"…), tự nhập nội dung; 8–12 vé/trang, đường cắt | 3 |
| bang-dan-tuong | Bảng dán tường | Poster chữ lớn: nội quy lớp, bảng chữ cái, bảng cửu chương, khẩu hiệu; tự nhập nội dung; ghép nhiều tờ A4 thành A3/A2 (tile) | 3 |
| nhan-vo-the-ten | Nhãn vở và thẻ tên | Nhãn vở (tên, lớp, trường, môn), thẻ tên để bàn; trộn danh sách tên; nhiều khung mẫu, 6–12 nhãn/trang | 2 |
| the-chu-the-tu | Thẻ chữ, thẻ từ | Thẻ chữ cái, âm, vần, dấu thanh, tiếng; nhập danh sách; cỡ thẻ; màu theo loại (nguyên âm/phụ âm) | 2 |
| the-tu-vung-hinh | Thẻ từ vựng có hình | Chọn hình từ thư viện clipart mở hoặc tải ảnh lên (xử lý trên máy); từ dưới hình; in hai mặt (hình/chữ) căn đúng mặt sau | 3 |
| the-tu-vung-tieng-anh | Flashcard tiếng Anh | Bộ chủ đề theo lớp 1–5 (colours, animals, family, school things…), tự thêm từ; mặt sau có phiên âm, nghĩa tiếng Việt; chế độ trình chiếu lật thẻ, phát âm bằng Web Speech API | 1 |
| bang-van-lop-1 | Bảng vần lớp 1 | Poster âm và vần tiếng Việt lớp 1 theo nhóm; chọn nhóm vần, cỡ chữ, màu; A4 hoặc ghép A3 | 3 |

### 4.7 Tô màu và vẽ (4 công cụ)

Tranh tô màu tự vẽ bằng SVG chia vùng (mỗi vùng một path có id) để gán số hoặc phép tính; không dùng nhân vật có bản quyền.

| Slug | Công cụ | Chức năng và tùy chọn riêng | GĐ |
| --- | --- | --- | --- |
| to-mau-theo-so | Tô màu theo số | Thư viện tranh; mỗi vùng một số, bảng màu ở chân trang; số màu 4–8; trang đáp án tô sẵn | 2 |
| to-mau-theo-phep-tinh | Tô màu theo phép tính | Phép cộng, trừ, cộng trừ, nhân, chia; phạm vi 10/20/100. Ít nhất 14 tranh (trái tim, ngôi nhà, hoa, cây, cá, bướm, mặt trời, ô tô, mèo, ngôi sao, táo, thuyền buồm, dâu, gà con) + "mỗi trang một hình khác". Số trang; 50–100 phép tính/trang; các ô cùng màu có cùng kết quả nhưng biểu thức khác nhau; trang đáp án tô sẵn | 1 |
| anh-thanh-tranh-to-mau | Ảnh thành tranh tô màu | Tải ảnh lên (xử lý trên máy): grayscale, làm mờ, dò biên (Sobel/Canny), đảo màu; thanh trượt độ chi tiết và độ dày nét; cắt khung; xuất A4 | 3 |
| tranh-to-mau-cho-be | Tranh tô màu cho bé | Thư viện tranh theo chủ đề (con vật, xe cộ, hoa quả, Tết, Trung thu); chọn nhiều tranh in một lượt; kèm chữ tên tranh để tập đọc | 2 |

### 4.8 Tiện ích PDF, ảnh, QR (5 công cụ)

Toàn bộ xử lý trong Web Worker, file không rời khỏi máy; giới hạn mềm khoảng 200 MB mỗi lần, có thanh tiến độ.

| Slug | Công cụ | Chức năng và tùy chọn riêng | GĐ |
| --- | --- | --- | --- |
| cong-cu-pdf-anh | Bộ công cụ PDF và ảnh | Ảnh sang PDF (sắp xếp kéo thả, khổ giấy, lề, vừa trang); ghép PDF; tách PDF (theo khoảng trang hoặc từng trang); xoay trang; xoá và sắp xếp trang (thumbnail) | 1 |
| pdf-sang-anh | PDF sang ảnh | Render bằng pdfjs; PNG/JPG; độ phân giải 72–300 dpi; chọn trang; tải zip | 2 |
| them-watermark-pdf | Watermark và đánh số trang | Watermark chữ hoặc logo (cỡ, độ mờ, góc xoay, vị trí, lặp lưới); đánh số trang (vị trí, định dạng "Trang 1/10", bắt đầu từ số bao nhiêu); áp dụng cho khoảng trang | 2 |
| ghep-trang-pdf | Ghép nhiều trang trên một tờ | 2, 4, 6, 8, 9, 16 trang/tờ (n-up); in sách gấp đôi (booklet); viền và khoảng cách | 3 |
| tao-ma-qr | Tạo mã QR | Nội dung: link, văn bản, Wi-Fi, email, số điện thoại; màu, logo giữa, mức sửa lỗi; tải PNG/SVG; in hàng loạt nhiều mã kèm nhãn (vd QR bài tập cho từng em) | 1 |

## 5. Yêu cầu phi chức năng

| Hạng mục | Yêu cầu đo được |
| --- | --- |
| In ấn | Bản in khớp xem trước; A4 dọc/ngang đúng @page; không cắt ngang câu hỏi hay ô khi sang trang; giấy ô ly sai lệch dưới 0,5 mm trên Chrome/Edge khi in 100% |
| PDF | File PDF giữ chữ dạng vector (không chụp ảnh) với các công cụ chữ và ô ly; nhúng font tiếng Việt |
| Hiệu năng | Trang chủ tải dưới 2 giây trên 4G; xem trước cập nhật dưới 300 ms khi đổi tùy chọn; mỗi công cụ tách bundle riêng, Lighthouse Performance từ 90 |
| Thiết bị | Dùng được từ 375 px (điện thoại) đến màn hình tivi 1920 px; Chrome, Edge, Safari, Firefox bản gần nhất |
| Trình chiếu | Chế độ toàn màn hình, chữ tối thiểu 48 px, tương phản cao, điều khiển bằng phím (Space, mũi tên) và bút trình chiếu |
| Quyền riêng tư | Không request mạng nào chứa dữ liệu học sinh (kiểm bằng Playwright); analytics nếu có thì ẩn danh, không cookie |
| Offline | PWA: cài lên máy, dùng được khi mất mạng sau lần mở đầu (cache font, clipart) |
| Trợ năng | WCAG 2.1 AA: nhãn cho mọi ô nhập, điều hướng bàn phím, viền focus rõ, hỗ trợ prefers-reduced-motion |
| SEO | Mỗi công cụ một trang prerender với title, description, Open Graph, dữ liệu có cấu trúc (SoftwareApplication, FAQPage), sitemap.xml |
| Chất lượng nội dung | Unit test cho mọi generator: không số âm, chia hết, đáp án đúng, sudoku nghiệm duy nhất, ô chữ chứa đủ từ; cùng seed ra cùng kết quả |
| Bản quyền | Font và clipart chỉ dùng loại có giấy phép mở (OFL, CC0) hoặc tự vẽ; ghi nguồn ở trang Giới thiệu |

## 6. Trang quản trị (Admin)

Khu quản trị cho bạn sửa nội dung, bật tắt công cụ, đọc góp ý và xem thống kê mà không phải sửa code. Người dùng công khai vẫn không cần đăng nhập, và dữ liệu học sinh vẫn không lên server.

### Phương án kiến trúc

| Phương án | Cách làm | Ưu điểm | Nhược điểm |
| --- | --- | --- | --- |
| **A. Cloudflare (đề xuất)** | Pages (web) + Workers (API) + D1 (SQLite) + R2 (file) + Access (đăng nhập) | Một nơi host, gói miễn phí đủ cho giai đoạn đầu, không phải tự viết phần đăng nhập | Phải học Workers và D1; công cụ quản trị DB ít hơn Supabase |
| B. Supabase | Postgres + Auth + Storage, web vẫn host Pages/Vercel | Giao diện quản trị DB sẵn, Auth đầy đủ | Hai nhà cung cấp; dự án miễn phí bị tạm dừng khi lâu không dùng |
| C. Git-based CMS (Decap/Tina) | Nội dung là file JSON/Markdown trong repo, admin sửa rồi commit | Không cần DB, có lịch sử sẵn | Không nhận được góp ý và thống kê; mỗi lần sửa phải build lại |

Chọn phương án A. Nội dung admin sửa được "xuất bản" thành file JSON tĩnh trên CDN, nên web công khai vẫn nhanh, vẫn dùng offline và vẫn chạy khi API lỗi.

&#91;embedded content: kiến trúc khu quản trị · luồng nội dung và dữ liệu\]

Mũi tên nét đứt là luồng duy nhất từ web công khai về server: góp ý do người dùng tự gửi và bộ đếm lượt dùng không kèm danh tính.

### Phân quyền

| Vai trò | Được làm |
| --- | --- |
| Quản trị viên | Toàn quyền: cấu hình, người dùng admin, xuất bản, khôi phục phiên bản, xoá |
| Biên tập viên | Sửa nội dung và thư viện hình, xử lý góp ý; gửi duyệt, không tự xuất bản |

### Chức năng admin

| Trang | Chức năng |
| --- | --- |
| `/admin` Tổng quan | Lượt dùng theo công cụ (7/30/90 ngày), lượt In và Tải PDF, top 10 công cụ, từ khóa tìm không ra kết quả, góp ý mới, lỗi JS gần đây |
| `/admin/cong-cu` Quản lý công cụ | Bật/tắt hiển thị, kéo thả thứ tự, nhãn Mới/Nổi bật, nhóm, lớp, môn, từ khóa tìm kiếm; nội dung SEO (tiêu đề, mô tả, hướng dẫn, FAQ); giá trị mặc định của tùy chọn. Code công cụ vẫn nằm trong repo; admin chỉ sửa metadata |
| `/admin/noi-dung` Ngân hàng nội dung | Từ vựng tiếng Việt theo chủ đề; từ vựng tiếng Anh theo lớp (từ, phiên âm, nghĩa, hình); kho câu nhận xét TT27 (mở đầu/thân/lời khuyên theo mức); mẫu toán lời văn; câu hỏi mẫu trò chơi; dạng bài phiếu cuối tuần theo tuần 1–35; mẫu thư mời, danh hiệu giấy khen. Nhập/xuất Excel |
| `/admin/thu-vien` Thư viện hình và font | Tải clipart, tranh tô màu SVG (tự kiểm tra mỗi vùng có id), viền giấy khen, font; mỗi file bắt buộc ghi nguồn và giấy phép; gắn thẻ chủ đề |
| `/admin/gop-y` Góp ý | Hộp thư từ form Góp ý công khai (Turnstile chống spam); trạng thái Mới / Đang xử lý / Đã xong / Bỏ qua; gắn công cụ liên quan; ghi chú nội bộ; trả lời qua email nếu người gửi để lại |
| `/admin/thong-bao` Thông báo | Banner trang chủ có lịch bắt đầu/kết thúc (vd "Đã có phiếu ôn Tết 2027") |
| `/admin/trang` Trang tĩnh | Soạn Giới thiệu, Quyền riêng tư, FAQ bằng Markdown |
| `/admin/cau-hinh` Cấu hình | Tên site, logo, email liên hệ, năm học hiện tại, ngày lễ và lịch nghỉ Tết (dùng cho Lịch năm học, Điểm danh), danh sách tài khoản admin |
| `/admin/xuat-ban` Xuất bản | Xem trước thay đổi, so sánh với bản đang chạy, bấm Xuất bản; lịch sử phiên bản và khôi phục một chạm |
| `/admin/nhat-ky` Nhật ký và sao lưu | Ai sửa gì, lúc nào; xuất/nhập toàn bộ nội dung dạng JSON |

Các trang admin cho tài khoản và gói (chi tiết gói ở mục 7):

| Trang | Chức năng |
| --- | --- |
| `/admin/nguoi-dung` Người dùng | Tìm theo email/tên; xem gói, ngày hết hạn, lượt dùng tháng này; cấp hoặc gia hạn gói bằng tay (có ghi lý do); khoá/mở tài khoản; xoá tài khoản theo yêu cầu người dùng |
| `/admin/goi` Gói và quyền | Sửa tên gói, giá tháng/năm, giới hạn (lượt In/PDF, số đề, số mục lưu); ma trận công cụ × mức truy cập (Khách / Free / Pro), đổi một ô là áp dụng sau khi Xuất bản |
| `/admin/don-hang` Đơn hàng | Danh sách đơn, trạng thái (Chờ thanh toán / Đã thanh toán / Hết hạn / Hoàn tiền), log webhook cổng thanh toán, kích hoạt tay khi webhook lỗi, xuất Excel để đối soát |
| `/admin/doanh-thu` Doanh thu | Doanh thu theo ngày/tháng, số tài khoản mới, tỉ lệ Free lên Pro, số gói sắp hết hạn trong 7 ngày |
| `/admin/ma-giam-gia` Mã giảm giá | Tạo mã (% hoặc số tiền), hạn dùng, số lượt, gói áp dụng |
| `/admin/truong` Gói Trường | Tạo gói cho trường/trung tâm, số ghế, người quản lý trường, ngày hết hạn, ghi chú hợp đồng/hóa đơn |

### Quy tắc cho admin

- Admin không có và không được xem dữ liệu học sinh: danh sách lớp, điểm, nhận xét chỉ nằm trên máy giáo viên.
- Thống kê chỉ đếm sự kiện theo công cụ và ngày, không IP, không cookie, không ID người dùng.
- Giao diện admin tách bundle riêng, không tải với web công khai.
- Web công khai luôn có bản JSON mặc định trong build, nên chạy được cả khi CDN hoặc API lỗi.

## 7. Tài khoản, gói và thanh toán

Khách dùng thử 10 công cụ; tài khoản Free mở 25 công cụ; Pro và Trường mở đủ 60. Danh sách lớp, điểm danh, nhận xét học sinh vẫn chỉ lưu trên máy giáo viên ở mọi gói.

### Quyền theo gói

| Quyền | Khách | Free | Pro | Trường |
| --- | --- | --- | --- | --- |
| Cần đăng nhập | Không | Có | Có | Có |
| Số công cụ | 10 | 25 | 60 | 60 |
| Lượt In hoặc Tải PDF | 5/ngày | 30/ngày | Không giới hạn | Không giới hạn |
| Watermark trên bản in | Dòng nhỏ chân trang | Dòng nhỏ chân trang | Không | Không |
| Số đề/phiếu khác nhau mỗi lượt | 1 | 3 | Tối đa 60 | Tối đa 60 |
| Phiếu in sẵn tên từng học sinh | Không | Không | Có | Có |
| Lưu nội dung (bộ câu hỏi, danh sách từ, mẫu phiếu) | Không | 10 mục | Không giới hạn | Không giới hạn, chia sẻ trong trường |
| Xuất Word/Excel | Không | Không | Có | Có |
| Logo trường trên phiếu | Không | Không | Có | Có, dùng chung |
| Quản lý giáo viên, thống kê dùng | — | — | — | Có |
| Hỗ trợ | Trang FAQ | Email | Email ưu tiên | Zalo riêng |
| Giá đề xuất (chốt sau) | 0 đ | 0 đ | 49.000 đ/tháng hoặc 399.000 đ/năm | Từ 2.000.000 đ/năm cho 20 giáo viên |

Mọi con số trên là giá trị khởi đầu, admin sửa được ở `/admin/goi` mà không cần sửa code.

### Công cụ theo mức truy cập (mặc định)

| Mức | Số công cụ | Slug |
| --- | --- | --- |
| Khách | 10 | phieu-toan, phieu-tieng-viet, tap-viet-chu, giay-o-ly, o-chu-tim-tu, cong-cu-tren-lop, chia-nhom, tinh-diem-xep-loai, to-mau-theo-phep-tinh, tao-ma-qr |
| Free (thêm) | 15 | tap-viet-tieng-anh, tro-choi-on-tap, nhan-xet-hoc-sinh, the-tu-vung-tieng-anh, cong-cu-pdf-anh, phieu-dong-ho-tien, phieu-so-lop-1-3, phieu-tra-loi-trac-nghiem, bingo, me-cung, sudoku, so-do-cho-ngoi, thoi-khoa-bieu, diem-danh-thu-nop, tranh-to-mau-cho-be |
| Pro (thêm) | 35 | 35 công cụ còn lại, trong đó có trộn đề, ma trận đề, phiếu cuối tuần, ôn Tết/hè, giấy khen, ảnh thành tranh tô màu, watermark PDF |

Registry thêm trường `access: 'guest' \| 'free' \| 'pro'`; giá trị thật lấy từ cấu hình admin đã xuất bản, giá trị trong code chỉ là mặc định.

### Đăng nhập

- **Cách đăng nhập:** Google, hoặc mã 6 số gửi qua email (không dùng mật khẩu để đỡ quên). Thư viện đề xuất: Better Auth chạy trên Cloudflare Workers + D1.
- **Hồ sơ:** họ tên, email, trường, cấp dạy, môn (tuỳ chọn, dùng để gợi ý công cụ).
- **Phiên:** cookie HttpOnly, 30 ngày; tối đa 3 thiết bị đăng nhập cùng lúc để hạn chế chia sẻ tài khoản Pro.
- **Admin:** dùng cùng hệ tài khoản với vai trò admin, và `/admin` được bọc thêm Cloudflare Access (hai lớp).
- **Dữ liệu lưu trên server:** hồ sơ, gói, đơn hàng, số lượt dùng theo ngày, nội dung giáo viên bấm Lưu. Khi lưu, hiện nhắc "Không nhập tên học sinh vào nội dung lưu". Danh sách lớp và các công cụ quản lý lớp không có nút lưu lên server.

### Thanh toán (cổng tự động)

1. Giáo viên chọn gói và kỳ hạn (tháng/năm), nhập mã giảm giá nếu có.
2. Server tạo đơn với mã đơn duy nhất và gọi cổng thanh toán (đề xuất PayOS; dự phòng SePay hoặc VNPay) để lấy mã VietQR.
3. Giáo viên quét QR bằng app ngân hàng; trang thanh toán tự cập nhật trạng thái.
4. Cổng gọi webhook; Worker kiểm chữ ký, kiểm số tiền, bỏ qua webhook trùng, rồi kích hoạt hoặc cộng dồn thời hạn gói.
5. Gửi email xác nhận kèm biên nhận; nhắc gia hạn trước 7 ngày và 1 ngày (VietQR không tự trừ tiền định kỳ).
6. Hết hạn: tài khoản về Free, nội dung đã lưu vẫn giữ nhưng chỉ xem, không lưu thêm quá 10 mục.

Thêm: dùng thử Pro 7 ngày một lần cho mỗi tài khoản mới.

### Gói Trường

- Admin hệ thống tạo gói với số ghế và ngày hết hạn, giao một người quản lý trường; thanh toán bằng chuyển khoản theo hợp đồng hoặc cổng thanh toán.
- Người quản lý trường có trang `/truong`: mời giáo viên bằng email hoặc mã mời, thu hồi ghế, tải logo trường dùng chung, xem số lượt dùng theo giáo viên (không xem nội dung họ tạo).
- Thư viện chung của trường: bộ câu hỏi, mẫu phiếu, mẫu nhận xét được chia sẻ cho cả trường.

### Chặn vượt quyền

Công cụ chạy trên trình duyệt nên không thể chặn tuyệt đối; mục tiêu là làm việc lách khó hơn việc trả tiền.

- Code công cụ Free và Pro tách thành bundle riêng, Worker chỉ trả file khi phiên đăng nhập đủ quyền.
- Lượt In/PDF của tài khoản đếm trên server (gọi API trước khi xuất); của khách đếm trên máy (chấp nhận có thể lách).
- Watermark vẽ vào bản PDF khi xuất, không chỉ bằng CSS.

### Pháp lý cần chuẩn bị trước khi thu tiền

- [ ] Đăng ký hộ kinh doanh hoặc doanh nghiệp để mở tài khoản cổng thanh toán và xuất hóa đơn
- [ ] Kiểm tra thủ tục thông báo website thương mại điện tử với Bộ Công Thương
- [ ] Điều khoản sử dụng, chính sách hoàn tiền, chính sách bảo vệ dữ liệu cá nhân (email giáo viên thuộc dữ liệu cá nhân theo Nghị định 13/2023)
- [ ] Chốt giá các gói

## 8. Lộ trình và nghiệm thu

Bạn chọn ưu tiên cả 4 nhóm, nên giai đoạn 1 làm khung chung cùng 15 công cụ dùng nhiều nhất, rải đều mọi nhóm. Ba giai đoạn sau phủ nốt 45 công cụ còn lại.

&#91;embedded content: lộ trình · 4 giai đoạn, 60 công cụ\]

Khung chung phải xong và ổn định trước; từ giai đoạn 2, mỗi công cụ chỉ cần thêm một thư mục trong `tools/` và một dòng registry.

### Danh sách slug theo giai đoạn

| GĐ | Số công cụ | Slug |
| --- | --- | --- |
| 1 | 15 | phieu-toan, phieu-tieng-viet, tinh-diem-xep-loai, tro-choi-on-tap, o-chu-tim-tu, tap-viet-chu, giay-o-ly, tap-viet-tieng-anh, cong-cu-tren-lop, chia-nhom, nhan-xet-hoc-sinh, the-tu-vung-tieng-anh, to-mau-theo-phep-tinh, cong-cu-pdf-anh, tao-ma-qr |
| 2 | 22 | phieu-toan-lop-4-5, phieu-so-lop-1-3, toan-loi-van-lop-1-3, phieu-dong-ho-tien, phieu-hoc-tap-khung-trong, tron-de-trac-nghiem, ma-tran-de-kiem-tra, phieu-tra-loi-trac-nghiem, o-chu-tu-khoa-hang-doc, bingo, tap-to-net-co-ban, so-do-cho-ngoi, thoi-khoa-bieu, diem-danh-thu-nop, giay-khen, bang-thi-dua, nhan-vo-the-ten, the-chu-the-tu, to-mau-theo-so, tranh-to-mau-cho-be, pdf-sang-anh, them-watermark-pdf |
| 3 | 20 | phieu-luyen-tu-va-cau, phieu-ghep-hinh-cau, phieu-bai-tap-cuoi-tuan-lop-1-2, phieu-bai-tap-cuoi-tuan-lop-3-4, bai-tap-on-tet-on-he, the-tro-choi-hoa-ong-dung-sai, me-cung, sudoku, day-quy-luat, ma-phuong-thap-so, giay-khuong-nhac, phan-cong-truc-nhat, lich-nam-hoc, thu-moi-phu-huynh, phieu-doi-qua, bang-dan-tuong, the-tu-vung-hinh, bang-van-lop-1, anh-thanh-tranh-to-mau, ghep-trang-pdf |
| 4 | 3 | hinh-khai-trien, phieu-tiet-tau, phieu-doc-ten-not |

**Khu quản trị chạy song song:** giai đoạn 1 để nội dung trong file JSON của repo (chưa cần admin). Giai đoạn 2 dựng admin cơ bản: đăng nhập, Tổng quan, Quản lý công cụ, Góp ý, Xuất bản. Giai đoạn 3 thêm Ngân hàng nội dung, Thư viện hình, Thông báo, Trang tĩnh. Giai đoạn 4 thêm phân quyền biên tập viên, nhật ký và sao lưu. Giao cho Claude Code thành lượt riêng: "Đọc PRD.md mục 6, dựng admin cơ bản trên Cloudflare Workers + D1."

**Tài khoản và gói:** giai đoạn 1 thêm trường `access` vào registry nhưng mở hết khi phát triển. Giai đoạn 2 làm đăng nhập, gói Khách/Free/Pro, giới hạn lượt, thanh toán PayOS và các trang admin Người dùng, Gói, Đơn hàng. Giai đoạn 3 làm gói Trường, mã giảm giá, dùng thử Pro, trang Doanh thu. Chỉ bật thu tiền khi danh sách pháp lý ở mục 7 đã xong.

### Tiêu chí nghiệm thu mỗi công cụ

- [ ] Đủ tùy chọn ghi trong mục 4 và bộ tùy chọn chung 4.0 (nếu là công cụ in)
- [ ] Xem trước khớp bản in; in thử A4 đúng lề, không tràn trang
- [ ] Tải PDF mở được, tiếng Việt hiển thị đúng dấu
- [ ] Generator có unit test và đáp án đúng 100% trên 1.000 lần sinh ngẫu nhiên
- [ ] Tùy chọn được nhớ sau khi tải lại trang; "Về mặc định" xoá được
- [ ] Dùng được trên điện thoại 375 px và chế độ toàn màn hình (nếu trình chiếu)
- [ ] Có trang SEO: tiêu đề, mô tả, hướng dẫn ngắn, FAQ, công cụ liên quan
- [ ] Không có request mạng chứa dữ liệu người dùng

### Cách giao cho Claude Code

1. Lưu tài liệu này thành `PRD.md` ở gốc dự án (tải về dạng Markdown).
2. Lượt 1: "Đọc PRD.md, dựng khung mục 2–3: Vite + React + TS, registry, ToolLayout, in A4/PDF, trang chủ, trang lớp, tìm kiếm. Chưa làm công cụ nào."
3. Lượt 2: "Làm công cụ phieu-toan theo mục 4.1 làm mẫu chuẩn, kèm unit test." Duyệt kỹ công cụ mẫu này.
4. Các lượt sau: mỗi lượt 2–3 công cụ cùng giai đoạn, yêu cầu làm theo mẫu phieu-toan và đánh dấu nghiệm thu.
5. Sau mỗi giai đoạn: chạy toàn bộ test, in thử trên máy in thật, deploy bản xem trước.

### Phương án đề xuất cho các điểm cần chốt

| Vấn đề | Đề xuất | Phương án khác |
| --- | --- | --- |
| Tên và tên miền | Tên ngắn, dễ gõ không dấu, nói rõ việc làm (vd "Phiếu Lớp Em", "Kho Phiếu", "Giáo Viên Kit"); đăng ký `.vn` làm chính và giữ thêm `.com`. Kiểm tra tên còn trống tại nhà đăng ký trước khi chốt | Dùng subdomain của trung tâm bạn (vd `congcu.<tên-trung-tâm>.vn`) để kéo khách về trung tâm |
| Font tập viết tiểu học | **Đã chốt: HP001** (nét thanh) và **HP001 Đậm** làm font mặc định cho tập viết chữ, phiếu tiếng Việt, tập tô, thẻ chữ. Tự host file font (WOFF2, cắt bớt ký tự tiếng Việt), chỉ nạp trên trang công cụ cần dùng. Trước khi phát hành công khai: xin văn bản cho phép nhúng web của tác giả font và lưu vào hồ sơ dự án | Dự phòng: Playwrite VN và Playwrite VN Guides (SIL OFL 1.1), đổi bằng một dòng cấu hình trong admin nếu chưa có giấy phép HP001 |
| Thống kê truy cập | **Cloudflare Web Analytics** (miễn phí, không cookie) cho lượt xem trang, cộng bộ đếm sự kiện riêng qua API admin (mở công cụ, In, Tải PDF) để hiện ở trang Tổng quan | Umami tự host nếu muốn toàn bộ số liệu nằm trên máy chủ của mình; không dùng Google Analytics vì trái cam kết quyền riêng tư |
| Nguồn hình minh họa | Tranh tô màu: tự vẽ SVG (bắt buộc, vì cần chia vùng có id). Icon giao diện: Lucide hoặc Phosphor (MIT). Hình flashcard, thẻ từ vựng: OpenMoji, giấy phép CC BY-SA 4.0 (không phải CC0), phải ghi nguồn và chia sẻ lại hình đã sửa cùng giấy phép. Admin quản lý thư viện và bắt ghi giấy phép từng file | Thuê họa sĩ vẽ bộ riêng (khoảng 150–300 hình) để có phong cách thống nhất và toàn quyền sử dụng |

Nguồn: [Playwrite VN (Fontsource)](https://fontsource.org/fonts/playwrite-vn/about) · [Giấy phép OFL của Playwrite VN (Google Fonts)](https://github.com/google/fonts/pull/7639/files) · [OpenMoji FAQ](https://openmoji.org/faq) · [Cloudflare Web Analytics](https://cloudflare.com/web-analytics)
