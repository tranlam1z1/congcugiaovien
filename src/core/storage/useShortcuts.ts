import { useCallback } from 'react';
import { useLocalState } from './useLocalState';

const EMPTY: string[] = [];
const RECENT_LIMIT = 8;

/** Công cụ được ghim lên đầu trang chủ. */
export function usePinned() {
  const [pinned, setPinned] = useLocalState('pinned', EMPTY);
  const toggle = useCallback(
    (slug: string) =>
      setPinned((list) =>
        list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug],
      ),
    [setPinned],
  );
  return [pinned, toggle] as const;
}

/** "Dùng gần đây", mới nhất đứng đầu. */
export function useRecent() {
  const [recent, setRecent] = useLocalState('recent', EMPTY);
  const record = useCallback(
    (slug: string) =>
      setRecent((list) => [slug, ...list.filter((s) => s !== slug)].slice(0, RECENT_LIMIT)),
    [setRecent],
  );
  return [recent, record] as const;
}
