import { useCallback, useSyncExternalStore, type SetStateAction } from 'react';

const PREFIX = 'kcc:';

type Cached = { raw: string | null; value: unknown };

const cache = new Map<string, Cached>();
const listeners = new Set<() => void>();
// Dùng khi trình duyệt chặn localStorage (chế độ riêng tư, máy khoá).
const memory = new Map<string, string>();

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Tùy chọn mới thêm sau này lấy giá trị mặc định, tùy chọn đã lưu giữ nguyên. */
function parse<T>(raw: string | null, fallback: T): T {
  if (raw === null) return fallback;
  try {
    const value: unknown = JSON.parse(raw);
    if (isPlainObject(fallback)) {
      return (isPlainObject(value) ? { ...fallback, ...value } : fallback) as T;
    }
    if (Array.isArray(fallback)) return (Array.isArray(value) ? value : fallback) as T;
    return typeof value === typeof fallback ? (value as T) : fallback;
  } catch {
    return fallback;
  }
}

function snapshot<T>(key: string, fallback: T): T {
  const raw = readRaw(key);
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  const value = parse(raw, fallback);
  cache.set(key, { raw, value });
  return value;
}

function write(key: string, raw: string | null) {
  if (raw === null) memory.delete(key);
  else memory.set(key, raw);
  try {
    if (raw === null) localStorage.removeItem(key);
    else localStorage.setItem(key, raw);
  } catch {
    // Đã giữ trong bộ nhớ.
  }
  listeners.forEach((notify) => notify());
}

/** Xoá mọi giá trị đã nhớ có tên bắt đầu bằng `namePrefix`. */
export function clearLocalState(namePrefix: string) {
  const prefix = PREFIX + namePrefix;
  const keys = new Set(memory.keys());
  try {
    for (let i = 0; i < localStorage.length; i++) keys.add(localStorage.key(i)!);
  } catch {
    // Chỉ còn dữ liệu trong bộ nhớ.
  }
  for (const key of keys) if (key.startsWith(prefix)) write(key, null);
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  window.addEventListener('storage', notify);
  return () => {
    listeners.delete(notify);
    window.removeEventListener('storage', notify);
  };
}

/**
 * useState được nhớ trong localStorage, đồng bộ giữa các component và các tab.
 * `fallback` phải là hằng số khai báo ngoài component.
 * Trả về [giá trị, đặt giá trị, về mặc định].
 */
export function useLocalState<T>(name: string, fallback: T) {
  const key = PREFIX + name;
  const value = useSyncExternalStore(
    subscribe,
    () => snapshot(key, fallback),
    () => fallback,
  );

  const setValue = useCallback(
    (action: SetStateAction<T>) => {
      const next =
        typeof action === 'function'
          ? (action as (previous: T) => T)(snapshot(key, fallback))
          : action;
      write(key, JSON.stringify(next));
    },
    [key, fallback],
  );

  const reset = useCallback(() => write(key, null), [key]);

  return [value, setValue, reset] as const;
}
