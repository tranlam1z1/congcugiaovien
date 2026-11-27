import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import { seoFor } from '@/core/seo';
import { Footer } from './Footer';
import { Header } from './Header';

/** Phím "/" đưa con trỏ vào ô tìm kiếm. */
function useSearchShortcut() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, select, [contenteditable="true"], dialog')) return;
      const input = document.querySelector<HTMLInputElement>('[data-search]');
      if (!input) return;
      event.preventDefault();
      input.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
}

/** Tiêu đề trang, vị trí cuộn và focus khi chuyển trang. */
function usePageChange() {
  const { pathname, hash, key } = useLocation();
  const main = useRef<HTMLElement>(null);
  const previousPath = useRef(pathname);

  useEffect(() => {
    const { title, description } = seoFor(pathname);
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  }, [pathname]);

  useEffect(() => {
    const changedPage = previousPath.current !== pathname;
    previousPath.current = pathname;
    if (changedPage) {
      if (!hash) window.scrollTo(0, 0);
      main.current?.focus({ preventScroll: true });
    }
    // Trang chủ tự cuộn tới lưới công cụ khi có bộ lọc.
    if (hash && !hash.includes('=')) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
    }
    // `key` để bấm lại cùng một liên kết neo vẫn cuộn tới.
  }, [pathname, hash, key]);

  return main;
}

export function Layout({ children }: { children: ReactNode }) {
  useSearchShortcut();
  const main = usePageChange();
  // Landing page có nền tràn hết chiều ngang.
  const fullWidth = useLocation().pathname === '/';
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#noi-dung"
        className="btn sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
        onClick={(event) => {
          event.preventDefault();
          main.current?.focus();
        }}
      >
        Bỏ qua tới nội dung
      </a>
      <Header />
      <main
        ref={main}
        id="noi-dung"
        tabIndex={-1}
        className={`flex-1 outline-none ${fullWidth ? '' : 'container-page py-6'}`}
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
