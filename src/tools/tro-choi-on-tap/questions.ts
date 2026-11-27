/** Đọc bộ câu hỏi giáo viên nhập. */

export type Question =
  | { type: 'choice'; text: string; options: { letter: string; text: string }[]; correct: string[] }
  | { type: 'short'; text: string; answer: string };

export const MAX_QUESTIONS = 60;

export const SAMPLE = `Câu 1. Thủ đô của Việt Nam là thành phố nào?
A. Huế
*B. Hà Nội
C. Đà Nẵng
D. Cần Thơ

Câu 2. 7 × 8 bằng bao nhiêu?
A. 54
B. 48
C. 56
D. 64
Đáp án: C

Câu 3. Số nào là số chẵn?
*A. 14
B. 27
*C. 30
D. 45

Một tuần có mấy ngày? | 7 ngày

Từ trái nghĩa với "cao" là gì? | thấp

Mặt trời mọc ở hướng nào? | Hướng đông`;

/** Phương án: "A. nội dung", dấu * đứng trước là đáp án đúng. */
const OPTION = /^(\*\s*)?([A-D])\s*[.):]\s*(.+)$/;
const ANSWER = /^đáp án(?:\s+đúng)?\s*[:：]\s*(.*)$/i;
const NUMBER = /^câu\s*\d+\s*[.:)]\s*/i;

const short = (text: string) => (text.length > 30 ? `${text.slice(0, 30)}…` : text);

export function parseQuestions(source: string) {
  const questions: Question[] = [];
  const errors: string[] = [];
  const blocks = source
    .normalize('NFC')
    .replace(/\r/g, '')
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean),
    )
    .filter((lines) => lines.length > 0);

  const fail = (line: string, reason: string) => errors.push(`“${short(line)}”: ${reason}`);

  for (const lines of blocks) {
    const first = lines.findIndex((line) => OPTION.test(line));

    if (first < 0) {
      // Mỗi dòng "Câu hỏi | Đáp án" là một câu trả lời ngắn.
      if (lines.every((line) => line.includes('|'))) {
        for (const line of lines) {
          const at = line.indexOf('|');
          const text = line.slice(0, at).replace(NUMBER, '').trim();
          const answer = line.slice(at + 1).trim();
          if (text && answer) questions.push({ type: 'short', text, answer });
          else fail(line, 'thiếu câu hỏi hoặc đáp án ở một bên dấu |');
        }
        continue;
      }
      const answer = lines.map((line) => ANSWER.exec(line)?.[1]?.trim()).find(Boolean);
      const text = lines
        .filter((line) => !ANSWER.test(line))
        .join(' ')
        .replace(NUMBER, '')
        .trim();
      if (answer && text) questions.push({ type: 'short', text, answer });
      else fail(lines[0]!, 'chưa có đáp án');
      continue;
    }

    const text = lines.slice(0, first).join(' ').replace(NUMBER, '').trim();
    const options: { letter: string; text: string }[] = [];
    const correct = new Set<string>();
    for (const line of lines.slice(first)) {
      const option = OPTION.exec(line);
      const answer = ANSWER.exec(line);
      if (option) {
        const [, star, letter, content] = option;
        options.push({ letter: letter!, text: content!.trim() });
        if (star) correct.add(letter!);
      } else if (answer) {
        // "Đáp án: B" hoặc "Đáp án: A, C".
        for (const letter of answer[1]!.toUpperCase().match(/\b[A-D]\b/g) ?? []) {
          correct.add(letter);
        }
      } else {
        // Dòng nối tiếp của phương án ngay trên.
        options[options.length - 1]!.text += ` ${line}`;
      }
    }
    const letters = options.map((o) => o.letter);
    if (!text) fail(lines[0]!, 'thiếu câu hỏi phía trên các phương án');
    else if (options.length < 2) fail(text, 'cần ít nhất hai phương án');
    else if (new Set(letters).size !== letters.length) fail(text, 'có hai phương án trùng chữ cái');
    else if (correct.size === 0) fail(text, 'chưa đánh dấu đáp án đúng bằng * hoặc dòng “Đáp án”');
    else if ([...correct].some((letter) => !letters.includes(letter))) {
      fail(text, 'đáp án không khớp phương án nào');
    } else {
      questions.push({ type: 'choice', text, options, correct: [...correct].sort() });
    }
  }

  return { questions: questions.slice(0, MAX_QUESTIONS), errors, total: questions.length };
}

export const answerText = (question: Question) =>
  question.type === 'short'
    ? question.answer
    : question.options
        .filter((o) => question.correct.includes(o.letter))
        .map((o) => `${o.letter}. ${o.text}`)
        .join(' · ');
