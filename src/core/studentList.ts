export const MAX_STUDENTS = 60;

/** Mỗi dòng một tên; bỏ dòng trống, gộp khoảng trắng thừa. */
export function parseStudentList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}
