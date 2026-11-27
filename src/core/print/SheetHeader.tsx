/** Độ dài tối đa của tiêu đề và tên trường: đủ để đầu phiếu gọn trong phần đã chừa. */
export const MAX_HEADING_LENGTH = 60;

/** Chiều cao (mm) cần chừa cho đầu phiếu rộng `width` mm, ước lượng dư để không đè nội dung. */
export function sheetHeaderHeight(
  { title, school, showNameLine }: { title: string; school: string; showNameLine: boolean },
  width: number,
) {
  const titleLines = Math.ceil((title.length * 3.8) / width);
  return (school ? 6 : 0) + (showNameLine ? 9 : 0) + 3 + titleLines * 9 + 5;
}

/** Đầu phiếu chung (PRD 4.0): trường/lớp, tiêu đề, dòng "Họ và tên / Lớp". */
export function SheetHeader({
  title,
  school,
  showNameLine = true,
  studentName,
}: {
  title: string;
  school?: string;
  showNameLine?: boolean;
  /** Có tên thì in sẵn thay cho dòng chấm. */
  studentName?: string;
}) {
  return (
    <header className="sheet-header">
      {school && <p className="sheet-school">{school}</p>}
      {showNameLine && (
        <p className="sheet-name-line">
          <span>Họ và tên:</span>
          <span className="sheet-blank">{studentName}</span>
          <span>Lớp:</span>
          <span className="sheet-blank sheet-blank-short" />
        </p>
      )}
      <h2 className="sheet-title">{title}</h2>
    </header>
  );
}
