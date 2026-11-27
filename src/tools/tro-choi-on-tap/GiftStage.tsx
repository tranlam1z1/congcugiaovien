/** Hộp quà bí mật: bảng hộp, câu hỏi của hộp đang mở và bảng điểm các đội. */
import { Check, Eye, Gift, Minus, Plus, RotateCcw, Trophy, Undo2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { chime, unlockSound } from '@/core/present/sound';
import { usePresenterKeys } from '@/core/present/usePresenterKeys';
import { adjust, closeBox, finishBox, isOver, openBox, winners, type GiftGame } from './game';
import { QuestionView } from './QuestionView';
import type { Question } from './questions';
import type { Settings } from './options';

export function GiftStage({
  game,
  questions,
  settings,
  onChange,
  onRestart,
}: {
  game: GiftGame;
  questions: Question[];
  settings: Settings;
  onChange: (game: GiftGame) => void;
  onRestart: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => setRevealed(false), [game.current]);

  const box = game.current === null ? null : game.boxes[game.current]!;
  const question = box?.kind === 'question' ? questions[box.question] : undefined;
  const over = isOver(game);

  const sound = (good: boolean) => {
    if (!settings.sound) return;
    unlockSound();
    chime(good);
  };
  const open = (index: number) => {
    const next = openBox(game, index);
    const opened = next.boxes[index]!;
    if (opened.kind === 'surprise') sound(opened.delta > 0);
    onChange(next);
  };
  const judge = (correct: boolean) => {
    sound(correct);
    onChange(finishBox(game, correct, settings.points));
  };

  const { primary } = usePresenterKeys(
    () => {
      if (box?.kind === 'surprise') onChange(finishBox(game, false, 0));
      else if (question) setRevealed(true);
    },
    () => onChange(closeBox(game)),
  );

  return (
    <div className="flex w-full flex-col items-center gap-5">
      <ul aria-label="Bảng điểm" className="flex flex-wrap justify-center gap-3">
        {game.scores.map((score, team) => (
          <li
            key={team}
            data-team={team}
            className={`flex items-center gap-2 rounded-xl border-4 bg-surface p-2 ${
              team === game.turn && !over ? 'border-accent' : 'border-line'
            }`}
          >
            <button
              type="button"
              // Đang mở hộp thì không đổi lượt, nhưng điểm vẫn phải đọc rõ.
              className="btn flex-col gap-0 disabled:opacity-100!"
              aria-pressed={team === game.turn}
              aria-label={`${settings.teamNames[team]}: ${score} điểm. Chuyển lượt cho đội này`}
              disabled={game.current !== null}
              onClick={() => onChange({ ...game, turn: team })}
            >
              <span>{settings.teamNames[team]}</span>
              <b data-score className="text-[1.5em] tabular-nums">
                {score}
              </b>
            </button>
            <span className="flex flex-col gap-1">
              <button
                type="button"
                className="btn btn-icon"
                aria-label={`Cộng ${settings.points} điểm cho ${settings.teamNames[team]}`}
                onClick={() => onChange(adjust(game, team, settings.points))}
              >
                <Plus aria-hidden className="size-5" />
              </button>
              <button
                type="button"
                className="btn btn-icon"
                aria-label={`Trừ ${settings.points} điểm của ${settings.teamNames[team]}`}
                onClick={() => onChange(adjust(game, team, -settings.points))}
              >
                <Minus aria-hidden className="size-5" />
              </button>
            </span>
          </li>
        ))}
      </ul>

      {over ? (
        <div role="status" className="flex flex-col items-center gap-3">
          <Trophy aria-hidden className="size-[2em] text-accent" />
          <p className="text-[1.5em] font-bold">
            {winners(game.scores).length > 1 ? 'Đồng hạng nhất: ' : 'Chiến thắng: '}
            {winners(game.scores)
              .map((team) => settings.teamNames[team])
              .join(', ')}
          </p>
        </div>
      ) : box === null ? (
        <>
          <p className="font-bold">Lượt của {settings.teamNames[game.turn]}: chọn một hộp</p>
          <ul
            aria-label="Hộp quà"
            className="grid w-full max-w-[70rem] grid-cols-[repeat(auto-fill,minmax(2.75em,1fr))] gap-3"
          >
            {game.boxes.map((_, index) => {
              const done = game.opened.includes(index);
              return (
                <li key={index}>
                  <button
                    type="button"
                    className={`flex aspect-square w-full flex-col items-center justify-center rounded-xl border-4 font-bold ${
                      done ? 'border-line text-muted' : 'border-accent bg-surface text-ink'
                    }`}
                    aria-label={done ? `Hộp ${index + 1}, đã mở` : `Mở hộp ${index + 1}`}
                    disabled={done}
                    onClick={() => open(index)}
                  >
                    {done ? (
                      <Check aria-hidden className="size-[1em]" />
                    ) : (
                      <Gift aria-hidden className="size-[1.2em] text-accent" />
                    )}
                    {index + 1}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : box.kind === 'surprise' ? (
        <div className="flex flex-col items-center gap-4">
          <Gift aria-hidden className="size-[2.5em] text-accent" />
          <p role="status" className="text-[1.75em] font-bold">
            {box.delta > 0
              ? `May mắn! ${settings.teamNames[game.turn]} được cộng ${box.delta} điểm`
              : `Ôi! ${settings.teamNames[game.turn]} bị trừ ${-box.delta} điểm`}
          </p>
          <button
            ref={primary}
            type="button"
            className="btn btn-primary"
            onClick={() => onChange(finishBox(game, false, 0))}
          >
            Tiếp tục
          </button>
        </div>
      ) : (
        question && (
          <>
            <QuestionView question={question} revealed={revealed} />
            <div className="flex flex-wrap justify-center gap-3">
              <button
                ref={primary}
                type="button"
                className={`btn ${revealed ? '' : 'btn-primary'}`}
                disabled={revealed}
                onClick={() => setRevealed(true)}
              >
                <Eye aria-hidden className="size-[1.2em]" />
                Hiện đáp án
              </button>
              <button type="button" className="btn" onClick={() => judge(true)}>
                <Check aria-hidden className="size-[1.2em]" />
                Đúng (+{settings.points})
              </button>
              <button type="button" className="btn" onClick={() => judge(false)}>
                <X aria-hidden className="size-[1.2em]" />
                Sai
              </button>
              <button type="button" className="btn" onClick={() => onChange(closeBox(game))}>
                <Undo2 aria-hidden className="size-[1.2em]" />
                Đóng hộp
              </button>
            </div>
          </>
        )
      )}

      <button
        type="button"
        className="btn"
        onClick={() =>
          (over || window.confirm('Bỏ điểm hiện tại và bắt đầu ván mới?')) && onRestart()
        }
      >
        <RotateCcw aria-hidden className="size-[1.2em]" />
        Ván mới
      </button>
    </div>
  );
}
