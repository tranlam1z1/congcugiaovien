import { ChevronDown, Moon, NotebookPen, Sun } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router';
import { SearchBox } from '@/components/SearchBox';
import { GRADES, GROUPS } from '@/core/catalog';
import { SITE } from '@/core/site';

function Menu({ label, children }: { label: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const location = useLocation();

  // Đóng khi chuyển trang.
  useEffect(() => setOpen(false), [location.key]);

  return (
    <div
      className="sm:relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && open) {
          setOpen(false);
          button.current?.focus();
        }
      }}
    >
      <button
        ref={button}
        type="button"
        className="btn gap-1 border-transparent bg-transparent px-2 sm:px-3"
        aria-expanded={open}
        onClick={(event) => {
          // Safari không tự focus nút khi bấm, cần cho onBlur.
          event.currentTarget.focus();
          setOpen(!open);
        }}
      >
        {label}
        <ChevronDown aria-hidden className="size-5" />
      </button>
      <ul
        hidden={!open}
        className="absolute inset-x-4 z-40 mt-1 rounded-xl border border-line bg-surface py-1 shadow-lg sm:inset-x-auto sm:right-0 sm:w-72"
      >
        {children}
      </ul>
    </div>
  );
}

const MenuLink = ({ to, children }: { to: string; children: ReactNode }) => (
  <li>
    <Link to={to} className="flex min-h-11 items-center px-4 hover:bg-hover">
      {children}
    </Link>
  </li>
);

function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try {
      localStorage.setItem('kcc:theme', JSON.stringify(next));
    } catch {
      // Trình duyệt chặn lưu: vẫn đổi được trong phiên này.
    }
  };
  return (
    <button
      type="button"
      className="btn btn-icon border-transparent bg-transparent"
      aria-label="Đổi giao diện sáng hoặc tối"
      title="Đổi giao diện sáng hoặc tối"
      onClick={toggle}
    >
      <Moon aria-hidden className="size-5 dark:hidden" />
      <Sun aria-hidden className="hidden size-5 dark:block" />
    </button>
  );
}

const SECTIONS = [
  { to: '/#tinh-nang', label: 'Tính năng' },
  { to: '/#cong-cu', label: 'Công cụ' },
  { to: '/#bang-gia', label: 'Bảng giá' },
  { to: '/#hoi-dap', label: 'Hỏi đáp' },
];

export function Header() {
  const { pathname } = useLocation();
  return (
    <header className="border-b border-line bg-surface">
      <div className="container-page relative flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
        <Link to="/" className="flex min-h-11 items-center gap-2 font-bold">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-on-accent">
            <NotebookPen aria-hidden className="size-5" />
          </span>
          <span className="max-sm:sr-only">{SITE.name}</span>
        </Link>
        {pathname === '/' && (
          <nav aria-label="Trên trang này" className="mx-auto hidden lg:block">
            <ul className="flex gap-5">
              {SECTIONS.map((section) => (
                <li key={section.to}>
                  <Link
                    to={section.to}
                    className="flex min-h-11 items-center font-medium text-muted hover:text-accent"
                  >
                    {section.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
        {/* Trang chủ đã có ô tìm lớn ngay dưới. */}
        {pathname !== '/' && (
          <div className="order-last w-full lg:order-none lg:w-auto lg:flex-1">
            <SearchBox variant="header" />
          </div>
        )}
        <nav aria-label="Chính" className="ml-auto flex items-center gap-1">
          <Menu label="Lớp">
            {GRADES.map((grade) => (
              <MenuLink key={grade.path} to={grade.path}>
                {grade.label}
              </MenuLink>
            ))}
          </Menu>
          <Menu
            label={
              <span>
                Nhóm<span className="max-sm:sr-only"> công cụ</span>
              </span>
            }
          >
            {GROUPS.map((group) => (
              <MenuLink key={group.id} to={`/#nhom=${group.id}`}>
                {group.label}
              </MenuLink>
            ))}
          </Menu>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
