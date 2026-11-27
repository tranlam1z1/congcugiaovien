/** Màn hình trình chiếu: chữ lớn, đổi nhóm bằng nút, phím Space hoặc bút trình chiếu. */
import { RefreshCw, Star } from 'lucide-react';
import { useEffect } from 'react';
import { usePresenting } from '@/components/PresentStage';
import type { Student } from '@/core/classes/model';
import type { Group } from './group';

/** Bút trình chiếu thường gửi PageDown hoặc mũi tên phải. */
const NEXT_KEYS = ['ArrowRight', 'PageDown', ' '];

export function Stage({
  title,
  groups,
  students,
  onShuffle,
}: {
  title: string;
  groups: Group[];
  students: Student[];
  onShuffle: () => void;
}) {
  const presenting = usePresenting();

  useEffect(() => {
    if (!presenting) return;
    const onKey = (event: KeyboardEvent) => {
      if (!NEXT_KEYS.includes(event.key) || event.repeat) return;
      // Space trên nút đang focus là bấm nút đó.
      if (event.key === ' ' && (event.target as HTMLElement).closest('button')) return;
      event.preventDefault();
      onShuffle();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [presenting, onShuffle]);

  return (
    <div className="flex w-full flex-col items-center gap-6 pt-20">
      <button type="button" className="btn absolute top-3 left-3" onClick={onShuffle}>
        <RefreshCw aria-hidden className="size-[1.2em]" />
        Đổi bộ khác
      </button>
      <h2 className="font-bold">{title}</h2>
      <ul className="grid w-full grid-cols-[repeat(auto-fit,minmax(9em,1fr))] gap-4 text-left">
        {groups.map((group, index) => (
          <li key={index} className="rounded-xl border-2 border-accent bg-surface p-3">
            <h3 className="border-b border-line text-center font-bold text-accent">{group.name}</h3>
            <ul>
              {group.members.map((member) => (
                <li key={member} className="flex items-center gap-2">
                  {member === group.leader && (
                    <Star aria-label="Nhóm trưởng" className="size-[0.8em] shrink-0 text-accent" />
                  )}
                  <span className={member === group.leader ? 'font-bold' : ''}>
                    {students[member]!.name}
                  </span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
