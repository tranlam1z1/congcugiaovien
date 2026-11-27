import { Lock, Presentation, Printer } from 'lucide-react';
import { Link } from 'react-router';
import { ENFORCE_ACCESS } from '@/core/access';
import { formatGrades } from '@/core/catalog';
import { isReady } from '@/core/registry';
import type { ToolMeta } from '@/core/types';
import { PinButton } from './PinButton';

export function ToolCard({ tool }: { tool: ToolMeta }) {
  const Icon = tool.icon;
  return (
    <article className="card relative flex h-full flex-col gap-2 p-4 transition-transform focus-within:border-accent hover:-translate-y-0.5 hover:border-accent">
      <div className="flex items-start justify-between gap-2">
        <span data-group={tool.group} className="tint size-12">
          <Icon aria-hidden className="size-6" />
        </span>
        {/* Đứng trên vùng bấm của liên kết phủ cả thẻ. */}
        <PinButton tool={tool} className="relative z-10 -mt-2 -mr-2 border-transparent" />
      </div>
      <h3 className="font-semibold leading-snug">
        <Link to={`/${tool.slug}`} className="after:absolute after:inset-0 after:rounded-xl">
          {tool.name}
        </Link>
      </h3>
      <p className="text-muted">{tool.description}</p>
      <ul className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        {tool.isNew && <li className="badge border-accent bg-accent text-on-accent">Mới</li>}
        {!isReady(tool.slug) && <li className="badge border-dashed">Sắp có</li>}
        {ENFORCE_ACCESS && tool.access !== 'guest' && (
          <li className="badge">
            <Lock aria-hidden className="size-4" />
            {tool.access === 'pro' ? 'Pro' : 'Free'}
          </li>
        )}
        {formatGrades(tool.grades).map((label) => (
          <li key={label} className="badge">
            {label}
          </li>
        ))}
        <li className="ml-auto flex gap-2 text-muted">
          {(tool.mode === 'print' || tool.mode === 'both') && (
            <span title="In">
              <Printer aria-hidden className="size-5" />
              <span className="sr-only">In</span>
            </span>
          )}
          {(tool.mode === 'present' || tool.mode === 'both') && (
            <span title="Trình chiếu">
              <Presentation aria-hidden className="size-5" />
              <span className="sr-only">Trình chiếu</span>
            </span>
          )}
        </li>
      </ul>
    </article>
  );
}

export function ToolGrid({
  tools,
  isShown,
}: {
  tools: ToolMeta[];
  /** Ẩn thẻ nhưng vẫn giữ trong HTML. */
  isShown?: (tool: ToolMeta) => boolean;
}) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {tools.map((tool) => (
        <li key={tool.slug} hidden={isShown && !isShown(tool)}>
          <ToolCard tool={tool} />
        </li>
      ))}
    </ul>
  );
}

export function ToolSection({ title, tools }: { title: string; tools: ToolMeta[] }) {
  if (tools.length === 0) return null;
  return (
    <section className="flex flex-col gap-4">
      <h2 className="heading-2">{title}</h2>
      <ToolGrid tools={tools} />
    </section>
  );
}
