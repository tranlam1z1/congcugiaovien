/** Tiếng chuông tạo bằng Web Audio, không cần file âm thanh. */
let context: AudioContext | null = null;

/**
 * Gọi trong lúc người dùng bấm nút: trình duyệt chỉ cho phát tiếng sau một thao tác,
 * còn chuông hết giờ kêu lúc không ai bấm gì.
 */
export function unlockSound() {
  try {
    context ??= new AudioContext();
    void context.resume();
  } catch {
    // Máy không phát được tiếng thì vẫn đếm giờ bình thường.
  }
}

/** Ba hồi chuông. */
export function ring() {
  if (!context) return;
  const start = context.currentTime;
  for (let i = 0; i < 3; i++) {
    for (const frequency of [880, 1320]) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const at = start + i * 0.6;
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.25, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(at);
      oscillator.stop(at + 0.55);
    }
  }
}
