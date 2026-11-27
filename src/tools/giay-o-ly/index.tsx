import { useMemo } from 'react';
import { ToolLayout } from '@/components/ToolLayout';
import { useToolOptions } from '@/core/storage/useToolOptions';
import type { ToolMeta } from '@/core/types';
import { DEFAULTS, resolve } from './options';
import {
  DecorationFields,
  HeaderFields,
  LineFields,
  PageFields,
  TypeFields,
} from './OptionFields';
import { PaperPage, useLogo } from './PaperPage';
import { drawPaper, redMarginX } from './papers';

export default function GiayOLy({ tool }: { tool: ToolMeta }) {
  const [options, patch, reset] = useToolOptions(tool.slug, DEFAULTS);
  const settings = resolve(options);
  const logo = useLogo(options.logo, options.logoRotate);

  const drawing = useMemo(() => {
    const { type, area, size, major, columns, width, height, margin } = resolve(options);
    const result = drawPaper(type, area, { size, major, columns });
    if (options.redMargin) {
      const x = redMarginX(type, area, width, size);
      result.segments.push({
        stroke: 'margin',
        dashed: false,
        x1: x,
        y1: margin,
        x2: x,
        y2: height - margin,
      });
    }
    return result;
  }, [options]);

  const props = { options, settings, onChange: patch };

  return (
    <ToolLayout
      tool={tool}
      paper={settings.paper}
      orientation={settings.orientation}
      onReset={reset}
      options={[
        { title: 'Loại giấy', content: <TypeFields {...props} /> },
        { title: 'Khổ giấy và số trang', content: <PageFields {...props} /> },
        { title: 'Màu và nét', content: <LineFields {...props} /> },
        { title: 'Đầu phiếu', content: <HeaderFields {...props} /> },
        { title: 'Chữ chìm và logo', content: <DecorationFields {...props} /> },
      ]}
    >
      {Array.from({ length: settings.pages }, (_, index) => (
        <PaperPage
          key={index}
          drawing={drawing}
          settings={settings}
          options={options}
          logo={logo}
        />
      ))}
    </ToolLayout>
  );
}
