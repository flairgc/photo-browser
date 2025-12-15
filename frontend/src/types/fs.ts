import type { DirItem } from './api.ts';

export type DirItemWithIndex = DirItem & {
  index?: number;
};