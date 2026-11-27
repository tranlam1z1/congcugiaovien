import type { PrintFontId } from '@/core/print/fonts';
import type { Orientation } from '@/core/print/paper';
import type { By } from './group';

export const DEFAULTS = {
  by: 'groups' as By,
  groupTotal: 4,
  groupSize: 4,
  balance: false,
  pickLeader: true,
  /** Mỗi dòng một cặp không ngồi chung. */
  avoid: '',
  names: '',
  title: '',
  school: '',
  orientation: 'portrait' as Orientation,
  font: 'be-vietnam-pro' as PrintFontId,
  largeText: false,
  seed: 100001,
};

export type Options = typeof DEFAULTS;
