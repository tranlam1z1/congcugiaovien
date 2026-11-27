/** Luật chơi "Hộp quà bí mật" và tiến độ "Rung chuông vàng": logic thuần. */
import { createRng } from '@/core/rng';

export type Box = { kind: 'question'; question: number } | { kind: 'surprise'; delta: number };

export type GiftGame = {
  /** Câu hỏi và cài đặt lúc tạo ván; khác đi thì ván cũ bỏ. */
  signature: string;
  boxes: Box[];
  opened: number[];
  scores: number[];
  /** Đội đang tới lượt. */
  turn: number;
  /** Hộp đang mở. */
  current: number | null;
};

export const SURPRISES = [5, 10, 20, -5, -10];

export function newGiftGame(
  signature: string,
  questions: number,
  surprises: number,
  teams: number,
  seed: number,
): GiftGame {
  const rng = createRng(seed);
  const boxes: Box[] = [
    ...Array.from({ length: questions }, (_, question): Box => ({ kind: 'question', question })),
    // Hộp bất ngờ luân phiên cộng và trừ điểm.
    ...Array.from({ length: surprises }, (_, i): Box => {
      const pool = SURPRISES.filter((d) => (i % 2 === 0 ? d > 0 : d < 0));
      return { kind: 'surprise', delta: rng.pick(pool) };
    }),
  ];
  return {
    signature,
    boxes: rng.shuffle(boxes),
    opened: [],
    scores: Array<number>(teams).fill(0),
    turn: 0,
    current: null,
  };
}

/** Điểm không xuống dưới 0. */
export const adjust = (game: GiftGame, team: number, delta: number): GiftGame => ({
  ...game,
  scores: game.scores.map((score, i) => (i === team ? Math.max(0, score + delta) : score)),
});

export function openBox(game: GiftGame, index: number): GiftGame {
  const box = game.boxes[index];
  if (!box || game.current !== null || game.opened.includes(index)) return game;
  const next = { ...game, current: index };
  // Hộp bất ngờ tính điểm ngay khi mở.
  return box.kind === 'surprise' ? adjust(next, game.turn, box.delta) : next;
}

/** Xong hộp đang mở: ghi điểm (nếu là câu hỏi trả lời đúng) và chuyển lượt. */
export function finishBox(game: GiftGame, correct: boolean, points: number): GiftGame {
  if (game.current === null) return game;
  const box = game.boxes[game.current]!;
  const scored = box.kind === 'question' && correct ? adjust(game, game.turn, points) : game;
  return {
    ...scored,
    opened: [...scored.opened, game.current],
    current: null,
    turn: (game.turn + 1) % game.scores.length,
  };
}

/** Đóng lại hộp câu hỏi chưa chấm. Hộp bất ngờ đã tính điểm nên không đóng lại được. */
export const closeBox = (game: GiftGame): GiftGame =>
  game.current !== null && game.boxes[game.current]!.kind === 'question'
    ? { ...game, current: null }
    : game;

export const isOver = (game: GiftGame) => game.opened.length === game.boxes.length;

/** Các đội dẫn đầu (có thể đồng hạng). */
export const winners = (scores: number[]) => {
  const best = Math.max(...scores);
  return scores.flatMap((score, i) => (score === best ? [i] : []));
};

export type BellGame = {
  signature: string;
  index: number;
  /** Học sinh đã bị loại, theo khóa riêng từng em. */
  out: string[];
};

export const newBellGame = (signature: string): BellGame => ({ signature, index: 0, out: [] });

export const toggleOut = (game: BellGame, student: string): BellGame => ({
  ...game,
  out: game.out.includes(student)
    ? game.out.filter((s) => s !== student)
    : [...game.out, student],
});
