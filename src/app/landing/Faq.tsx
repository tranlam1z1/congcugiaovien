import { ChevronDown } from 'lucide-react';
import { HOME_FAQ } from '@/core/homeFaq';

export function Faq() {
  return (
    <section id="hoi-dap" aria-labelledby="hoi-dap-title" className="section">
      <div className="container-page flex max-w-3xl flex-col gap-8">
        <div className="section-head">
          <h2 id="hoi-dap-title" className="heading-section">
            Câu hỏi thường gặp
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          {HOME_FAQ.map((item, index) => (
            <details key={item.question} open={index === 0} className="card group overflow-hidden">
              <summary className="flex min-h-14 list-none items-center justify-between gap-4 px-5 py-3 font-semibold [&::-webkit-details-marker]:hidden">
                {item.question}
                <ChevronDown
                  aria-hidden
                  className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="border-t border-line px-5 py-4 text-muted">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
