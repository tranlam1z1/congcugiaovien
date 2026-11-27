import { Copy, Plus, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useToolOptions } from '@/core/storage/useToolOptions';
import type { ToolMeta } from '@/core/types';
import { LEVELS } from './calc';
import {
  DEFAULT_STATE,
  MAX_SUBJECTS,
  newSubject,
  summarize,
  TEMPLATES,
  templateSubjects,
  toClipboardText,
  toState,
  type Mode,
  type Subject,
} from './state';
import { SubjectRow } from './SubjectRow';

const MODES: { value: Mode; label: string }[] = [
  { value: 'semester', label: 'Điểm học kỳ' },
  { value: 'year', label: 'Điểm cả năm' },
];

const hasInput = (subjects: Subject[]) =>
  subjects.some(
    (s) => s.regular || s.midterm || s.final || s.first || s.second || !s.passed,
  );

export default function TinhDiemXepLoai({ tool }: { tool: ToolMeta }) {
  const [stored, patch, reset] = useToolOptions(tool.slug, DEFAULT_STATE);
  const state = toState(stored);
  const { mode, subjects } = state;
  const summary = summarize(state);
  const { classification, missing } = summary;

  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const fallback = useRef<HTMLTextAreaElement>(null);
  const clipboardText = toClipboardText(state, summary);
  // Sửa điểm thì thông báo "đã chép" không còn đúng.
  useEffect(() => setCopyStatus('idle'), [clipboardText]);
  useEffect(() => {
    if (copyStatus === 'failed') fallback.current?.select();
  }, [copyStatus]);

  const setSubjects = (next: Subject[]) => patch({ subjects: next });

  const confirmDiscard = () =>
    !hasInput(subjects) || window.confirm('Xoá toàn bộ điểm đã nhập trên máy này?');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(clipboardText);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  };

  const scores = summary.outcomes.flatMap((o) =>
    o.result?.kind === 'score' ? [o.result.average] : [],
  );
  const scoreSubjects = subjects.filter((s) => s.kind === 'score').length;

  return (
    <div className="flex flex-col gap-5">
      <p className="rounded-xl border-2 border-accent bg-surface p-3">
        Kết quả <strong>chỉ để tham khảo</strong>. Xếp loại chính thức theo sổ điểm của nhà trường.
        Điểm bạn nhập chỉ lưu trên máy này.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Chế độ tính" className="flex gap-2">
          {MODES.map((item) => (
            <button
              key={item.value}
              type="button"
              className="chip aria-pressed:border-2 aria-pressed:border-accent aria-pressed:font-semibold aria-pressed:text-accent"
              aria-pressed={mode === item.value}
              onClick={() => patch({ mode: item.value })}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 sm:ml-auto">
          {(['thcs', 'thpt'] as const).map((key) => (
            <button
              key={key}
              type="button"
              className="btn"
              onClick={() => confirmDiscard() && setSubjects(templateSubjects(key))}
            >
              {TEMPLATES[key].label}
            </button>
          ))}
          <button type="button" className="btn" onClick={() => confirmDiscard() && reset()}>
            <RotateCcw aria-hidden className="size-5" />
            Về mặc định
          </button>
        </div>
      </div>

      <p className="text-muted">
        Điểm thập phân viết dấu phẩy. Nhiều điểm thường xuyên cách nhau bằng dấu cách.
      </p>

      <ul className="flex flex-col gap-3">
        {subjects.map((subject, index) => (
          <SubjectRow
            key={subject.id}
            subject={subject}
            index={index}
            mode={mode}
            outcome={summary.outcomes[index]!}
            onChange={(change) =>
              setSubjects(subjects.map((s) => (s.id === subject.id ? { ...s, ...change } : s)))
            }
            onRemove={() => setSubjects(subjects.filter((s) => s.id !== subject.id))}
          />
        ))}
      </ul>

      <button
        type="button"
        className="btn self-start"
        disabled={subjects.length >= MAX_SUBJECTS}
        onClick={() =>
          setSubjects([...subjects, newSubject(Math.max(0, ...subjects.map((s) => s.id)) + 1, '')])
        }
      >
        <Plus aria-hidden className="size-5" />
        Thêm môn
      </button>

      <section aria-label="Kết quả" className="card flex flex-col gap-3 p-4">
        <p role="status" className="text-2xl font-bold">
          {classification
            ? `Gợi ý xếp loại: ${LEVELS[classification.level]}`
            : subjects.length === 0
              ? 'Thêm môn để bắt đầu.'
              : `Còn ${missing} môn chưa đủ điểm`}
        </p>
        {classification?.adjustedFor && (
          <p>
            Theo mức điểm thì là <strong>{LEVELS[classification.base]}</strong>, nhưng chỉ vướng môn{' '}
            <strong>{classification.adjustedFor}</strong> nên được nâng một mức (khoản 3 Điều 9).
          </p>
        )}
        {scores.length > 0 && (
          <p className="text-muted">
            Số môn chấm điểm từ 8,0: {scores.filter((s) => s >= 80).length} · từ 6,5:{' '}
            {scores.filter((s) => s >= 65).length} · từ 5,0: {scores.filter((s) => s >= 50).length}
          </p>
        )}
        {subjects.length > 0 && scoreSubjects < 6 && (
          <p>
            Mới có {scoreSubjects} môn chấm điểm. Các mức Tốt, Khá, Đạt đều cần ít nhất 6 môn.
          </p>
        )}
        <button type="button" className="btn btn-primary self-start" onClick={copy}>
          <Copy aria-hidden className="size-5" />
          Chép kết quả
        </button>
        <p role="status">
          {copyStatus === 'copied' && 'Đã chép. Dán vào Zalo, Word hoặc Excel.'}
          {copyStatus === 'failed' &&
            'Trình duyệt không cho chép tự động. Nội dung đã được bôi đen bên dưới, nhấn Ctrl+C.'}
        </p>
        {copyStatus === 'failed' && (
          <textarea
            ref={fallback}
            readOnly
            aria-label="Nội dung để chép"
            className="input"
            rows={8}
            value={clipboardText}
          />
        )}
      </section>
    </div>
  );
}
