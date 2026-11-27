import { useCallback, useMemo } from 'react';
import { ClassListPanel } from '@/components/ClassListPanel';
import { ToolLayout } from '@/components/ToolLayout';
import { activeClass, parseStudents } from '@/core/classes/model';
import { useClassStore } from '@/core/classes/useClassStore';
import { getPrintFont } from '@/core/print/fonts';
import { A4, type Orientation } from '@/core/print/paper';
import { randomSeed } from '@/core/rng';
import { useToolOptions } from '@/core/storage/useToolOptions';
import type { ToolMeta } from '@/core/types';
import { groupCount, makeGroups, parsePairs } from './group';
import { columnsFor } from './layout';
import { DEFAULTS } from './options';
import { LayoutFields, NameFields, RuleFields, SplitFields } from './OptionFields';
import { GroupPages } from './Pages';
import { Stage } from './Stage';

export default function ChiaNhom({ tool }: { tool: ToolMeta }) {
  const [options, patch, reset] = useToolOptions(tool.slug, DEFAULTS);
  const classes = useClassStore();
  const current = activeClass(classes.store);
  const students = useMemo(() => parseStudents(current.text), [current.text]);

  const { pairs, unknown } = useMemo(
    () => parsePairs(options.avoid, students),
    [options.avoid, students],
  );
  const by = options.by === 'size' ? 'size' : 'groups';
  const value = by === 'size' ? options.groupSize : options.groupTotal;
  const result = useMemo(
    () =>
      makeGroups(
        students,
        {
          by,
          value,
          balance: options.balance,
          pickLeader: options.pickLeader,
          avoid: pairs,
          names: options.names.split(/\r?\n/),
        },
        options.seed,
      ),
    [students, by, value, options.balance, options.pickLeader, pairs, options.names, options.seed],
  );

  const orientation: Orientation = options.orientation === 'landscape' ? 'landscape' : 'portrait';
  const page = A4[orientation];
  const style = { font: getPrintFont(options.font), large: options.largeText };
  const longest = Math.max(
    10,
    ...students.map((s) => s.name.length + (options.pickLeader ? 5 : 0)),
  );
  const columns = columnsFor(longest, page, style);
  const defaultTitle = current.name.trim() ? `Chia nhóm · ${current.name.trim()}` : 'Chia nhóm';
  const title = options.title.trim() || defaultTitle;
  const shuffle = useCallback(() => patch({ seed: randomSeed() }), [patch]);

  const problem = !classes.loaded
    ? ''
    : students.length === 0
      ? 'Chưa có học sinh. Dán danh sách ở mục “Danh sách lớp”.'
      : result.violations.length
        ? `Không tách được hết: ${result.violations
            .map(([a, b]) => `${students[a]!.name} và ${students[b]!.name}`)
            .join('; ')} vẫn chung nhóm. Thử tăng số nhóm, bớt cặp hoặc tắt cân bằng nam nữ.`
        : '';

  return (
    <ToolLayout
      tool={tool}
      font={options.font}
      orientation={orientation}
      onReset={reset}
      seed={{ value: options.seed, onChange: (seed) => patch({ seed }) }}
      options={[
        { title: 'Danh sách lớp', content: <ClassListPanel classes={classes} /> },
        {
          title: 'Cách chia',
          content: (
            <SplitFields
              options={options}
              onChange={patch}
              students={students.length}
              groups={groupCount(students.length, by, value)}
            />
          ),
        },
        {
          title: 'Ràng buộc và nhóm trưởng',
          content: (
            <RuleFields
              options={options}
              onChange={patch}
              hasGender={students.some((s) => s.gender)}
              unknown={unknown}
            />
          ),
        },
        { title: 'Tên nhóm', content: <NameFields options={options} onChange={patch} /> },
        {
          title: 'Bản in',
          content: (
            <LayoutFields options={options} onChange={patch} defaultTitle={defaultTitle} />
          ),
        },
      ]}
      actions={
        problem ? (
          <p role="status" className="basis-full font-medium text-accent">
            {problem}
          </p>
        ) : undefined
      }
      stage={
        <Stage title={title} groups={result.groups} students={students} onShuffle={shuffle} />
      }
    >
      {result.groups.length > 0 && (
        <GroupPages
          groups={result.groups}
          students={students}
          columns={columns}
          page={page}
          style={style}
          title={title}
          school={options.school}
        />
      )}
    </ToolLayout>
  );
}
