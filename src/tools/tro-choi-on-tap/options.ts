/** Tùy chọn của trò chơi và cách ép giá trị đã lưu về hợp lệ. */
import { SAMPLE } from './questions';

export const TABS = [
  { id: 'hop-qua', label: 'Hộp quà bí mật' },
  { id: 'chuong-vang', label: 'Rung chuông vàng' },
] as const;
export type Tab = (typeof TABS)[number]['id'];

export const MAX_TEAMS = 8;
export const MAX_SURPRISES = 8;

export const DEFAULTS = {
  tab: 'hop-qua' as Tab,
  text: SAMPLE,
  teams: 4,
  /** Mỗi dòng một tên đội, bỏ trống thì "Đội 1"... */
  teamNames: '',
  points: 10,
  surprises: 2,
  seconds: 15,
  sound: true,
  /** Đổi để xáo lại hộp. */
  seed: 100001,
};

export type Options = typeof DEFAULTS;

const within = (value: number, min: number, max: number, fallback: number) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback;

export function resolve(options: Options) {
  const teams = within(options.teams, 1, MAX_TEAMS, DEFAULTS.teams);
  const names = String(options.teamNames).split(/\r?\n/);
  return {
    tab: TABS.some((t) => t.id === options.tab) ? options.tab : DEFAULTS.tab,
    teams,
    teamNames: Array.from(
      { length: teams },
      (_, i) => names[i]?.trim().slice(0, 30) || `Đội ${i + 1}`,
    ),
    points: within(options.points, 1, 1000, DEFAULTS.points),
    surprises: within(options.surprises, 0, MAX_SURPRISES, DEFAULTS.surprises),
    seconds: within(options.seconds, 3, 600, DEFAULTS.seconds),
    sound: Boolean(options.sound),
    seed: Number.isFinite(options.seed) ? options.seed : DEFAULTS.seed,
  };
}

export type Settings = ReturnType<typeof resolve>;
