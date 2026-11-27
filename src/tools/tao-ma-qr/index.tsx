import { Image, Shapes } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ToolLayout } from '@/components/ToolLayout';
import { A4Page } from '@/core/print/A4Page';
import { getPrintFont } from '@/core/print/fonts';
import { paginate } from '@/core/print/paper';
import { useToolOptions } from '@/core/storage/useToolOptions';
import type { ToolMeta } from '@/core/types';
import { downloadPng, downloadSvg } from './download';
import { ContentFields, LookFields, PrintFields } from './OptionFields';
import { cellLayout, DEFAULTS, GRIDS, TITLE_MM, truncate } from './options';
import {
  buildContent,
  colorWarning,
  createMatrix,
  parseBulk,
  type Level,
  type Matrix,
} from './qr';
import { QrCode, type Look } from './QrCode';

type Code = { label: string; matrix: Matrix };

export default function TaoMaQr({ tool }: { tool: ToolMeta }) {
  const [options, patch, reset] = useToolOptions(tool.slug, DEFAULTS);
  const [downloadError, setDownloadError] = useState('');
  const bulk = options.mode === 'bulk';
  const level: Level = options.logo ? 'H' : options.level;
  const perPage = GRIDS[options.perPage] ? options.perPage : 1;

  const { codes, notice } = useMemo(() => {
    if (bulk) {
      const { entries, dropped } = parseBulk(options.bulk);
      const codes: Code[] = [];
      for (const { label, value } of entries) {
        const matrix = createMatrix(value, level);
        if (matrix) codes.push({ label, matrix });
      }
      const skipped = dropped + entries.length - codes.length;
      return {
        codes,
        notice: !entries.length
          ? 'Nhập ít nhất một dòng để tạo mã.'
          : `${codes.length} mã.${skipped ? ` Bỏ qua ${skipped} dòng (trống, quá dài hoặc vượt giới hạn).` : ''}`,
      };
    }
    const content = buildContent(options.type, options);
    if (content.value === null) return { codes: [], notice: content.error };
    const matrix = createMatrix(content.value, level);
    if (!matrix) {
      return {
        codes: [],
        notice: 'Nội dung dài quá sức chứa của mã QR. Rút ngắn hoặc hạ mức sửa lỗi.',
      };
    }
    const code = { label: options.label.trim(), matrix };
    return { codes: Array<Code>(perPage).fill(code), notice: '' };
  }, [bulk, level, perPage, options]);

  const look: Look = {
    foreground: options.foreground,
    background: options.background,
    logo: options.logo,
  };
  const font = getPrintFont(options.font);
  const title = options.title.trim();
  const layout = cellLayout(perPage, Boolean(title), options.largeText, font.digitWidth);
  const single = !bulk ? codes[0] : undefined;

  const download = async (kind: 'png' | 'svg') => {
    setDownloadError('');
    try {
      if (kind === 'svg') downloadSvg(single!.matrix, look, 'ma-qr');
      else await downloadPng(single!.matrix, look, 'ma-qr');
    } catch (cause) {
      console.error(cause);
      setDownloadError('Chưa tạo được file. Bỏ logo hoặc thử lại.');
    }
  };

  return (
    <ToolLayout
      tool={tool}
      font={options.font}
      onReset={reset}
      options={[
        {
          title: 'Nội dung',
          content: <ContentFields options={options} onChange={patch} notice={notice} />,
        },
        {
          title: 'In trên giấy',
          content: <PrintFields options={options} onChange={patch} />,
        },
        {
          title: 'Màu, logo, sửa lỗi',
          content: (
            <LookFields
              options={options}
              onChange={patch}
              warning={colorWarning(options.foreground, options.background)}
            />
          ),
        },
      ]}
      actions={
        single ? (
          <>
            <button type="button" className="btn" onClick={() => download('png')}>
              <Image aria-hidden className="size-5" />
              Tải PNG
            </button>
            <button type="button" className="btn" onClick={() => download('svg')}>
              <Shapes aria-hidden className="size-5" />
              Tải SVG
            </button>
            {downloadError && <p role="alert">{downloadError}</p>}
          </>
        ) : undefined
      }
    >
      {paginate(codes, perPage).map((group, page) => (
        <A4Page key={page} large={options.largeText}>
          {title && (
            <h2
              className="text-center text-[18pt] font-bold"
              style={{ height: `${TITLE_MM}mm` }}
            >
              {truncate(title, 60)}
            </h2>
          )}
          <ul
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${layout.columns}, ${layout.width}mm)`,
              gridAutoRows: `${layout.height}mm`,
            }}
          >
            {group.map((code, i) => (
              <li
                key={i}
                data-item
                className={`flex flex-col items-center justify-center gap-[1mm] ${
                  options.cutLines && perPage > 1 ? 'border border-dashed border-black/40' : ''
                }`}
              >
                <QrCode matrix={code.matrix} size={layout.qr} look={look} />
                {code.label && (
                  <p
                    className="w-full px-[2mm] text-center break-words"
                    style={{
                      maxHeight: `${layout.labelMm}mm`,
                      fontSize: `${layout.fontPt}pt`,
                      lineHeight: 1.4 * (font.leading ?? 1) > 1.5 ? 1.5 : 1.4,
                    }}
                  >
                    {truncate(code.label, layout.maxChars)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </A4Page>
      ))}
    </ToolLayout>
  );
}
