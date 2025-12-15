export type DirItemType = 'file' | 'directory' | 'image';

export interface DirItem {
  name: string;
  path: string;
  rawPath: string | null;
  type: DirItemType;
  exifText: string | null;
}

export interface Breadcrumb {
  name: string;
  path: string;
}

export interface DirResponse {
  content: DirItem[];
  breadcrumbs: Breadcrumb[];
}