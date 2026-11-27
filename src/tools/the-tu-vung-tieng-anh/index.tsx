import { useMemo } from 'react';
import { CheckboxField, SelectField, TextAreaField } from '@/components/fields';
import { ToolLayout } from '@/components/ToolLayout';
import { useToolOptions } from '@/core/storage/useToolOptions';
import type { ToolMeta } from '@/core/types';
import { VOCAB } from '@/core/vocab/packs';
import { MAX_CARDS, parseCards, PER_PAGE, sheets, toText } from './cards';
import { CardPage } from './Pages';
import { DEFAULTS, FRONTS, resolve } from './options';
import { Stage } from './Stage';

export default function TheTuVungTiengAnh({ tool }: { tool: ToolMeta }) {
  const [options, patch, reset] = useToolOptions(tool.slug, DEFAULTS);
  const settings = resolve(options);
  const cards = useMemo(() => parseCards(options.text), [options.text]);
  const pages = useMemo(
    () => sheets(cards, settings.perPage, settings.backs),
    [cards, settings.perPage, settings.backs],
  );
  const pack = VOCAB.find((p) => toText(p.entries) === options.text)?.id ?? '';

  return (
    <ToolLayout
      tool={tool}
      onReset={reset}
      actions={
        cards.length === 0 ? (
          <p role="status">Nhập từ ở mục “Từ vựng” để tạo thẻ.</p>
        ) : cards.length === MAX_CARDS ? (
          <p role="status">Chỉ dùng {MAX_CARDS} từ đầu.</p>
        ) : undefined
      }
      options={[
        {
          title: 'Từ vựng',
          content: (
            <>
              <SelectField
                label="Chủ đề theo lớp"
                value={pack}
                options={[
                  { value: '', label: 'Chọn một chủ đề…' },
                  ...VOCAB.map((p) => ({ value: p.id, label: p.label })),
                ]}
                onChange={(id) => {
                  const chosen = VOCAB.find((p) => p.id === id);
                  if (chosen) patch({ text: toText(chosen.entries) });
                }}
              />
              <TextAreaField
                label="Danh sách thẻ (mỗi dòng một từ)"
                value={options.text}
                rows={10}
                hint="Dạng: từ | /phiên âm/ | nghĩa. Phiên âm và nghĩa có thể bỏ trống. Chọn chủ đề sẽ thay danh sách đang có."
                onChange={(text) => patch({ text })}
              />
            </>
          ),
        },
        {
          title: 'Thẻ',
          content: (
            <>
              <SelectField
                label="Mặt trước hiện"
                value={settings.front}
                options={FRONTS}
                onChange={(front) => patch({ front })}
              />
              <SelectField
                label="Số thẻ mỗi trang"
                value={String(settings.perPage)}
                options={Object.keys(PER_PAGE).map((n) => ({ value: n, label: `${n} thẻ` }))}
                onChange={(value) => patch({ perPage: Number(value) })}
              />
              <CheckboxField
                label="In kèm mặt sau (phiên âm, nghĩa)"
                checked={settings.backs}
                onChange={(backs) => patch({ backs })}
              />
              {settings.backs && (
                <p className="text-muted">
                  In hai mặt, chọn “Lật theo cạnh dài”. Trang chẵn là mặt sau của trang lẻ liền
                  trước.
                </p>
              )}
            </>
          ),
        },
        {
          title: 'Trình chiếu',
          content: (
            <CheckboxField
              label="Tự đọc từ khi hiện thẻ mới"
              checked={settings.autoSpeak}
              onChange={(autoSpeak) => patch({ autoSpeak })}
            />
          ),
        },
      ]}
      stage={<Stage cards={cards} front={settings.front} autoSpeak={settings.autoSpeak} />}
    >
      {pages.map((sheet, index) => (
        <CardPage key={index} sheet={sheet} perPage={settings.perPage} front={settings.front} />
      ))}
    </ToolLayout>
  );
}
