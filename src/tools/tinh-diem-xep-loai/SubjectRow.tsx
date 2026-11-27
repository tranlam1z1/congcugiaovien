import { Trash2 } from 'lucide-react';
import { useId } from 'react';
import { resultText, type Mode, type Subject, type SubjectOutcome } from './state';

function Cell({
  label,
  value,
  onChange,
  invalid,
  describedBy,
  wide = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
  describedBy?: string;
  wide?: boolean;
  placeholder?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${wide ? 'col-span-2 sm:col-span-1 sm:flex-[2]' : 'sm:flex-1'}`}>
      <span className="text-muted">{label}</span>
      <input
        type="text"
        inputMode="decimal"
        autoComplete="off"
        className="input"
        placeholder={placeholder}
        value={value}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function SubjectRow({
  subject,
  index,
  mode,
  outcome,
  onChange,
  onRemove,
}: {
  subject: Subject;
  index: number;
  mode: Mode;
  outcome: SubjectOutcome;
  onChange: (patch: Partial<Subject>) => void;
  onRemove: () => void;
}) {
  const messageId = useId();
  const { result, error, warning } = outcome;
  const message = error ?? warning;
  const name = subject.name.trim() || `Môn ${index + 1}`;
  const scoreProps = { invalid: Boolean(error), describedBy: message ? messageId : undefined };

  return (
    <li
      aria-label={name}
      className="grid grid-cols-2 gap-3 rounded-xl border border-line bg-surface p-3 sm:flex sm:flex-wrap sm:items-end"
    >
      <label className="col-span-2 flex flex-col gap-1 sm:w-80">
        <span className="text-muted">Tên môn</span>
        <input
          type="text"
          className="input font-medium"
          value={subject.name}
          onChange={(event) => onChange({ name: event.target.value })}
        />
      </label>
      <label className="col-span-2 flex flex-col gap-1 sm:w-36">
        <span className="text-muted">Đánh giá</span>
        <select
          className="input"
          value={subject.kind}
          onChange={(event) => onChange({ kind: event.target.value as Subject['kind'] })}
        >
          <option value="score">Chấm điểm</option>
          <option value="comment">Nhận xét</option>
        </select>
      </label>

      <div className="col-span-2 grid grid-cols-2 gap-3 sm:flex sm:min-w-80 sm:flex-1">
        {subject.kind === 'comment' ? (
          <label className="col-span-2 flex flex-col gap-1 sm:w-40">
            <span className="text-muted">Kết quả</span>
            <select
              className="input"
              value={subject.passed ? 'pass' : 'fail'}
              onChange={(event) => onChange({ passed: event.target.value === 'pass' })}
            >
              <option value="pass">Đạt</option>
              <option value="fail">Chưa đạt</option>
            </select>
          </label>
        ) : mode === 'year' ? (
          <>
            <Cell
              label="TB học kỳ I"
              value={subject.first}
              onChange={(first) => onChange({ first })}
              {...scoreProps}
            />
            <Cell
              label="TB học kỳ II"
              value={subject.second}
              onChange={(second) => onChange({ second })}
              {...scoreProps}
            />
          </>
        ) : (
          <>
            <Cell
              wide
              label="Thường xuyên"
              placeholder="8 7,5 9"
              value={subject.regular}
              onChange={(regular) => onChange({ regular })}
              {...scoreProps}
            />
            <Cell
              label="Giữa kỳ"
              value={subject.midterm}
              onChange={(midterm) => onChange({ midterm })}
              {...scoreProps}
            />
            <Cell
              label="Cuối kỳ"
              value={subject.final}
              onChange={(final) => onChange({ final })}
              {...scoreProps}
            />
          </>
        )}
      </div>

      <div className="col-span-2 flex items-end justify-between gap-3 sm:ml-auto">
        <p className="flex min-w-24 flex-col">
          <span className="text-muted">
            {subject.kind === 'comment' ? 'Mức' : mode === 'year' ? 'ĐTBmcn' : 'ĐTBmhk'}
          </span>
          <output className="flex min-h-11 items-center text-xl font-bold">
            {result ? resultText(result) : '—'}
          </output>
        </p>
        <button
          type="button"
          className="btn btn-icon"
          aria-label={`Bớt môn ${name}`}
          title={`Bớt môn ${name}`}
          onClick={onRemove}
        >
          <Trash2 aria-hidden className="size-5" />
        </button>
      </div>

      {message && (
        <p
          id={messageId}
          role={error ? 'alert' : undefined}
          className={`col-span-2 w-full ${error ? 'font-medium text-accent' : 'text-muted'}`}
        >
          {message}
        </p>
      )}
    </li>
  );
}
