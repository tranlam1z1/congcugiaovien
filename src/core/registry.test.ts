import { describe, expect, it } from 'vitest';
import { formatGrades, GRADES, GROUPS } from './catalog';
import { relatedTools, TOOLS, toolsByGrade } from './registry';
import { publicPaths, seoFor } from './seo';

const countBy = (keys: (string | number)[]) =>
  keys.reduce<Record<string, number>>(
    (out, key) => ({ ...out, [String(key)]: (out[String(key)] ?? 0) + 1 }),
    {},
  );

describe('registry', () => {
  it('có 60 công cụ, slug không trùng và khớp tên thư mục', () => {
    const modules = import.meta.glob<{ slug: string }>('../tools/*/meta.ts', {
      eager: true,
      import: 'default',
    });
    for (const [path, meta] of Object.entries(modules)) {
      expect(path.split('/').at(-2)).toBe(meta.slug);
    }
    expect(TOOLS).toHaveLength(60);
    expect(new Set(TOOLS.map((t) => t.slug)).size).toBe(60);
  });

  it('khớp số lượng theo nhóm, giai đoạn và mức truy cập trong PRD', () => {
    expect(GROUPS.map((g) => TOOLS.filter((t) => t.group === g.id).length)).toEqual([
      15, 4, 9, 5, 9, 9, 4, 5,
    ]);
    expect(countBy(TOOLS.map((t) => t.phase))).toEqual({ 1: 15, 2: 22, 3: 20, 4: 3 });
    expect(countBy(TOOLS.map((t) => t.access))).toEqual({ guest: 10, free: 15, pro: 35 });
  });

  it('mỗi công cụ đủ lớp, môn, từ khóa; mỗi lớp có công cụ', () => {
    for (const tool of TOOLS) {
      expect(tool.grades.length, tool.slug).toBeGreaterThan(0);
      expect(tool.subjects.length, tool.slug).toBeGreaterThan(0);
      expect(tool.keywords.length, tool.slug).toBeGreaterThan(0);
    }
    for (const grade of GRADES) expect(toolsByGrade(grade.id).length).toBeGreaterThan(0);
  });

  it('gợi ý 4 công cụ liên quan, không gồm chính nó', () => {
    for (const tool of TOOLS) {
      const related = relatedTools(tool);
      expect(related).toHaveLength(4);
      expect(related).not.toContain(tool);
    }
  });

  it('mỗi đường dẫn công khai có tiêu đề riêng', () => {
    const titles = publicPaths().map((path) => seoFor(path).title);
    expect(new Set(titles).size).toBe(titles.length);
    expect(seoFor('/khong-co').noindex).toBe(true);
  });

  it('gom nhãn lớp liền nhau', () => {
    expect(formatGrades([3, 1, 2])).toEqual(['Lớp 1–3']);
    expect(formatGrades([1, 3, 4, 'thcs-thpt'])).toEqual(['Lớp 1', 'Lớp 3–4', 'THCS/THPT']);
  });
});
