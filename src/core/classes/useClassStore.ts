/** Kho danh sách lớp lưu trong IndexedDB của máy, dùng chung giữa các công cụ. */
import { del, get, set } from 'idb-keyval';
import { useEffect, useSyncExternalStore } from 'react';
import { clearLocalState } from '../storage/useLocalState';
import { emptyStore, toStore, type ClassStore } from './model';

const KEY = 'kcc:classes';

type Snapshot = {
  store: ClassStore;
  loaded: boolean;
  /** false khi trình duyệt không cho lưu (chế độ riêng tư). */
  persistent: boolean;
};

const initial: Snapshot = { store: emptyStore(), loaded: false, persistent: true };
let snapshot = initial;
let loading = false;
const listeners = new Set<() => void>();

function publish(next: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((notify) => notify());
}

const subscribe = (notify: () => void) => {
  listeners.add(notify);
  return () => listeners.delete(notify);
};

function load() {
  if (snapshot.loaded || loading) return;
  loading = true;
  get(KEY)
    .then((raw) => publish({ store: toStore(raw), loaded: true }))
    .catch(() => publish({ loaded: true, persistent: false }));
}

function save(update: (store: ClassStore) => ClassStore) {
  const store = update(snapshot.store);
  publish({ store });
  set(KEY, store).catch(() => publish({ persistent: false }));
}

/** Xoá danh sách lớp và mọi nội dung đã nhập trong các công cụ (dùng cho máy chung). */
function wipe() {
  clearLocalState('tool:');
  publish({ store: emptyStore() });
  del(KEY).catch(() => publish({ persistent: false }));
}

export function useClassStore() {
  const state = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => initial,
  );
  useEffect(load, []);
  return { ...state, save, wipe };
}
