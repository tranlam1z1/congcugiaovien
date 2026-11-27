import { describe, expect, it } from 'vitest';
import { createRng } from '@/core/rng';
import {
  formatTime,
  keepKnown,
  lightOf,
  noiseLevel,
  pickIndex,
  remaining,
  rms,
  secondsLeft,
  shuffled,
  smooth,
  spinTo,
  tick,
  toggle,
  wheelLabel,
  type Timer,
} from './logic';
import { DEFAULTS, drawItems, MAX_DRAW_ITEMS, toOptions } from './options';

describe('gọi không lặp', () => {
  it('1.000 lượt: mỗi mục đúng một lần cho tới khi hết', () => {
    const rng = createRng(1);
    for (let run = 0; run < 1000; run++) {
      // Có cả tên trùng nhau.
      const names = Array.from({ length: rng.int(1, 12) }, () => `Em ${rng.int(1, 8)}`);
      const called: string[] = [];
      let waiting = remaining(names, called);
      while (waiting.length) {
        called.push(waiting[pickIndex(waiting.length, rng.next)]!);
        expect(waiting.length - remaining(names, called).length).toBe(1);
        waiting = remaining(names, called);
      }
      expect([...called].sort()).toEqual([...names].sort());
    }
  });

  it('chọn đều giữa các mục', () => {
    const rng = createRng(2);
    const counts = [0, 0, 0, 0, 0];
    for (let i = 0; i < 50000; i++) counts[pickIndex(5, rng.next)]!++;
    for (const count of counts) expect(Math.abs(count - 10000)).toBeLessThan(500);
    expect(pickIndex(5, () => 0.999999999)).toBe(4);
  });

  it('bỏ khỏi lịch sử tên đã xoá khỏi danh sách', () => {
    expect(keepKnown(['An', 'Bi'], ['Cu', 'An', 'An'], true)).toEqual(['An']);
    expect(keepKnown(['An', 'Bi'], ['Cu', 'An', 'An'], false)).toEqual(['An', 'An']);
  });

  it('xáo đủ mọi mục', () => {
    const items = ['1', '2', '3', '4', '5'];
    expect([...shuffled(items, createRng(3).next)].sort()).toEqual(items);
  });
});

describe('vòng quay', () => {
  it('luôn dừng đúng ô dưới kim và quay tiếp về phía trước', () => {
    const rng = createRng(4);
    let rotation = 0;
    for (let i = 0; i < 1000; i++) {
      const count = rng.int(1, 80);
      const index = rng.int(0, count - 1);
      const next = spinTo(rotation, index, count, rng.next() * 0.7 - 0.35);
      expect(next - rotation).toBeGreaterThanOrEqual(5 * 360);
      // Góc (trên vòng chưa quay) đang nằm dưới kim.
      const under = (((-next % 360) + 360) % 360) / (360 / count);
      expect(Math.floor(under)).toBe(index);
      rotation = next;
    }
  });

  it('rút gọn tên dài', () => {
    expect(wheelLabel('Lê An')).toBe('Lê An');
    expect(wheelLabel('Nguyễn Thị Phương Thương')).toBe('Phương Thương');
    expect(wheelLabel('Abcdefghijklmnopqrst')).toHaveLength(14);
  });
});

describe('đếm ngược', () => {
  const idle: Timer = { status: 'idle' };

  it('bắt đầu, tạm dừng, chạy tiếp rồi hết giờ', () => {
    let timer = toggle(idle, 1000, 60_000);
    expect(secondsLeft(timer, 1000, 60_000)).toBe(60);
    expect(secondsLeft(timer, 1100, 60_000)).toBe(60);
    expect(secondsLeft(timer, 31_000, 60_000)).toBe(30);
    timer = toggle(timer, 31_000, 60_000);
    // Tạm dừng thì thời gian đứng yên.
    expect(secondsLeft(timer, 999_000, 60_000)).toBe(30);
    timer = toggle(timer, 100_000, 60_000);
    expect(tick(timer, 129_999)).toBe(timer);
    expect(tick(timer, 130_000)).toEqual({ status: 'done' });
  });

  it('hết giờ thì bấm lại chạy từ đầu; thời lượng 0 không chạy', () => {
    expect(toggle({ status: 'done' }, 5, 1000)).toEqual({ status: 'running', endAt: 1005 });
    expect(toggle(idle, 5, 0)).toBe(idle);
    expect(toggle({ status: 'running', endAt: 10 }, 20, 1000)).toEqual({ status: 'done' });
  });

  it('hiển thị phút:giây', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(10800)).toBe('180:00');
  });
});

describe('tiếng ồn', () => {
  it('im lặng là 0, càng to hoặc càng nhạy thì mức càng cao', () => {
    expect(rms(new Float32Array(10))).toBe(0);
    expect(rms([0.5, -0.5])).toBe(0.5);
    expect(noiseLevel(0, 100)).toBe(0);
    expect(noiseLevel(1, 50)).toBe(100);
    expect(noiseLevel(0.05, 50)).toBeGreaterThan(noiseLevel(0.01, 50));
    expect(noiseLevel(0.01, 90)).toBeGreaterThan(noiseLevel(0.01, 20));
  });

  it('đổi đèn theo mức, lên nhanh xuống chậm', () => {
    expect([lightOf(0), lightOf(40), lightOf(70)]).toEqual(['green', 'yellow', 'red']);
    expect(smooth(0, 100)).toBe(50);
    expect(smooth(100, 0)).toBe(90);
  });
});

describe('tùy chọn', () => {
  it('ép dữ liệu hỏng về hợp lệ', () => {
    const options = toOptions({
      tab: 'x',
      minutes: 999,
      seconds: -3,
      maxNumber: 'abc',
      called: { 1: ['An', 5], 2: 'x' },
      drawn: 'x',
    });
    expect(options).toMatchObject({
      tab: 'vong-quay',
      minutes: 180,
      seconds: 0,
      maxNumber: 10,
      called: { 1: ['An'], 2: [] },
      drawn: [],
    });
  });

  it('mục bốc thăm từ dãy số hoặc danh sách', () => {
    expect(drawItems({ ...DEFAULTS, maxNumber: 3 })).toEqual(['1', '2', '3']);
    expect(drawItems({ ...DEFAULTS, source: 'danh-sach', items: ' Tổ 1 \n\nTổ  2' })).toEqual([
      'Tổ 1',
      'Tổ 2',
    ]);
    const many = Array(500).fill('x').join('\n');
    expect(drawItems({ ...DEFAULTS, source: 'danh-sach', items: many })).toHaveLength(
      MAX_DRAW_ITEMS,
    );
  });
});
