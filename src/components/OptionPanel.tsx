import { ChevronDown, RotateCcw } from 'lucide-react';
import type { ReactNode } from 'react';

export type OptionGroup = {
  title: string;
  content: ReactNode;
};

/** Nhóm tùy chọn gấp mở được, mở sẵn hai nhóm đầu; "Về mặc định" luôn ở cuối. */
export function OptionPanel({ groups, onReset }: { groups: OptionGroup[]; onReset: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      {groups.map((group, index) => (
        <details
          key={group.title}
          open={index < 2}
          className="group rounded-xl border border-line bg-surface"
        >
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 font-semibold">
            {group.title}
            <ChevronDown aria-hidden className="size-5 shrink-0 group-open:rotate-180" />
          </summary>
          <div className="flex flex-col gap-4 px-4 pb-4">{group.content}</div>
        </details>
      ))}
      <button type="button" className="btn" onClick={onReset}>
        <RotateCcw aria-hidden className="size-5" />
        Về mặc định
      </button>
    </div>
  );
}
