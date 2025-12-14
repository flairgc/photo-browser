export type DirItemType = 'file' | 'directory' | 'image';

export interface DirItem {
  name: string;
  path: string;
  type: DirItemType;
}

export interface Breadcrumb {
  name: string;
  path: string;
}

export interface DirResponse {
  content: DirItem[];
  breadcrumbs: Breadcrumb[];
}