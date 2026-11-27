import regular from '@expo-google-fonts/playwrite-vn/400Regular/PlaywriteVN_400Regular.ttf?url';
import { useEffect, useState } from 'react';
import { createHandwriting, type Handwriting } from './cursive';

let loading: Promise<Handwriting> | null = null;

function load() {
  loading ??= fetch(regular)
    .then(async (response) => {
      if (!response.ok) throw new Error(`Không tải được font (${response.status})`);
      return createHandwriting(new Uint8Array(await response.arrayBuffer()));
    })
    .catch((error: unknown) => {
      // Lần mở sau được thử lại.
      loading = null;
      throw error;
    });
  return loading;
}

/** Font chữ viết tay; `failed` khi không tải được, `retry` để thử lại. */
export function useHandwriting(enabled = true) {
  const [state, setState] = useState<{ font: Handwriting | null; failed: boolean }>({
    font: null,
    failed: false,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let current = true;
    setState({ font: null, failed: false });
    load()
      .then((font) => current && setState({ font, failed: false }))
      .catch((error: unknown) => {
        console.error(error);
        if (current) setState({ font: null, failed: true });
      });
    return () => {
      current = false;
    };
  }, [attempt, enabled]);

  return { ...state, retry: () => setAttempt((n) => n + 1) };
}
