import { Pin, PinOff } from 'lucide-react';
import { usePinned } from '@/core/storage/useShortcuts';
import type { ToolMeta } from '@/core/types';

export function PinButton({ tool, className = '' }: { tool: ToolMeta; className?: string }) {
  const [pinned, toggle] = usePinned();
  const isPinned = pinned.includes(tool.slug);
  const Icon = isPinned ? PinOff : Pin;
  const label = `${isPinned ? 'Bỏ ghim' : 'Ghim'} ${tool.name}`;
  return (
    <button
      type="button"
      className={`btn btn-icon ${isPinned ? 'text-accent' : 'text-muted'} ${className}`}
      aria-label={label}
      title={label}
      onClick={() => toggle(tool.slug)}
    >
      <Icon aria-hidden className="size-5" />
    </button>
  );
}
