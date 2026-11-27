/** Xếp thẻ nhóm lên trang in. */
import type { PrintFont } from '@/core/print/fonts';
import {
  DEFAULT_MARGIN_MM,
  MM_PER_PX,
  packByHeight,
  paginate,
} from '@/core/print/paper';
import type { Group } from './group';

export const GAP_MM = 5;
/** [chữ thường, chữ to] */
const FONT_PT = [13, 17];
export const LINE_MM = [7.5, 9.5];
/** Tên nhóm, đường kẻ và lề trong thẻ. */
export const CARD_EXTRA_MM = [14, 17];
/** Trường lớp, tiêu đề tối đa ba dòng (tiêu đề giới hạn 60 ký tự, thêm "(tiếp theo)"). */
const HEADER_MM = [44, 56];
const HEADER_MM_PER_LEADING = 50;
const CARD_PADDING_MM = 8;

export type Style = { font: PrintFont; large: boolean };
export type Page = { width: number; height: number };
export type Card = Group & {
  title: string;
  /** Số thứ tự của thành viên đầu tiên trong nhóm. */
  start: number;
  /** Khóa duy nhất, kể cả khi hai nhóm trùng tên hay một nhóm tách nhiều thẻ. */
  key: string;
};

const lineHeight = ({ font, large }: Style) => LINE_MM[large ? 1 : 0]! * (font.leading ?? 1);

/** Số cột sao cho tên dài nhất nằm trên một dòng. */
export function columnsFor(longestName: number, page: Page, style: Style) {
  const em = ((FONT_PT[style.large ? 1 : 0]! * 96) / 72) * MM_PER_PX;
  // Thêm chỗ cho số thứ tự.
  const card = (longestName + 4) * style.font.digitWidth * 0.95 * em + CARD_PADDING_MM;
  const width = page.width - 2 * DEFAULT_MARGIN_MM;
  const most = page.width > page.height ? 4 : 3;
  return Math.max(1, Math.min(most, Math.floor((width + GAP_MM) / (card + GAP_MM))));
}

function available(page: Page, style: Style) {
  const header =
    HEADER_MM[style.large ? 1 : 0]! + ((style.font.leading ?? 1) - 1) * HEADER_MM_PER_LEADING;
  return page.height - 2 * DEFAULT_MARGIN_MM - header;
}

export const cardHeight = (members: number, style: Style) =>
  CARD_EXTRA_MM[style.large ? 1 : 0]! * (style.font.leading ?? 1) + members * lineHeight(style);

/** Trang → hàng → thẻ. Nhóm quá đông được tách thành nhiều thẻ "(tiếp)". */
export function layoutGroups(groups: Group[], columns: number, page: Page, style: Style) {
  const room = available(page, style);
  const maxMembers = Math.max(1, Math.floor((room - GAP_MM - cardHeight(0, style)) / lineHeight(style)));
  const cards: Card[] = groups.flatMap((group, index) =>
    paginate(group.members, maxMembers).map((members, part) => ({
      ...group,
      members,
      start: part * maxMembers,
      key: `${index}-${part}`,
      title: part ? `${group.name} (tiếp)` : group.name,
    })),
  );
  return packByHeight(
    paginate(cards, columns),
    (row) => Math.max(...row.map((c) => cardHeight(c.members.length, style))) + GAP_MM,
    room,
  );
}
