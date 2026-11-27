/** Ghép lời nhận xét: cùng đầu vào và cùng seed luôn ra cùng một câu. */
import { createRng } from '@/core/rng';
import { ADVICE, BODIES, OPENINGS, type Focus, type Quality, type Study } from './bank';

export type Pronoun = 'em' | 'con' | 'ten';

export type CommentInput = {
  /** Họ tên đầy đủ. */
  name: string;
  pronoun: Pronoun;
  focus: Focus;
  /** Tên môn khi trọng tâm là "Môn khác". */
  subject: string;
  study: Study;
  quality: Quality;
};

/** Tên gọi là tiếng cuối cùng của họ tên. */
export const givenName = (name: string) => name.trim().split(/\s+/).at(-1) ?? '';

export function hashText(text: string) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  }
  return hash >>> 0;
}

export function composeComment(input: CommentInput, seed: number) {
  const { name, pronoun, focus, study, quality } = input;
  const rng = createRng(seed);
  const called = pronoun === 'ten' ? givenName(name) : '';
  const upper = called || (pronoun === 'con' ? 'Con' : 'Em');
  const lower = called || (pronoun === 'con' ? 'con' : 'em');
  const subject = input.subject.trim() || 'học';
  return [
    rng.pick(OPENINGS[quality]),
    rng.pick(BODIES[focus][study]),
    rng.pick(ADVICE[study]),
  ]
    .join(' ')
    .replace(/\{X\}/g, () => upper)
    .replace(/\{x\}/g, () => lower)
    .replace(/\{môn\}/g, () => subject);
}
