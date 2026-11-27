import { Backpack, Check, FileSpreadsheet, Languages, Users } from 'lucide-react';

const AUDIENCES = [
  {
    icon: Backpack,
    group: 'phieu-bai-tap',
    title: 'Giáo viên Tiểu học (lớp 1–5)',
    note: 'Theo chương trình mới và Thông tư 27/2020',
    points: [
      'Phiếu toán tự sinh, toán lời văn, đồng hồ và tiền Việt Nam',
      'Bài tập viết chữ trên giấy ô ly',
      'Nhận xét học sinh, bảng thi đua, phiếu khen thưởng',
    ],
  },
  {
    icon: Languages,
    group: 'tro-choi',
    title: 'Giáo viên Tiếng Anh',
    note: 'Học liệu trực quan, có phát âm',
    points: [
      'Phiếu tập viết 4 dòng, kiểu print và cursive',
      'Flashcard từ vựng lớp 1–5 có phiên âm và đọc mẫu',
      'Tìm từ, Bingo từ vựng, Rung chuông vàng',
    ],
  },
  {
    icon: FileSpreadsheet,
    group: 'de-kiem-tra',
    title: 'Giáo viên THCS/THPT',
    note: 'Đề kiểm tra và Thông tư 22/2021',
    points: [
      'Trộn đề trắc nghiệm nhiều mã đề, xuất file Word',
      'Ma trận đề tự tính tỉ lệ Nhận biết, Thông hiểu, Vận dụng',
      'Phiếu trả lời trắc nghiệm, tính điểm và xếp loại',
    ],
  },
  {
    icon: Users,
    group: 'quan-ly-lop',
    title: 'Phụ huynh và tổ chuyên môn',
    note: 'Kèm con học ở nhà, điều hành tổ nhóm',
    points: [
      'Phiếu cuối tuần, ôn Tết, ôn hè, tô màu theo phép tính',
      'Lịch năm học, thời khóa biểu, điểm danh',
      'Ghép tách PDF, đóng watermark, tạo mã QR hàng loạt',
    ],
  },
] as const;

export function Audiences() {
  return (
    <section id="doi-tuong" aria-labelledby="doi-tuong-title" className="section">
      <div className="container-page flex flex-col gap-8">
        <div className="section-head">
          <h2 id="doi-tuong-title" className="heading-section">
            Dành cho từng bậc học
          </h2>
          <p className="text-muted">Mỗi cấp học và vai trò có bộ công cụ riêng.</p>
        </div>
        <ul className="grid gap-5 md:grid-cols-2">
          {AUDIENCES.map((audience) => (
            <li key={audience.title} className="card flex flex-col gap-4 p-6">
              <div className="flex items-center gap-3">
                <span data-group={audience.group} className="tint size-12">
                  <audience.icon aria-hidden className="size-6" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{audience.title}</h3>
                  <p className="text-muted">{audience.note}</p>
                </div>
              </div>
              <ul className="flex flex-col gap-2">
                {audience.points.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <Check aria-hidden className="mt-1 size-5 shrink-0 text-accent" />
                    {point}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
