import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import fontkit from '@pdf-lib/fontkit';
import { describe, expect, it } from 'vitest';
import { parseStudents } from '@/core/classes/model';
import { createRng } from '@/core/rng';
import { ADVICE, BODIES, OPENINGS } from './bank';
import { toCsv, toTable } from './export';
import { composeComment, givenName, type CommentInput } from './generate';
import { COLUMNS, LINE_MM, paginateLines, wrappedLines } from './layout';
import {
  buildLines,
  DEFAULTS,
  FOCUSES,
  MAX_COMMENT,
  PRONOUNS,
  QUALITIES,
  resolve,
  rewritten,
  STUDIES,
  type Options,
} from './state';

const input: CommentInput = {
  name: 'Nguyễn Minh An',
  pronoun: 'em',
  focus: 'chung',
  subject: '',
  study: 'tot',
  quality: 'tot',
};

const allSentences = [
  ...Object.values(OPENINGS).flat(),
  ...Object.values(BODIES).flatMap((f) => Object.values(f).flat()),
  ...Object.values(ADVICE).flat(),
];

describe('kho câu', () => {
  it('mỗi câu viết hoa đầu câu, có dấu kết câu, không trùng, không so sánh', () => {
    for (const sentence of allSentences) {
      expect(sentence).toMatch(/^(\{X\}|\p{Lu})/u);
      expect(sentence).toMatch(/[.!]$/);
      expect(sentence).not.toMatch(/hơn (các )?bạn|nhất lớp|kém/i);
    }
    expect(new Set(allSentences).size).toBe(allSentences.length);
  });

  it('mọi tổ hợp đủ câu để viết lại ra khác', () => {
    for (const list of [
      ...Object.values(OPENINGS),
      ...Object.values(ADVICE),
      ...Object.values(BODIES).flatMap((f) => Object.values(f)),
    ]) {
      expect(list.length).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('ghép lời nhận xét', () => {
  it('1.000 lần mỗi tổ hợp: không sót chỗ trống, không quá dài', () => {
    for (const pronoun of PRONOUNS) {
      for (const focus of FOCUSES) {
        for (const study of STUDIES) {
          for (const quality of QUALITIES) {
            for (let seed = 0; seed < 8; seed++) {
              const text = composeComment(
                {
                  ...input,
                  pronoun: pronoun.value,
                  focus: focus.value,
                  subject: 'Khoa học',
                  study: study.value,
                  quality: quality.value,
                },
                seed,
              );
              expect(text).not.toMatch(/[{}]|undefined/);
              expect(text.length).toBeLessThan(MAX_COMMENT / 2);
            }
          }
        }
      }
    }
  });

  it('cùng seed ra cùng câu', () => {
    expect(composeComment(input, 7)).toBe(composeComment(input, 7));
    const many = new Set(Array.from({ length: 50 }, (_, i) => composeComment(input, i)));
    expect(many.size).toBeGreaterThan(30);
  });

  it('xưng hô theo lựa chọn', () => {
    for (let seed = 0; seed < 100; seed++) {
      expect(composeComment({ ...input, pronoun: 'con' }, seed)).not.toMatch(
        /(^|\s)[Ee]m(?=[\s,.!]|$)/,
      );
      const named = composeComment({ ...input, pronoun: 'ten' }, seed);
      expect(named).toContain('An');
      expect(named).not.toMatch(/(^|\s)([Ee]m|[Cc]on)(?=[\s,.!]|$)/);
    }
    expect(givenName('  Trần   Bảo Ngọc ')).toBe('Ngọc');
  });

  it('môn khác dùng tên môn đã nhập, bỏ trống thì vẫn thành câu', () => {
    const subject = composeComment({ ...input, focus: 'khac', subject: 'Tin học' }, 1);
    expect(subject).toContain('môn Tin học');
    expect(composeComment({ ...input, focus: 'khac' }, 1)).toContain('môn học');
  });
});

describe('dòng của cả lớp', () => {
  const students = parseStudents('Lê An\nPhạm Bình\nLê An');
  const settings = resolve(DEFAULTS);
  const keys = ['1|Lê An|0', '1|Phạm Bình|0', '1|Lê An|1'];

  it('hai em trùng tên được lưu riêng', () => {
    expect(buildLines(1, students, settings).map((l) => l.key)).toEqual(keys);
  });

  it('mức riêng và lời sửa tay thay cho mặc định', () => {
    const lines = buildLines(
      1,
      students,
      resolve({
        ...DEFAULTS,
        study: 'dat',
        records: { [keys[0]!]: { study: 'chua' }, [keys[1]!]: { text: 'Tự viết.' } },
      }),
    );
    expect(lines.map((l) => l.study)).toEqual(['chua', 'dat', 'dat']);
    expect(lines[1]).toMatchObject({ comment: 'Tự viết.', edited: true });
  });

  it('viết lại ra câu khác, giữ mức, bỏ lời sửa tay', () => {
    let options: Options = { ...DEFAULTS, records: { [keys[0]!]: { quality: 'dat' } } };
    for (let i = 0; i < 30; i++) {
      const [line] = buildLines(1, students, resolve(options));
      const record = rewritten(line!, resolve(options));
      options = { ...options, records: { [keys[0]!]: record } };
      const [next] = buildLines(1, students, resolve(options));
      expect(next!.comment).not.toBe(line!.comment);
      expect(next!.quality).toBe('dat');
      expect(next!.edited).toBe(false);
    }
  });

  it('dữ liệu lưu hỏng không làm hỏng công cụ', () => {
    const broken = resolve({
      ...DEFAULTS,
      records: { [keys[0]!]: { study: 'x', revision: 'y' } } as never,
      pronoun: 'x' as never,
    });
    expect(buildLines(1, students, broken)[0]).toMatchObject({ study: 'tot', revision: 0 });
    expect(resolve({ ...DEFAULTS, records: null as never }).records).toEqual({});
  });
});

describe('xuất bảng', () => {
  const lines = buildLines(
    1,
    parseStudents('Lê An'),
    resolve({ ...DEFAULTS, records: { '1|Lê An|0': { text: '=1+1 "tốt",\nrất ngoan' } } }),
  );

  it('CSV có BOM, bọc ngoặc kép và chặn công thức', () => {
    const csv = toCsv(lines);
    expect(csv.startsWith('﻿"STT","Họ và tên"')).toBe(true);
    expect(csv).toContain('"\'=1+1 ""tốt"", rất ngoan"');
  });

  it('bảng có tên mức bằng chữ', () => {
    expect(toTable(lines)[1]!.slice(0, 4)).toEqual(['1', 'Lê An', 'Hoàn thành tốt', 'Tốt']);
  });
});

describe('chia trang', () => {
  it('đếm dư số dòng khi chữ xuống dòng', () => {
    expect(wrappedLines('', 96)).toBe(1);
    expect(wrappedLines('a\nb\nc', 96)).toBe(3);
    expect(wrappedLines('x'.repeat(100), 96)).toBeGreaterThanOrEqual(3);
  });

  it('không bao giờ đếm thiếu so với độ rộng thật của font', () => {
    const font = fontkit.create(
      readFileSync(
        createRequire(import.meta.url).resolve(
          '@expo-google-fonts/be-vietnam-pro/400Regular/BeVietnamPro_400Regular.ttf',
        ),
      ),
    );
    const mm = (text: string) =>
      (font.layout(text, { liga: false, kern: false }).advanceWidth / font.unitsPerEm) *
      11 *
      (25.4 / 72);
    /** Số dòng khi xếp từ theo độ rộng thật. */
    const measured = (text: string, room: number) => {
      let lines = 1;
      let line = '';
      for (const word of text.split(' ')) {
        const joined = line ? `${line} ${word}` : word;
        if (mm(joined) <= room) {
          line = joined;
          continue;
        }
        if (line) lines++;
        line = '';
        for (const char of word) {
          if (line && mm(line + char) > room) {
            lines++;
            line = '';
          }
          line += char;
        }
      }
      return lines;
    };
    const rng = createRng(1);
    const alphabets = [
      'aăâbcdđeêghiklmnoôơpqrstuưvxyáàảãạếềểễệ',
      'AĂÂBCDĐEÊGHIKLMNOÔƠPQRSTUƯVXY',
      'mwMW@%—0123456789',
      'abc.,;:!?()-“”"\'',
    ];
    const comments = allSentences.map((s) => s.replace(/\{[^}]+\}/g, 'Nghiêng'));
    for (let i = 0; i < 400; i++) {
      const letters = rng.pick(alphabets);
      const text =
        i < comments.length
          ? comments.slice(i, i + 3).join(' ')
          : Array.from({ length: rng.int(1, 40) }, () =>
              Array.from({ length: rng.int(1, rng.int(1, 30)) }, () => rng.pick([...letters])).join(
                '',
              ),
            ).join(' ');
      for (const width of [COLUMNS[1], COLUMNS[4]]) {
        // Ô chừa lề trong 1,2 mm mỗi bên và đường kẻ.
        expect(wrappedLines(text, width), text).toBeGreaterThanOrEqual(
          measured(text, width - 2.6),
        );
      }
    }
  });

  it('80 em: đủ dòng, không trang nào quá chiều cao, mỗi ô đủ chỗ', () => {
    const students = parseStudents(
      Array.from({ length: 80 }, (_, i) => `Nguyễn Hoàng Bảo Ngọc Anh ${i}`).join('\n'),
    );
    const lines = buildLines(1, students, resolve(DEFAULTS));
    const { pages, space } = paginateLines(lines, 'Nhận xét học sinh', 'Trường A');
    expect(pages.flat()).toHaveLength(80);
    for (const page of pages) {
      expect(page.reduce((sum, row) => sum + row.height, 0)).toBeLessThanOrEqual(space);
    }
    for (const row of pages.flat()) {
      expect(row.height).toBeGreaterThanOrEqual(
        wrappedLines(row.line.comment, COLUMNS[4]) * LINE_MM,
      );
    }
  });
});
