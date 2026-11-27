import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router';
import { ToolGrid, ToolSection } from '@/components/ToolCard';
import { GRADES, GROUPS, isToolGroup } from '@/core/catalog';
import { getTool, TOOLS, toolsByGroup } from '@/core/registry';
import { usePinned, useRecent } from '@/core/storage/useShortcuts';
import type { ToolGroup, ToolMeta } from '@/core/types';
import { useIsClient } from '@/core/useMediaQuery';

const ALL = 'tat-ca';

const toTools = (slugs: string[]) =>
  slugs.map(getTool).filter((tool): tool is ToolMeta => tool !== undefined);

export function ToolExplorer() {
  const { hash, key } = useLocation();
  const isClient = useIsClient();
  const [pinned] = usePinned();
  const [recent] = useRecent();
  const section = useRef<HTMLElement>(null);

  // Bộ lọc nằm trên URL (#nhom=...); HTML dựng sẵn không có hash nên đợi hydrate xong.
  const requested = isClient ? new URLSearchParams(hash.slice(1)).get('nhom') : null;
  const selected: ToolGroup | typeof ALL =
    requested === ALL || (requested && isToolGroup(requested)) ? requested : GROUPS[0]!.id;
  const count = selected === ALL ? TOOLS.length : toolsByGroup(selected).length;

  useEffect(() => {
    if (hash.startsWith('#nhom=')) section.current?.scrollIntoView();
  }, [hash, key]);

  const chips = [
    ...GROUPS.map((group) => ({
      id: group.id,
      label: group.label,
    })),
    { id: ALL, label: 'Tất cả' },
  ];

  const fresh = TOOLS.filter((tool) => tool.isNew);
  const hasShortcuts = pinned.length > 0 || recent.length > 0 || fresh.length > 0;

  return (
    <>
      {hasShortcuts && (
        <div className="container-page section flex flex-col gap-10 pt-0">
          <ToolSection title="Đã ghim" tools={toTools(pinned)} />
          <ToolSection title="Dùng gần đây" tools={toTools(recent).slice(0, 4)} />
          <ToolSection title="Mới" tools={fresh} />
        </div>
      )}

      <section ref={section} id="cong-cu" className="section band scroll-mt-4">
        <div className="container-page flex flex-col gap-6">
          <div className="section-head">
            <p className="pill">{TOOLS.length} công cụ</p>
            <h2 className="heading-section">Khám phá {GROUPS.length} nhóm công cụ</h2>
            <p className="text-muted">Chọn một nhóm, hoặc mở trang công cụ theo lớp bạn dạy.</p>
          </div>

          <nav aria-label="Công cụ theo lớp">
            <ul className="flex flex-wrap justify-center gap-x-5">
              {GRADES.map((grade) => (
                <li key={grade.path}>
                  <Link to={grade.path} className="link">
                    {grade.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Lọc theo nhóm">
            <ul className="flex flex-wrap justify-center gap-2">
              {chips.map((chip) => (
                <li key={chip.id}>
                  <Link
                    to={`/#nhom=${chip.id}`}
                    replace
                    preventScrollReset
                    aria-current={chip.id === selected ? 'true' : undefined}
                    data-group={chip.id}
                    className="chip gap-2"
                  >
                    {chip.id !== ALL && <span aria-hidden className="dot" />}
                    {chip.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <p aria-live="polite" className="text-center text-muted">
            Đang hiện {count} công cụ
          </p>

          {/* Dựng đủ mọi thẻ để HTML tĩnh có liên kết tới cả kho; thẻ ngoài nhóm chỉ bị ẩn. */}
          <ToolGrid
            tools={TOOLS}
            isShown={(tool) => selected === ALL || tool.group === selected}
          />
        </div>
      </section>
    </>
  );
}
