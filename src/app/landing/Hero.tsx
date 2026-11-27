import { ArrowRight, CircleCheck, FileCheck2, Sparkles } from 'lucide-react';
import { Link } from 'react-router';
import { SearchBox } from '@/components/SearchBox';
import { TOOLS } from '@/core/registry';
import { HeroDemo } from './HeroDemo';

const PROMISES = [
  'Không cần cài phần mềm',
  'In và tải PDF khổ A4',
  'Không gửi tên học sinh đi đâu',
];

export function Hero() {
  return (
    <section className="hero-bg border-b border-line py-10 lg:py-16">
      <div className="container-page grid items-center gap-10 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col items-start gap-5">
          <p className="pill">
            <Sparkles aria-hidden className="size-4 shrink-0" />
            Theo chương trình GDPT 2018 · Chạy trên trình duyệt
          </p>
          <h1 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
            Tạo phiếu bài tập, đề thi và thẻ in A4 trong dưới 1 phút
          </h1>
          <p className="text-lg text-muted">
            {TOOLS.length} công cụ sinh phiếu, trộn đề, tập viết ô ly và trò chơi trình chiếu. Tên
            học sinh và tài liệu không rời khỏi máy bạn.
          </p>
          <SearchBox variant="hero" />
          <div className="flex flex-wrap gap-3">
            <Link to="/#cong-cu" className="btn btn-primary min-h-12 px-6">
              Mở kho {TOOLS.length} công cụ
              <ArrowRight aria-hidden className="size-5" />
            </Link>
            <Link to="/#phieu-mau" className="btn min-h-12 px-6">
              <FileCheck2 aria-hidden className="size-5" />
              Xem thử phiếu mẫu
            </Link>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-muted">
            {PROMISES.map((promise) => (
              <li key={promise} className="flex items-center gap-2">
                <CircleCheck aria-hidden className="size-5 shrink-0 text-accent" />
                {promise}
              </li>
            ))}
          </ul>
        </div>

        <div className="min-w-0">
          <HeroDemo />
        </div>
      </div>
    </section>
  );
}
