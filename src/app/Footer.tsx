import { Link } from 'react-router';
import { SITE } from '@/core/site';

const COLUMNS = [
  {
    title: 'Nền tảng',
    links: [
      { to: '/#tinh-nang', label: 'Tính năng' },
      { to: '/#cong-cu', label: 'Kho công cụ' },
      { to: '/#bang-gia', label: 'Bảng giá' },
      { to: '/#hoi-dap', label: 'Hỏi đáp' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { to: '/gioi-thieu', label: 'Giới thiệu' },
      { to: '/gioi-thieu#gop-y', label: 'Góp ý' },
      { to: '/quyen-rieng-tu', label: 'Quyền riêng tư' },
    ],
  },
];

export function Footer() {
  const link = 'flex min-h-11 items-center hover:underline';
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page flex flex-col gap-6 py-8">
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr]">
          <div className="flex max-w-md flex-col gap-2 sm:col-span-2 md:col-span-1">
            <p className="text-lg font-bold">{SITE.name}</p>
            <p className="text-muted">{SITE.description}</p>
            {SITE.contactEmail && (
              <a href={`mailto:${SITE.contactEmail}`} className={link}>
                {SITE.contactEmail}
              </a>
            )}
          </div>
          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="font-semibold">{column.title}</p>
              <ul>
                {column.links.map((item) => (
                  <li key={item.to}>
                    <Link to={item.to} className={link}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="border-t border-line pt-4 text-muted">© 2026 {SITE.name}</p>
      </div>
    </footer>
  );
}
