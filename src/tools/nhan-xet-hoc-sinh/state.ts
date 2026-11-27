/** Tùy chọn, phần giáo viên chỉnh cho từng em (chỉ lưu trên máy) và dòng kết quả. */
import type { Student } from '@/core/classes/model';
import type { Focus, Quality, Study } from './bank';
import { composeComment, hashText, type Pronoun } from './generate';

export const PRONOUNS: { value: Pronoun; label: string }[] = [
  { value: 'em', label: 'Em' },
  { value: 'con', label: 'Con' },
  { value: 'ten', label: 'Tên bé' },
];
export const FOCUSES: { value: Focus; label: string }[] = [
  { value: 'chung', label: 'Chung' },
  { value: 'toan', label: 'Toán' },
  { value: 'tieng-viet', label: 'Tiếng Việt' },
  { value: 'tieng-anh', label: 'Tiếng Anh' },
  { value: 'khac', label: 'Môn khác' },
];
export const STUDIES: { value: Study; label: string }[] = [
  { value: 'tot', label: 'Hoàn thành tốt' },
  { value: 'dat', label: 'Hoàn thành' },
  { value: 'chua', label: 'Chưa hoàn thành' },
];
export const QUALITIES: { value: Quality; label: string }[] = [
  { value: 'tot', label: 'Tốt' },
  { value: 'dat', label: 'Đạt' },
  { value: 'cg', label: 'Cần cố gắng' },
];

export const MAX_COMMENT = 600;

/** Những gì khác mặc định của một em. */
export type StudentRecord = {
  study?: Study;
  quality?: Quality;
  /** Số lần "Viết lại". */
  revision?: number;
  /** Lời nhận xét giáo viên đã sửa tay. */
  text?: string;
};

export const DEFAULTS = {
  pronoun: 'em' as Pronoun,
  focus: 'chung' as Focus,
  subject: '',
  study: 'tot' as Study,
  quality: 'tot' as Quality,
  seed: 100001,
  title: '',
  school: '',
  records: {} as Record<string, StudentRecord>,
};

export type Options = typeof DEFAULTS;

const valid = <T extends string>(list: { value: T }[], value: unknown): T | undefined =>
  list.find((item) => item.value === value)?.value;

export function resolve(options: Options) {
  const records: unknown = options.records;
  return {
    pronoun: valid(PRONOUNS, options.pronoun) ?? DEFAULTS.pronoun,
    focus: valid(FOCUSES, options.focus) ?? DEFAULTS.focus,
    subject: String(options.subject ?? ''),
    study: valid(STUDIES, options.study) ?? DEFAULTS.study,
    quality: valid(QUALITIES, options.quality) ?? DEFAULTS.quality,
    seed: Number.isFinite(options.seed) ? options.seed : DEFAULTS.seed,
    records: (typeof records === 'object' && records !== null
      ? records
      : {}) as Options['records'],
  };
}

export type Settings = ReturnType<typeof resolve>;

export type Line = {
  /** Khóa lưu: theo lớp, tên và thứ tự trùng tên. */
  key: string;
  name: string;
  study: Study;
  quality: Quality;
  comment: string;
  /** Lời nhận xét đã sửa tay. */
  edited: boolean;
  revision: number;
};

export function buildLines(classId: number, students: Student[], settings: Settings): Line[] {
  const seen = new Map<string, number>();
  return students.map(({ name }) => {
    const occurrence = seen.get(name) ?? 0;
    seen.set(name, occurrence + 1);
    const key = `${classId}|${name}|${occurrence}`;
    const record = (Object.hasOwn(settings.records, key) ? settings.records[key] : null) ?? {};
    const study = valid(STUDIES, record.study) ?? settings.study;
    const quality = valid(QUALITIES, record.quality) ?? settings.quality;
    const revision = Number.isInteger(record.revision) ? record.revision! : 0;
    const edited = typeof record.text === 'string';
    const comment = edited
      ? record.text!.slice(0, MAX_COMMENT)
      : composeComment(
          { ...settings, name, study, quality },
          hashText(`${settings.seed}|${key}|${revision}`),
        );
    return { key, name, study, quality, comment, edited, revision };
  });
}

/** Lần viết lại kế tiếp cho ra câu khác câu đang có (giữ nguyên mức). */
export function rewritten(line: Line, settings: Settings): StudentRecord {
  const record = settings.records[line.key] ?? {};
  let revision = line.revision;
  for (let i = 0; i < 20; i++) {
    revision++;
    const next = composeComment(
      { ...settings, name: line.name, study: line.study, quality: line.quality },
      hashText(`${settings.seed}|${line.key}|${revision}`),
    );
    if (next !== line.comment) break;
  }
  const { text: _, ...kept } = record;
  return { ...kept, revision };
}
