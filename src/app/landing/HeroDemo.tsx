import { ArrowRight, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { randomSeed } from '@/core/rng';
import { DEMO_OPS, demoQuestions, type DemoGrade, type DemoOp } from './demoSheet';

const GRADE_CHOICES: DemoGrade[] = [1, 2, 3];
const OP_NAMES: Record<DemoOp, string> = { '+': 'Cộng', '−': 'Trừ', '×': 'Nhân', ':': 'Chia' };

export function HeroDemo() {
  const [grade, setGrade] = useState<DemoGrade>(1);
  const [ops, setOps] = useState<DemoOp[]>(['+', '−']);
  // Seed đầu cố định để HTML dựng sẵn khớp khi hydrate.
  const [seed, setSeed] = useState(202618);

  const chooseGrade = (next: DemoGrade) => {
    setGrade(next);
    setOps(next === 3 ? DEMO_OPS : ['+', '−']);
  };

  // Luôn giữ ít nhất một phép tính.
  const toggleOp = (op: DemoOp) => {
    if (!ops.includes(op)) setOps([...ops, op]);
    else if (ops.length > 1) setOps(ops.filter((o) => o !== op));
  };

  return (
    <div id="phieu-mau" className="card scroll-mt-4 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-subtle px-4 py-2">
        <h2 className="font-semibold">Dùng thử: Phiếu toán</h2>
        <button type="button" className="btn" onClick={() => setSeed(randomSeed())}>
          <RefreshCw aria-hidden className="size-4" />
          Đổi bộ khác
        </button>
      </div>

      <div className="grid sm:grid-cols-[13rem_1fr]">
        <div className="flex flex-col gap-4 border-b border-line p-4 sm:border-r sm:border-b-0">
          <fieldset>
            <legend className="mb-1 font-semibold">Khối lớp</legend>
            <div className="grid grid-cols-3 gap-1">
              {GRADE_CHOICES.map((g) => (
                <button
                  key={g}
                  type="button"
                  className="toggle"
                  aria-pressed={g === grade}
                  aria-label={`Khối ${g}`}
                  onClick={() => chooseGrade(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-1 font-semibold">Phép tính</legend>
            <div className="grid grid-cols-4 gap-1">
              {DEMO_OPS.map((op) => (
                <button
                  key={op}
                  type="button"
                  className="toggle"
                  aria-pressed={ops.includes(op)}
                  aria-label={OP_NAMES[op]}
                  onClick={() => toggleOp(op)}
                >
                  {op}
                </button>
              ))}
            </div>
          </fieldset>

          <p className="text-muted">
            Mã đề: <span className="font-semibold text-ink tabular-nums">{seed}</span>
          </p>

          <Link to="/phieu-toan" className="link mt-auto gap-1">
            Mở công cụ Phiếu toán
            <ArrowRight aria-hidden className="size-4 shrink-0" />
          </Link>
        </div>

        <div className="flex items-center justify-center bg-subtle p-4">
          {/* Tờ phiếu luôn nền trắng chữ đen như bản in, kể cả giao diện tối. */}
          <div className="w-full max-w-sm rounded-md border border-stone-200 bg-white p-4 text-stone-900 shadow-lg">
            <div className="mb-3 border-b-2 border-stone-800 pb-2">
              <p className="text-right text-xs font-bold">TOÁN LỚP {grade}</p>
              <p className="text-center text-sm font-bold">PHIẾU LUYỆN TẬP TOÁN</p>
              <p className="mt-2 flex justify-between gap-2 text-xs">
                <span>Họ và tên: ........................</span>
                <span>Lớp: ......</span>
              </p>
            </div>
            <p className="mb-2 text-xs font-bold">Bài 1. Tính:</p>
            <ol className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm font-semibold tabular-nums">
              {demoQuestions(seed, grade, ops).map((question) => (
                <li key={question}>{question} .......</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
