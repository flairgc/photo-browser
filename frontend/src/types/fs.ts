import type { DirItemDto } from './api.ts';

export type DirItem = DirItemDto & {
  isSelected?: boolean;
  index?: number;
  fullSize?: boolean;
};