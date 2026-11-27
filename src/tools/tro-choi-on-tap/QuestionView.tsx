import { Check } from 'lucide-react';
import { answerText, type Question } from './questions';

/** Câu hỏi chữ lớn; `revealed` thì tô phương án đúng hoặc hiện đáp án. */
export function QuestionView({ question, revealed }: { question: Question; revealed: boolean }) {
  return (
    <div className="flex w-full max-w-[70rem] flex-col gap-4 [.stage-full_&]:max-w-[90vw]">
      <h2 className="text-[1.5em] font-bold leading-snug break-words">{question.text}</h2>
      {question.type === 'choice' ? (
        <ul className="grid gap-3 text-left sm:grid-cols-2">
          {question.options.map((option) => {
            const right = revealed && question.correct.includes(option.letter);
            return (
              <li
                key={option.letter}
                data-correct={right || undefined}
                className={`flex items-center gap-3 rounded-xl border-4 p-3 break-words ${
                  right
                    ? 'border-accent bg-accent text-on-accent'
                    : 'border-line bg-surface text-ink'
                }`}
              >
                <b>{option.letter}.</b>
                <span className="mr-auto">{option.text}</span>
                {right && <Check aria-label="Đúng" className="size-[1em] shrink-0" />}
              </li>
            );
          })}
        </ul>
      ) : (
        <p
          data-answer
          className={`rounded-xl border-4 p-4 font-bold break-words ${
            revealed ? 'border-accent bg-accent text-on-accent' : 'border-dashed border-line'
          }`}
        >
          {revealed ? answerText(question) : 'Đáp án đang được giấu'}
        </p>
      )}
    </div>
  );
}
