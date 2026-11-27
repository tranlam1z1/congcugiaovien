/** Rung chuông vàng: hỏi từng câu, đếm ngược, lật đáp án và loại bạn trả lời sai. */
import { Bell, ChevronLeft, ChevronRight, Eye, RotateCcw, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatTime } from '@/core/present/timer';
import { useCountdown } from '@/core/present/useCountdown';
import { usePresenterKeys } from '@/core/present/usePresenterKeys';
import { toggleOut, type BellGame } from './game';
import { QuestionView } from './QuestionView';
import type { Question } from './questions';
import type { Settings } from './options';

export function BellStage({
  game,
  questions,
  students,
  settings,
  onChange,
  onRestart,
}: {
  game: BellGame;
  questions: Question[];
  /** `key` phân biệt hai em trùng tên. */
  students: { key: string; name: string }[];
  settings: Settings;
  onChange: (game: BellGame) => void;
  onRestart: () => void;
}) {
  const index = Math.min(game.index, questions.length - 1);
  const question = questions[index]!;
  const [revealed, setRevealed] = useState(false);
  const countdown = useCountdown(settings.seconds, settings.sound);
  const { reset } = countdown;

  // Sang câu khác thì giấu đáp án và đặt lại đồng hồ.
  useEffect(() => {
    setRevealed(false);
    reset();
  }, [index, settings.seconds, game.signature, reset]);

  const go = (step: number) =>
    onChange({ ...game, index: Math.min(questions.length - 1, Math.max(0, index + step)) });
  const reveal = () => {
    reset();
    setRevealed(true);
  };

  const { presenting, primary } = usePresenterKeys(
    () => {
      if (revealed) go(1);
      else if (countdown.status === 'idle') countdown.startPause();
      else reveal();
    },
    () => go(-1),
  );
  const left = students.filter((s) => !game.out.includes(s.key)).length;

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <p className="font-bold">
        Câu {index + 1}/{questions.length}
        {students.length > 0 && ` · Còn ${left}/${students.length} bạn`}
      </p>
      <p
        role="timer"
        aria-label="Thời gian còn lại"
        className={`text-[2.5em] font-bold leading-none tabular-nums ${
          countdown.status === 'done' ? 'text-accent' : ''
        }`}
      >
        {formatTime(countdown.seconds)}
      </p>
      <p role="status" className="min-h-[1.5em] font-bold">
        {countdown.status === 'done' && !revealed ? 'Hết giờ! Giơ bảng.' : ''}
      </p>
      <QuestionView question={question} revealed={revealed} />
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" className="btn" disabled={index === 0} onClick={() => go(-1)}>
          <ChevronLeft aria-hidden className="size-[1.2em]" />
          Câu trước
        </button>
        <button
          ref={presenting ? primary : undefined}
          type="button"
          className="btn"
          disabled={revealed}
          onClick={countdown.startPause}
        >
          <Bell aria-hidden className="size-[1.2em]" />
          {countdown.status === 'running'
            ? 'Tạm dừng'
            : countdown.status === 'paused'
              ? 'Đếm tiếp'
              : 'Bắt đầu đếm'}
        </button>
        <button type="button" className="btn btn-primary" disabled={revealed} onClick={reveal}>
          <Eye aria-hidden className="size-[1.2em]" />
          Hiện đáp án
        </button>
        <button
          type="button"
          className="btn"
          disabled={index === questions.length - 1}
          onClick={() => go(1)}
        >
          Câu tiếp
          <ChevronRight aria-hidden className="size-[1.2em]" />
        </button>
      </div>

      {students.length === 0 ? (
        <p className="text-muted">
          Thêm học sinh ở mục “Danh sách lớp” để bấm loại bạn trả lời sai.
        </p>
      ) : (
        <>
          <p className="text-muted">Bấm tên bạn trả lời sai để loại, bấm lần nữa để cho vào lại.</p>
          <ul aria-label="Học sinh" className="flex flex-wrap justify-center gap-2">
            {students.map((student) => {
              const out = game.out.includes(student.key);
              return (
                <li key={student.key}>
                  <button
                    type="button"
                    className={`btn ${out ? 'border-dashed text-muted line-through' : 'border-accent'}`}
                    aria-pressed={out}
                    onClick={() => onChange(toggleOut(game, student.key))}
                  >
                    {student.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        {game.out.length > 0 && (
          <button type="button" className="btn" onClick={() => onChange({ ...game, out: [] })}>
            <Users aria-hidden className="size-[1.2em]" />
            Cứu trợ: cho tất cả vào lại
          </button>
        )}
        <button
          type="button"
          className="btn"
          onClick={() => window.confirm('Chơi lại từ câu đầu với đủ cả lớp?') && onRestart()}
        >
          <RotateCcw aria-hidden className="size-[1.2em]" />
          Chơi lại
        </button>
      </div>
    </div>
  );
}
