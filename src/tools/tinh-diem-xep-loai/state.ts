/** Dữ liệu người dùng nhập (chỉ lưu trên máy) và cách đổi nó thành kết quả. */
import {
  classify,
  formatScore,
  LEVELS,
  parseScore,
  parseScoreList,
  semesterAverage,
  yearAverage,
  type Classification,
  type SubjectResult,
  type Tenths,
} from './calc';

export type Mode = 'semester' | 'year';
export type Kind = 'score' | 'comment';

export type Subject = {
  id: number;
  name: string;
  kind: Kind;
  /** Học kỳ: điểm thường xuyên, giữa kỳ, cuối kỳ. */
  regular: string;
  midterm: string;
  final: string;
  /** Cả năm: điểm trung bình hai học kỳ. */
  first: string;
  second: string;
  /** Môn nhận xét. */
  passed: boolean;
};

export type State = { mode: Mode; subjects: Subject[] };

export const MAX_SUBJECTS = 20;

export const newSubject = (id: number, name: string, kind: Kind = 'score'): Subject => ({
  id,
  name,
  kind,
  regular: '',
  midterm: '',
  final: '',
  first: '',
  second: '',
  passed: true,
});

const COMMENT_SUBJECTS = [
  'Giáo dục thể chất',
  'Nghệ thuật',
  'Hoạt động trải nghiệm, hướng nghiệp',
  'Nội dung giáo dục của địa phương',
];

/** Danh sách môn gợi ý; giáo viên sửa tên, thêm, bớt tùy lớp. */
export const TEMPLATES = {
  thcs: {
    label: 'Mẫu THCS',
    score: [
      'Ngữ văn',
      'Toán',
      'Ngoại ngữ 1',
      'Giáo dục công dân',
      'Lịch sử và Địa lí',
      'Khoa học tự nhiên',
      'Công nghệ',
      'Tin học',
    ],
  },
  thpt: {
    label: 'Mẫu THPT',
    score: [
      'Ngữ văn',
      'Toán',
      'Ngoại ngữ 1',
      'Lịch sử',
      'Giáo dục quốc phòng và an ninh',
      'Môn lựa chọn 1',
      'Môn lựa chọn 2',
      'Môn lựa chọn 3',
      'Môn lựa chọn 4',
    ],
  },
} as const;

export const templateSubjects = (template: keyof typeof TEMPLATES): Subject[] => [
  ...TEMPLATES[template].score.map((name, i) => newSubject(i + 1, name)),
  ...COMMENT_SUBJECTS.map((name, i) =>
    newSubject(TEMPLATES[template].score.length + i + 1, name, 'comment'),
  ),
];

export const DEFAULT_STATE: State = { mode: 'semester', subjects: templateSubjects('thcs') };

const text = (value: unknown) => (typeof value === 'string' ? value : '');

/** Dữ liệu lưu trên máy có thể cũ hoặc hỏng. */
export function toState(input: Partial<Record<keyof State, unknown>>): State {
  const list = Array.isArray(input.subjects) ? input.subjects : DEFAULT_STATE.subjects;
  return {
    mode: input.mode === 'year' ? 'year' : 'semester',
    subjects: list.slice(0, MAX_SUBJECTS).map((raw, index) => {
      const s = (raw ?? {}) as Partial<Record<keyof Subject, unknown>>;
      return {
        // Đánh lại số để khóa luôn duy nhất.
        id: index + 1,
        name: text(s.name),
        kind: s.kind === 'comment' ? 'comment' : 'score',
        regular: text(s.regular),
        midterm: text(s.midterm),
        final: text(s.final),
        first: text(s.first),
        second: text(s.second),
        passed: s.passed !== false,
      };
    }),
  };
}

export type SubjectOutcome = {
  /** null khi chưa nhập đủ hoặc nhập sai. */
  result: SubjectResult | null;
  error: string | null;
  /** Nhắc nhở, vẫn tính điểm. */
  warning: string | null;
};

export const subjectName = (subject: Subject, index: number) =>
  subject.name.trim() || `Môn ${index + 1}`;

export function evaluate(subject: Subject, index: number, mode: Mode): SubjectOutcome {
  const name = subjectName(subject, index);
  const done = (result: SubjectResult | null, warning: string | null = null) => ({
    result,
    error: null,
    warning,
  });
  const failed = (error: string) => ({ result: null, error, warning: null });
  const score = (average: Tenths): SubjectResult => ({ name, kind: 'score', average });

  if (subject.kind === 'comment') {
    return done({ name, kind: 'comment', passed: subject.passed });
  }
  if (mode === 'year') {
    const first = parseScore(subject.first);
    const second = parseScore(subject.second);
    const error = first.error ?? second.error;
    if (error) return failed(error);
    if (first.value === null || second.value === null) return done(null);
    return done(score(yearAverage(first.value, second.value)));
  }
  const regular = parseScoreList(subject.regular);
  const midterm = parseScore(subject.midterm);
  const final = parseScore(subject.final);
  const error = regular.error ?? midterm.error ?? final.error;
  if (error) return failed(error);
  if (!regular.values.length || midterm.value === null || final.value === null) return done(null);
  return done(
    score(semesterAverage(regular.values, midterm.value, final.value)),
    regular.values.length < 2
      ? 'Mỗi học kỳ cần ít nhất 2 điểm thường xuyên.'
      : null,
  );
}

export type Summary = {
  outcomes: SubjectOutcome[];
  /** Số môn còn thiếu hoặc nhập sai. */
  missing: number;
  /** null khi chưa đủ dữ liệu. */
  classification: Classification | null;
};

export function summarize({ mode, subjects }: State): Summary {
  const outcomes = subjects.map((subject, i) => evaluate(subject, i, mode));
  const results = outcomes.flatMap((o) => (o.result ? [o.result] : []));
  const missing = outcomes.length - results.length;
  return {
    outcomes,
    missing,
    classification: missing === 0 && results.length > 0 ? classify(results) : null,
  };
}

export const resultText = (result: SubjectResult) =>
  result.kind === 'score' ? formatScore(result.average) : result.passed ? 'Đạt' : 'Chưa đạt';

/** Nội dung cho nút "Chép kết quả". */
export function toClipboardText(state: State, summary: Summary): string {
  const period = state.mode === 'year' ? 'cả năm' : 'học kỳ';
  const lines = state.subjects.map((subject, i) => {
    const { result } = summary.outcomes[i]!;
    return `${subjectName(subject, i)}: ${result ? resultText(result) : '(chưa đủ điểm)'}`;
  });
  const { classification } = summary;
  const verdict = classification
    ? `Gợi ý xếp loại: ${LEVELS[classification.level]}` +
      (classification.adjustedFor
        ? ` (điều chỉnh từ ${LEVELS[classification.base]} theo khoản 3 Điều 9, môn ${classification.adjustedFor})`
        : '')
    : 'Chưa đủ dữ liệu để gợi ý xếp loại.';
  return [
    `Kết quả học tập ${period} (chỉ để tham khảo, TT22/2021)`,
    ...lines,
    verdict,
  ].join('\n');
}
