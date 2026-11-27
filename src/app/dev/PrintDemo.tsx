/**
 * Trang thử khung ToolLayout, in A4 và xuất PDF. Không phải công cụ trong registry,
 * không có trong bản build.
 */
import { FlaskConical } from 'lucide-react';
import { useMemo } from 'react';
import { FontFields, HeaderFields, SheetCountFields } from '@/components/CommonOptionFields';
import { COMMON_DEFAULTS, sheetNames } from '@/components/commonOptions';
import { NumberField, SelectField } from '@/components/fields';
import { ToolLayout } from '@/components/ToolLayout';
import { A4Page } from '@/core/print/A4Page';
import { AnswerKeyPage } from '@/core/print/AnswerKeyPage';
import { A4, DEFAULT_MARGIN_MM, paginate, type Orientation } from '@/core/print/paper';
import { SheetHeader } from '@/core/print/SheetHeader';
import { createRng, deriveSeed } from '@/core/rng';
import { useToolOptions } from '@/core/storage/useToolOptions';
import type { ToolMeta } from '@/core/types';

const TOOL: ToolMeta = {
  slug: 'khung-thu',
  name: 'Trang thử khung in',
  description: 'Kiểm tra xem trước, in A4 và xuất PDF.',
  icon: FlaskConical,
  group: 'tien-ich',
  grades: [1],
  subjects: ['chung'],
  mode: 'both',
  keywords: [],
  phase: 1,
  access: 'guest',
};

const DEFAULTS = {
  ...COMMON_DEFAULTS,
  orientation: 'portrait' as Orientation,
  count: 12,
};

const DEFAULT_TITLE = 'Phiếu thử: Đường đi của chữ Ế, Ỡ, Ự';

/** Lưới ô ly 5 mm, đường đậm mỗi 4 ô, để đo bằng thước sau khi in. */
function Grid({ width, height }: { width: number; height: number }) {
  const lines = [];
  for (let x = 0; x <= width; x += 5) {
    lines.push(
      <line key={`x${x}`} x1={x} y1={0} x2={x} y2={height} strokeWidth={x % 20 ? 0.1 : 0.3} />,
    );
  }
  for (let y = 0; y <= height; y += 5) {
    lines.push(
      <line key={`y${y}`} x1={0} y1={y} x2={width} y2={y} strokeWidth={y % 20 ? 0.1 : 0.3} />,
    );
  }
  return (
    <svg
      width={`${width}mm`}
      height={`${height}mm`}
      viewBox={`0 0 ${width} ${height}`}
      style={{ overflow: 'visible', margin: '5mm auto 0' }}
    >
      <g stroke="#4b7bb5">{lines}</g>
      <circle cx={10} cy={10} r={5} fill="none" stroke="#c0392b" strokeWidth={0.5} />
      <path d="M20 15 Q30 0 40 15 T60 15" fill="none" stroke="#000" strokeDasharray="2 1" />
      <text x={65} y={13} fontSize={6} fill="#000">
        Ô vuông 5 mm
      </text>
    </svg>
  );
}

export default function PrintDemo() {
  const [options, patch, reset] = useToolOptions(TOOL.slug, DEFAULTS);
  const students = sheetNames(options);
  const sheetCount = students.length;
  const title = options.title || DEFAULT_TITLE;

  const sheets = useMemo(
    () =>
      Array.from({ length: sheetCount }, (_, index) => {
        const rng = createRng(deriveSeed(options.seed, index));
        return Array.from({ length: options.count }, () => {
          const a = rng.int(10, 90);
          const b = rng.int(1, 9);
          return { text: `${a} + ${b} =`, answer: a + b };
        });
      }),
    [sheetCount, options.seed, options.count],
  );

  const paper = A4[options.orientation];

  return (
    <ToolLayout
      tool={TOOL}
      orientation={options.orientation}
      font={options.font}
      onReset={reset}
      seed={{ value: options.seed, onChange: (seed) => patch({ seed }) }}
      answerKey={{ checked: options.answerKey, onChange: (answerKey) => patch({ answerKey }) }}
      options={[
        {
          title: 'Đầu phiếu',
          content: (
            <>
              <HeaderFields value={options} onChange={patch} defaultTitle={DEFAULT_TITLE} />
              <FontFields value={options} onChange={patch} />
            </>
          ),
        },
        {
          title: 'Nội dung',
          content: (
            <>
              <SelectField
                label="Hướng giấy"
                value={options.orientation}
                onChange={(orientation) => patch({ orientation })}
                options={[
                  { value: 'portrait', label: 'A4 dọc' },
                  { value: 'landscape', label: 'A4 ngang' },
                ]}
              />
              <NumberField
                label="Số câu"
                value={options.count}
                min={2}
                max={20}
                onChange={(count) => patch({ count })}
              />
            </>
          ),
        },
        {
          title: 'Học sinh',
          content: <SheetCountFields value={options} onChange={patch} />,
        },
      ]}
      stage={<p>{title}</p>}
    >
      {sheets.map((questions, index) => (
        <A4Page key={index} large={options.largeText}>
          <SheetHeader
            title={title}
            school={options.school}
            showNameLine={options.showNameLine}
            studentName={students[index]}
          />
          <ol className="grid grid-cols-2 gap-x-[10mm] gap-y-[3mm]">
            {questions.map((q, i) => (
              <li key={i} className="flex gap-[2mm] rounded-[2mm] border border-black px-[3mm]">
                <b>Câu {i + 1}.</b>
                <span>{q.text}</span>
              </li>
            ))}
          </ol>
          {options.orientation === 'portrait' && !options.largeText && (
            <Grid width={paper.width - 2 * DEFAULT_MARGIN_MM - 6} height={80} />
          )}
        </A4Page>
      ))}
      {options.answerKey &&
        paginate(sheets.map((questions, index) => ({ questions, index })), 4).map(
          (group, page) => (
            <AnswerKeyPage key={`a${page}`} title={title} seed={options.seed}>
              {group.map(({ questions, index }) => (
                <section key={index} className="mb-[4mm]">
                  <h3 className="font-semibold">
                    Phiếu {index + 1}
                    {students[index] && ` · ${students[index]}`}
                  </h3>
                  <table className="w-full border-collapse text-center">
                    <tbody>
                      {paginate(questions, 5).map((row, r) => (
                        <tr key={r}>
                          {row.map((q, i) => (
                            <td key={i} className="w-1/5 border border-black">
                              {r * 5 + i + 1}) {q.answer}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>
              ))}
            </AnswerKeyPage>
          ),
        )}
    </ToolLayout>
  );
}
