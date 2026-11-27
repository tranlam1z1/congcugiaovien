import { describe, expect, it } from 'vitest';
import {
  adjust,
  closeBox,
  finishBox,
  isOver,
  newBellGame,
  newGiftGame,
  openBox,
  toggleOut,
  winners,
} from './game';
import { DEFAULTS, resolve } from './options';
import { answerText, MAX_QUESTIONS, parseQuestions, SAMPLE } from './questions';

describe('đọc câu hỏi', () => {
  it('đọc đủ bộ câu mẫu', () => {
    const { questions, errors } = parseQuestions(SAMPLE);
    expect(errors).toEqual([]);
    expect(questions.map((q) => q.type)).toEqual([
      'choice', 'choice', 'choice', 'short', 'short', 'short',
    ]);
    expect(questions[0]).toMatchObject({
      text: 'Thủ đô của Việt Nam là thành phố nào?',
      correct: ['B'],
    });
    expect(questions[1]).toMatchObject({ correct: ['C'] });
    expect(questions[2]).toMatchObject({ correct: ['A', 'C'] });
    expect(answerText(questions[2]!)).toBe('A. 14 · C. 30');
    expect(answerText(questions[3]!)).toBe('7 ngày');
  });

  it('nhận các cách viết thường gặp khi chép từ Word', () => {
    const { questions, errors } = parseQuestions(
      'Câu 5: Chọn câu đúng\r\ntrong các câu sau\r\nA) một\r\n* B) hai\r\nhai rưỡi\r\nĐáp án đúng: b\r\n\r\nTên em là gì?\r\nĐáp án: tuỳ ý\r\n\r\n1+1? | 2\r\n2+2? | 4',
    );
    expect(errors).toEqual([]);
    expect(questions).toHaveLength(4);
    expect(questions[0]).toMatchObject({
      text: 'Chọn câu đúng trong các câu sau',
      options: [
        { letter: 'A', text: 'một' },
        { letter: 'B', text: 'hai hai rưỡi' },
      ],
      correct: ['B'],
    });
    expect(questions[1]).toMatchObject({ type: 'short', answer: 'tuỳ ý' });
  });

  it('báo lý do cho từng chỗ chưa đọc được, vẫn giữ câu đúng', () => {
    const { questions, errors } = parseQuestions(
      [
        'Không có đáp án\nA. x\nB. y',
        'Chỉ một phương án\n*A. x',
        '*A. x\nB. y',
        'Trùng chữ\n*A. x\nA. y',
        'Đáp án lạ\nA. x\nB. y\nĐáp án: D',
        'Chẳng có gì',
        'Thiếu bên phải |',
        'Đúng | có',
      ].join('\n\n'),
    );
    expect(questions).toHaveLength(1);
    expect(errors).toHaveLength(7);
    for (const error of errors) expect(error).toMatch(/^“.+”: .+/);
  });

  it('giới hạn số câu và chịu được văn bản bất kỳ', () => {
    const many = parseQuestions('a | b\n'.repeat(MAX_QUESTIONS + 10));
    expect(many.questions).toHaveLength(MAX_QUESTIONS);
    expect(many.total).toBe(MAX_QUESTIONS + 10);
    expect(parseQuestions('').questions).toEqual([]);
    expect(() => parseQuestions('| |\n*\nA.\nĐáp án:\n\n\n***')).not.toThrow();
  });
});

describe('hộp quà bí mật', () => {
  const game = newGiftGame('x', 6, 4, 3, 1);

  it('đủ hộp câu hỏi và hộp bất ngờ, xáo theo seed', () => {
    expect(game.boxes).toHaveLength(10);
    const asked = game.boxes.flatMap((b) => (b.kind === 'question' ? [b.question] : []));
    expect(asked.sort()).toEqual([0, 1, 2, 3, 4, 5]);
    const deltas = game.boxes.flatMap((b) => (b.kind === 'surprise' ? [b.delta] : []));
    expect(deltas.filter((d) => d > 0)).toHaveLength(2);
    expect(deltas.filter((d) => d < 0)).toHaveLength(2);
    expect(newGiftGame('x', 6, 4, 3, 1)).toEqual(game);
    expect(newGiftGame('x', 6, 4, 3, 2).boxes).not.toEqual(game.boxes);
  });

  it('chơi hết ván: điểm đúng, lượt xoay vòng, không mở lại hộp', () => {
    let state = game;
    const expected = [0, 0, 0];
    for (let i = 0; i < state.boxes.length; i++) {
      const turn = i % 3;
      expect(state.turn).toBe(turn);
      state = openBox(state, i);
      expect(openBox(state, (i + 1) % 10)).toBe(state);
      const box = state.boxes[i]!;
      const correct = i % 2 === 0;
      if (box.kind === 'surprise') expected[turn] = Math.max(0, expected[turn]! + box.delta);
      else if (correct) expected[turn]! += 10;
      state = finishBox(state, correct, 10);
      expect(openBox(state, i)).toBe(state);
    }
    expect(isOver(state)).toBe(true);
    expect(state.scores).toEqual(expected);
  });

  it('đóng lại được hộp câu hỏi, không đóng được hộp bất ngờ', () => {
    const question = game.boxes.findIndex((b) => b.kind === 'question');
    const surprise = game.boxes.findIndex((b) => b.kind === 'surprise');
    expect(closeBox(openBox(game, question))).toEqual(game);
    const opened = openBox(game, surprise);
    expect(closeBox(opened)).toBe(opened);
  });

  it('điểm không âm; đội dẫn đầu có thể đồng hạng', () => {
    expect(adjust(game, 1, -100).scores).toEqual([0, 0, 0]);
    expect(winners([10, 30, 30])).toEqual([1, 2]);
  });
});

describe('rung chuông vàng và tùy chọn', () => {
  it('loại rồi cho vào lại', () => {
    const game = toggleOut(newBellGame('x'), 'a');
    expect(game.out).toEqual(['a']);
    expect(toggleOut(game, 'a').out).toEqual([]);
  });

  it('tên đội mặc định; giá trị sai được ép về hợp lệ', () => {
    const settings = resolve({ ...DEFAULTS, teams: 99, teamNames: 'Hổ\n\nSóc', seconds: 0 });
    expect(settings.teams).toBe(8);
    expect(settings.teamNames.slice(0, 4)).toEqual(['Hổ', 'Đội 2', 'Sóc', 'Đội 4']);
    expect(settings.seconds).toBe(3);
  });
});
