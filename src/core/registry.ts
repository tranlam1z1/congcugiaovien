/**
 * Danh sách công cụ, tự gom từ `src/tools/<slug>/`.
 * Thêm công cụ mới = thêm thư mục có `meta.ts`; thêm `index.tsx` là công cụ chạy được.
 * Không phải sửa trang chủ, menu hay router.
 */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import { GROUPS } from './catalog';
import type { Grade, ToolGroup, ToolMeta } from './types';

export type ToolComponent = ComponentType<{ tool: ToolMeta }>;

const metaModules = import.meta.glob<ToolMeta>('../tools/*/meta.ts', {
  eager: true,
  import: 'default',
});

// Mỗi công cụ thành một bundle riêng.
const componentModules = import.meta.glob<{ default: ToolComponent }>('../tools/*/index.tsx');

const groupOrder = new Map(GROUPS.map((g, i) => [g.id, i]));

export const TOOLS: ToolMeta[] = Object.values(metaModules).sort(
  (a, b) =>
    groupOrder.get(a.group)! - groupOrder.get(b.group)! ||
    a.phase - b.phase ||
    a.name.localeCompare(b.name, 'vi'),
);

const bySlug = new Map(TOOLS.map((t) => [t.slug, t]));

const components = new Map<string, LazyExoticComponent<ToolComponent>>(
  Object.entries(componentModules).map(([path, load]) => [path.split('/').at(-2)!, lazy(load)]),
);

export const getTool = (slug: string) => bySlug.get(slug);

export const getToolComponent = (slug: string) => components.get(slug);

export const isReady = (slug: string) => components.has(slug);

export const toolsByGrade = (grade: Grade) => TOOLS.filter((t) => t.grades.includes(grade));

export const toolsByGroup = (group: ToolGroup) => TOOLS.filter((t) => t.group === group);

/** Công cụ liên quan: ưu tiên cùng nhóm, rồi trùng môn và lớp. */
export function relatedTools(tool: ToolMeta, limit = 4): ToolMeta[] {
  const score = (other: ToolMeta) =>
    (other.group === tool.group ? 10 : 0) +
    other.subjects.filter((s) => s !== 'chung' && tool.subjects.includes(s)).length * 3 +
    other.grades.filter((g) => tool.grades.includes(g)).length +
    (isReady(other.slug) ? 20 : 0);
  return TOOLS.filter((t) => t.slug !== tool.slug)
    .map((t) => ({ t, s: score(t) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map(({ t }) => t);
}
