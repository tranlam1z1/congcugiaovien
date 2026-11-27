/** Danh sách lớp dùng chung cho nhóm công cụ quản lý lớp (PRD 4.5). Chỉ lưu trên máy. */
import { removeDiacritics } from '../vi/normalize';

export type Gender = 'nam' | 'nu' | null;
export type Student = { name: string; gender: Gender };

export type ClassInfo = {
  id: number;
  name: string;
  /** Mỗi dòng một em: "Tên" hoặc "Tên, Nữ". */
  text: string;
};

export type ClassStore = { classes: ClassInfo[]; activeId: number };

export const MAX_STUDENTS_PER_CLASS = 80;
export const MAX_CLASSES = 20;

const GENDERS: Record<string, Gender> = {
  nam: 'nam',
  trai: 'nam',
  m: 'nam',
  male: 'nam',
  nu: 'nu',
  gai: 'nu',
  f: 'nu',
  female: 'nu',
};

export const toGender = (text: string): Gender => GENDERS[removeDiacritics(text.trim())] ?? null;

export function parseStudents(text: string): Student[] {
  const students: Student[] = [];
  for (const line of text.split(/\r?\n/)) {
    const [first = '', ...rest] = line.split(/\t|[,;|]|\s[-–]\s/);
    const name = first.normalize('NFC').replace(/\s+/g, ' ').trim();
    if (!name) continue;
    students.push({ name, gender: rest.map(toGender).find(Boolean) ?? null });
    if (students.length === MAX_STUDENTS_PER_CLASS) break;
  }
  return students;
}

export const emptyStore = (): ClassStore => ({
  classes: [{ id: 1, name: 'Lớp của tôi', text: '' }],
  activeId: 1,
});

/** Dữ liệu đọc từ máy có thể cũ hoặc hỏng. */
export function toStore(raw: unknown): ClassStore {
  const input = (raw ?? {}) as { classes?: unknown; activeId?: unknown };
  if (!Array.isArray(input.classes) || input.classes.length === 0) return emptyStore();
  const classes = input.classes.slice(0, MAX_CLASSES).map((item, index) => {
    const c = (item ?? {}) as Partial<Record<keyof ClassInfo, unknown>>;
    return {
      id: typeof c.id === 'number' ? c.id : index + 1,
      name: typeof c.name === 'string' ? c.name : '',
      text: typeof c.text === 'string' ? c.text : '',
    };
  });
  const activeId = classes.some((c) => c.id === input.activeId)
    ? (input.activeId as number)
    : classes[0]!.id;
  return { classes, activeId };
}

export const activeClass = (store: ClassStore) =>
  store.classes.find((c) => c.id === store.activeId) ?? store.classes[0]!;

export function addClass(store: ClassStore): ClassStore {
  if (store.classes.length >= MAX_CLASSES) return store;
  const id = Math.max(...store.classes.map((c) => c.id)) + 1;
  return {
    classes: [...store.classes, { id, name: `Lớp ${store.classes.length + 1}`, text: '' }],
    activeId: id,
  };
}

export function updateClass(store: ClassStore, patch: Partial<Omit<ClassInfo, 'id'>>): ClassStore {
  const { id } = activeClass(store);
  return { ...store, classes: store.classes.map((c) => (c.id === id ? { ...c, ...patch } : c)) };
}

export function removeActiveClass(store: ClassStore): ClassStore {
  const { id } = activeClass(store);
  const classes = store.classes.filter((c) => c.id !== id);
  return classes.length ? { classes, activeId: classes[0]!.id } : emptyStore();
}
