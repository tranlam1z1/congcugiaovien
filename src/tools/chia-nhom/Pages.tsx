import type { Student } from '@/core/classes/model';
import { A4Page } from '@/core/print/A4Page';
import { SheetHeader } from '@/core/print/SheetHeader';
import type { Group } from './group';
import { GAP_MM, layoutGroups, LINE_MM, type Page, type Style } from './layout';

export function GroupPages({
  groups,
  students,
  columns,
  page,
  style,
  title,
  school,
}: {
  groups: Group[];
  students: Student[];
  columns: number;
  page: Page;
  style: Style;
  title: string;
  school: string;
}) {
  const lineHeight = `${LINE_MM[style.large ? 1 : 0]! * (style.font.leading ?? 1)}mm`;
  return layoutGroups(groups, columns, page, style).map((rows, index) => (
    <A4Page key={index} large={style.large}>
      <SheetHeader
        title={index ? `${title} (tiếp theo)` : title}
        school={school}
        showNameLine={false}
      />
      {rows.map((row, r) => (
        <div
          key={r}
          className="grid items-start"
          style={{
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            columnGap: `${GAP_MM}mm`,
            marginBottom: `${GAP_MM}mm`,
          }}
        >
          {row.map((card) => (
            <section
              key={card.key}
              data-item
              className="rounded-[2mm] border border-black px-[3mm] py-[2mm]"
            >
              <h3 className="mb-[1mm] border-b border-black text-center font-bold">{card.title}</h3>
              <ol>
                {card.members.map((member, i) => (
                  <li key={member} className="flex whitespace-nowrap" style={{ height: lineHeight }}>
                    <span className="w-[2em] shrink-0">{card.start + i + 1}.</span>
                    {member === card.leader ? (
                      <b>{students[member]!.name} (NT)</b>
                    ) : (
                      <span>{students[member]!.name}</span>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      ))}
      {groups.some((g) => g.leader !== null) && (
        <p className="absolute bottom-[6mm] left-[12mm] text-[0.8em]">NT: nhóm trưởng</p>
      )}
    </A4Page>
  ));
}
