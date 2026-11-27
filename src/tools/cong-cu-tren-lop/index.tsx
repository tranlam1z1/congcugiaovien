import { useCallback } from 'react';
import { ClassListPanel } from '@/components/ClassListPanel';
import type { OptionGroup } from '@/components/OptionPanel';
import { ToolLayout } from '@/components/ToolLayout';
import { activeClass, parseStudents } from '@/core/classes/model';
import { useClassStore } from '@/core/classes/useClassStore';
import { useToolOptions } from '@/core/storage/useToolOptions';
import type { ToolMeta } from '@/core/types';
import { CountdownPanel } from './CountdownPanel';
import { DrawPanel } from './DrawPanel';
import { formatTime, keepKnown } from './logic';
import { NoisePanel } from './NoisePanel';
import { DrawFields, SensitivityField, TimeFields } from './OptionFields';
import { DEFAULTS, drawItems, MAX_HISTORY, TAB_NAMES, TABS, toOptions } from './options';
import { useCountdown } from './useCountdown';
import { WheelPanel } from './WheelPanel';

export default function CongCuTrenLop({ tool }: { tool: ToolMeta }) {
  const [stored, patch, reset] = useToolOptions(tool.slug, DEFAULTS);
  const options = toOptions(stored);
  const { tab } = options;
  const classes = useClassStore();
  const current = activeClass(classes.store);
  const names = parseStudents(current.text).map((s) => s.name);
  const classKey = String(current.id);
  const called = keepKnown(names, options.called[classKey] ?? [], true);
  const items = drawItems(options);
  const drawn = keepKnown(items, options.drawn, options.once);
  const countdown = useCountdown(options.minutes * 60 + options.seconds, options.sound);

  const resetAll = useCallback(() => {
    countdown.reset();
    reset();
  }, [countdown.reset, reset]);

  const groups: Record<typeof tab, OptionGroup[]> = {
    'vong-quay': [{ title: 'Danh sách lớp', content: <ClassListPanel classes={classes} /> }],
    'dem-nguoc': [
      { title: 'Đếm ngược', content: <TimeFields options={options} onChange={patch} /> },
    ],
    'tieng-on': [
      { title: 'Đo tiếng ồn', content: <SensitivityField options={options} onChange={patch} /> },
    ],
    'boc-tham': [{ title: 'Bốc thăm', content: <DrawFields options={options} onChange={patch} /> }],
  };

  // Đồng hồ vẫn chạy khi đang ở công cụ khác.
  const timerBadge =
    tab !== 'dem-nguoc' && countdown.status !== 'idle'
      ? countdown.status === 'done'
        ? ' · Hết giờ'
        : ` · ${formatTime(countdown.seconds)}`
      : '';

  return (
    <ToolLayout
      tool={tool}
      onReset={resetAll}
      options={groups[tab]}
      stage={
        <div className="flex w-full flex-col items-center gap-6 [.stage-full_&]:pt-20">
          <div role="group" aria-label="Chọn công cụ" className="flex flex-wrap justify-center gap-2">
            {TABS.map((id) => (
              <button
                key={id}
                type="button"
                className="toggle rounded-full px-4 [.stage-full_&]:text-[1.25rem]"
                aria-pressed={tab === id}
                onClick={() => patch({ tab: id })}
              >
                {TAB_NAMES[id]}
                {id === 'dem-nguoc' && timerBadge}
              </button>
            ))}
          </div>

          {tab === 'vong-quay' &&
            (classes.loaded ? (
              <WheelPanel
                key={classKey}
                names={names}
                called={called}
                sound={options.sound}
                onCalled={(name) =>
                  patch({ called: { ...options.called, [classKey]: [...called, name] } })
                }
                onRestart={() => patch({ called: { ...options.called, [classKey]: [] } })}
              />
            ) : (
              <p role="status">Đang mở danh sách lớp…</p>
            ))}
          {tab === 'dem-nguoc' && (
            <CountdownPanel
              countdown={countdown}
              minutes={options.minutes}
              seconds={options.seconds}
              onPreset={(minutes) => {
                countdown.reset();
                patch({ minutes, seconds: 0 });
              }}
            />
          )}
          {tab === 'tieng-on' && <NoisePanel sensitivity={options.sensitivity} />}
          {tab === 'boc-tham' && (
            <DrawPanel
              items={items}
              drawn={drawn}
              once={options.once}
              onDraw={(picked) => patch({ drawn: [...drawn, ...picked].slice(-MAX_HISTORY) })}
              onRestart={() => patch({ drawn: [] })}
            />
          )}
        </div>
      }
    />
  );
}
