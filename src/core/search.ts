import { groupLabel, subjectLabel } from './catalog';
import type { Grade, ToolMeta } from './types';
import { toWords } from './vi/normalize';

const gradeWords = (grade: Grade) =>
  grade === 'thcs-thpt' ? 'thcs thpt cap 2 cap 3' : `lop ${grade}`;

type Entry = {
  tool: ToolMeta;
  name: string;
  keywords: string;
  other: string;
};

const cache = new WeakMap<ToolMeta, Entry>();

function entryOf(tool: ToolMeta): Entry {
  let entry = cache.get(tool);
  if (!entry) {
    // Bọc khoảng trắng hai đầu để khớp theo đầu từ bằng includes(" tu").
    const wrap = (parts: string[]) => ` ${toWords(parts.join(' ')).join(' ')} `;
    entry = {
      tool,
      name: wrap([tool.name]),
      keywords: wrap(tool.keywords),
      other: wrap([
        tool.slug,
        groupLabel(tool.group),
        ...tool.subjects.map(subjectLabel),
        ...tool.grades.map(gradeWords),
      ]),
    };
    cache.set(tool, entry);
  }
  return entry;
}

/** Số phải khớp trọn ("1" không khớp "10"), chữ khớp theo đầu từ. */
const hasWord = (haystack: string, word: string) =>
  haystack.includes(/^\d+$/.test(word) ? ` ${word} ` : ` ${word}`);

/**
 * Tìm không phân biệt dấu, hoa thường; mọi từ gõ vào đều phải khớp.
 * Khớp ở tên xếp trước khớp ở từ khóa, rồi đến nhóm, môn, lớp.
 */
export function searchTools(tools: ToolMeta[], query: string): ToolMeta[] {
  const words = toWords(query);
  if (words.length === 0) return [];
  const phrase = ` ${words.join(' ')}`;

  const results: { tool: ToolMeta; score: number }[] = [];
  for (const tool of tools) {
    const { name, keywords, other } = entryOf(tool);
    let score = name.includes(phrase) ? 20 : keywords.includes(phrase) ? 10 : 0;
    const matched = words.every((word) => {
      const points = hasWord(name, word)
        ? 4
        : hasWord(keywords, word)
          ? 2
          : hasWord(other, word)
            ? 1
            : 0;
      score += points;
      return points > 0;
    });
    if (matched) results.push({ tool, score });
  }
  return results.sort((a, b) => b.score - a.score).map((r) => r.tool);
}
