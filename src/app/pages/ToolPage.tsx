import { Component, memo, Suspense, useEffect, type ReactNode } from 'react';
import { useParams } from 'react-router';
import { PinButton } from '@/components/PinButton';
import { ToolGrid } from '@/components/ToolCard';
import { getTool, getToolComponent, relatedTools } from '@/core/registry';
import { useRecent } from '@/core/storage/useShortcuts';
import type { ToolMeta } from '@/core/types';
import { NotFound } from './NotFound';

export function ToolPage() {
  const { slug = '' } = useParams();
  const tool = getTool(slug);
  return tool ? <ToolView key={tool.slug} tool={tool} /> : <NotFound />;
}

function ToolView({ tool }: { tool: ToolMeta }) {
  const Tool = getToolComponent(tool.slug);
  const [, record] = useRecent();

  useEffect(() => record(tool.slug), [tool.slug, record]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="heading-1">{tool.name}</h1>
            <p className="text-muted">{tool.description}</p>
          </div>
          <PinButton tool={tool} />
        </div>
        {Tool ? (
          <LoadedTool tool={tool} Tool={Tool} />
        ) : (
          <div className="rounded-xl border border-dashed border-line bg-surface p-6">
            <h2 className="font-semibold">Công cụ này đang được làm</h2>
            <p className="text-muted">
              Thuộc giai đoạn {tool.phase}. Bạn ghim lại để mở nhanh khi công cụ sẵn sàng.
            </p>
          </div>
        )}
      </div>

      {tool.guide && (
        <section className="flex max-w-3xl flex-col gap-2">
          <h2 className="heading-2">Cách dùng</h2>
          <ol className="list-decimal pl-6">
            {tool.guide.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      )}

      {tool.faq && (
        <section className="flex max-w-3xl flex-col gap-3">
          <h2 className="heading-2">Câu hỏi thường gặp</h2>
          {tool.faq.map((item) => (
            <div key={item.question}>
              <h3 className="font-semibold">{item.question}</h3>
              <p>{item.answer}</p>
            </div>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="heading-2">Công cụ liên quan</h2>
        <ToolGrid tools={relatedTools(tool)} />
      </section>
    </div>
  );
}

/**
 * Đứng yên khi trang cha vẽ lại (vd ghi "Dùng gần đây"): cập nhật vào vùng Suspense
 * đang hydrate sẽ làm React bỏ HTML dựng sẵn và báo lỗi.
 */
const LoadedTool = memo(function LoadedTool({
  tool,
  Tool,
}: {
  tool: ToolMeta;
  Tool: NonNullable<ReturnType<typeof getToolComponent>>;
}) {
  return (
    <ToolErrorBoundary>
      <Suspense fallback={<p role="status">Đang mở công cụ…</p>}>
        <Tool tool={tool} />
      </Suspense>
    </ToolErrorBoundary>
  );
});

/** Thường gặp khi mất mạng hoặc web vừa cập nhật làm mất file cũ. */
class ToolErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="rounded-xl border-2 border-accent bg-surface p-6">
        <h2 className="font-semibold">Công cụ chưa mở được</h2>
        <p className="mb-3">Kiểm tra mạng rồi tải lại trang. Tùy chọn đã lưu vẫn còn.</p>
        <button type="button" className="btn btn-primary" onClick={() => location.reload()}>
          Tải lại trang
        </button>
      </div>
    );
  }
}
