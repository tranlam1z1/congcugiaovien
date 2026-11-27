import { Link } from 'react-router';
import { ToolSection } from '@/components/ToolCard';
import { GRADES, GROUPS, SUBJECTS } from '@/core/catalog';
import { toolsByGrade } from '@/core/registry';
import type { Grade } from '@/core/types';

export function GradePage({ grade }: { grade: Grade }) {
  const current = GRADES.find((g) => g.id === grade)!;
  const tools = toolsByGrade(grade);

  // Tiểu học xếp theo môn chính; cấp 2–3 xếp theo nhóm việc (đề, quản lý lớp, PDF...).
  const sections =
    grade === 'thcs-thpt'
      ? GROUPS.map((group) => ({
          title: group.label,
          tools: tools.filter((t) => t.group === group.id),
        }))
      : SUBJECTS.map((subject) => ({
          title: subject.label,
          tools: tools.filter((t) => t.subjects[0] === subject.id),
        }));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="heading-1">Công cụ cho {current.label}</h1>
        <nav aria-label="Chọn lớp">
          <ul className="flex flex-wrap gap-2">
            {GRADES.map((g) => (
              <li key={g.path}>
                <Link to={g.path} aria-current={g.id === grade ? 'page' : undefined} className="chip">
                  {g.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-muted">{tools.length} công cụ</p>
      </div>
      {sections.map((section) => (
        <ToolSection key={section.title} {...section} />
      ))}
    </div>
  );
}
