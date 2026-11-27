import { useCallback } from 'react';
import { useLocalState } from './useLocalState';

/**
 * Tùy chọn của một công cụ, nhớ sau khi tải lại trang.
 * `defaults` phải là hằng số khai báo ngoài component.
 */
export function useToolOptions<T extends object>(slug: string, defaults: T) {
  const [options, setOptions, reset] = useLocalState<T>(`tool:${slug}`, defaults);
  const patch = useCallback(
    (changes: Partial<T>) => setOptions((previous) => ({ ...previous, ...changes })),
    [setOptions],
  );
  return [options, patch, reset] as const;
}
