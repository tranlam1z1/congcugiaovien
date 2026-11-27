/** Mẫu chữ và gói từ vựng theo lớp (tự soạn, từ thông dụng). */

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

const pack = (grade: number, topic: string, words: string) => ({
  id: `${grade}-${topic.toLowerCase().replace(/\s+/g, '-')}`,
  label: `Lớp ${grade} · ${topic}`,
  text: words.split(', ').join('\n'),
});

export const PACKS = [
  pack(1, 'Animals', 'cat, dog, fish, bird, rabbit'),
  pack(1, 'Colours', 'red, blue, green, yellow, pink'),
  pack(1, 'Numbers', 'one, two, three, four, five'),
  pack(2, 'School things', 'book, pen, pencil, ruler, eraser'),
  pack(2, 'Family', 'mother, father, sister, brother, baby'),
  pack(2, 'Toys', 'ball, kite, doll, robot, drum'),
  pack(3, 'Fruit', 'apple, banana, orange, grape, cherry'),
  pack(3, 'Food and drink', 'bread, egg, milk, cake, juice'),
  pack(3, 'My body', 'head, hand, eye, ear, foot'),
  pack(4, 'Weather', 'sunny, rainy, cloudy, windy, snowy'),
  pack(4, 'Clothes', 'shirt, dress, shoes, hat, socks'),
  pack(4, 'Jobs', 'teacher, doctor, farmer, driver, nurse'),
  pack(5, 'Transport', 'car, bus, bike, train, plane'),
  pack(5, 'Places', 'school, library, hospital, market, park'),
  pack(5, 'Nature', 'tree, flower, mountain, river, rainbow'),
];
