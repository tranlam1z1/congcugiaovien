import { useMemo } from 'react';
import { ClassListPanel } from '@/components/ClassListPanel';
import { ToolLayout } from '@/components/ToolLayout';
import { activeClass, parseStudents } from '@/core/classes/model';
import { useClassStore } from '@/core/classes/useClassStore';
import { randomSeed } from '@/core/rng';
import { useLocalState } from '@/core/storage/useLocalState';
import { useToolOptions } from '@/core/storage/useToolOptions';
import type { ToolMeta } from '@/core/types';
import { BellStage } from './BellStage';
import { newBellGame, newGiftGame, type BellGame, type GiftGame } from './game';
import { GiftStage } from './GiftStage';
import { BellFields, GiftFields, QuestionFields, SoundFields } from './OptionFields';
import { DEFAULTS, resolve, TABS } from './options';
import { parseQuestions } from './questions';

const NO_GAMES: { gift: GiftGame | null; bell: BellGame | null } = { gift: null, bell: null };

export default function TroChoiOnTap({ tool }: { tool: ToolMeta }) {
  const [options, patch, reset] = useToolOptions(tool.slug, DEFAULTS);
  const settings = resolve(options);
  const parsed = useMemo(() => parseQuestions(options.text), [options.text]);
  const { questions } = parsed;
  // Ván đang chơi được nhớ để lỡ tải lại trang không mất điểm.
  const [games, setGames, resetGames] = useLocalState(`tool:${tool.slug}:van`, NO_GAMES);

  const classes = useClassStore();
  const current = activeClass(classes.store);
  const students = useMemo(() => {
    const seen = new Map<string, number>();
    return parseStudents(current.text).map(({ name }) => {
      const occurrence = seen.get(name) ?? 0;
      seen.set(name, occurrence + 1);
      return { key: `${current.id}|${name}|${occurrence}`, name };
    });
  }, [current.id, current.text]);

  const content = JSON.stringify(questions);
  const giftSignature = `${content}|${settings.teams}|${settings.surprises}|${settings.seed}`;
  const gift =
    games.gift?.signature === giftSignature
      ? games.gift
      : newGiftGame(
          giftSignature,
          questions.length,
          settings.surprises,
          settings.teams,
          settings.seed,
        );
  const bell = games.bell?.signature === content ? games.bell : newBellGame(content);
  const ready = questions.length > 0;

  const props = { options, settings, onChange: patch };

  return (
    <ToolLayout
      tool={tool}
      onReset={() => {
        if (!window.confirm('Đưa cài đặt và bộ câu hỏi về mặc định, bỏ ván đang chơi?')) return;
        reset();
        resetGames();
      }}
      options={[
        {
          title: 'Câu hỏi',
          content: (
            <QuestionFields
              options={options}
              onChange={patch}
              count={questions.length}
              total={parsed.total}
              errors={parsed.errors}
            />
          ),
        },
        settings.tab === 'hop-qua'
          ? { title: 'Hộp quà bí mật', content: <GiftFields {...props} /> }
          : {
              title: 'Rung chuông vàng',
              content: (
                <>
                  <BellFields {...props} />
                  <ClassListPanel classes={classes} />
                </>
              ),
            },
        { title: 'Âm thanh', content: <SoundFields {...props} /> },
      ]}
      stage={
        <div className="flex w-full flex-col items-center gap-5 [.stage-full_&]:pt-20">
          <div role="group" aria-label="Chọn trò chơi" className="flex flex-wrap justify-center gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className="toggle rounded-full px-4 [.stage-full_&]:text-[1.25rem]"
                aria-pressed={settings.tab === tab.id}
                onClick={() => patch({ tab: tab.id })}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {!ready ? (
            <p role="status">Nhập câu hỏi ở mục “Câu hỏi” để bắt đầu.</p>
          ) : settings.tab === 'hop-qua' ? (
            <GiftStage
              game={gift}
              questions={questions}
              settings={settings}
              onChange={(next) => setGames({ ...games, gift: next })}
              onRestart={() => patch({ seed: randomSeed() })}
            />
          ) : (
            <BellStage
              game={bell}
              questions={questions}
              students={students}
              settings={settings}
              onChange={(next) => setGames({ ...games, bell: next })}
              onRestart={() => setGames({ ...games, bell: newBellGame(content) })}
            />
          )}
        </div>
      }
    />
  );
}
