/** Mẫu chữ và gói từ vựng cho phiếu tập viết. */
import { VOCAB } from '@/core/vocab/packs';

const lines = (text: string) => text.split(' ').join('\n');
const LETTERS = [...'abcdefghijklmnopqrstuvwxyz'];

export const SAMPLES = [
  { label: 'a – z', text: LETTERS.join('\n') },
  { label: 'A – Z', text: LETTERS.join('\n').toUpperCase() },
  { label: 'Aa – Zz', text: LETTERS.map((c) => c.toUpperCase() + c).join('\n') },
  { label: '0 – 9', text: lines('0 1 2 3 4 5 6 7 8 9') },
  {
    label: 'Câu mẫu',
    text: [
      'Hello, my name is Lan.',
      'This is my school bag.',
      'I like apples and bananas.',
      "What's your name?",
      'It is sunny today.',
    ].join('\n'),
  },
] as const;

export const PACKS = VOCAB.map(({ id, label, entries }) => ({
  id,
  label,
  text: entries.map((entry) => entry.word).join('\n'),
}));
