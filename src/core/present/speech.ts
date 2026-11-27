/** Đọc to bằng giọng có sẵn trên máy (Web Speech API). */

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

export function speak(text: string, lang = 'en-GB') {
  if (!canSpeak()) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.85;
  // Ưu tiên giọng đúng vùng, không có thì giọng cùng ngôn ngữ.
  const voices = window.speechSynthesis.getVoices();
  const voice =
    voices.find((v) => v.lang === lang) ??
    voices.find((v) => v.lang.startsWith(lang.slice(0, 2)));
  if (voice) utterance.voice = voice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
