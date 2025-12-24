export type DirItemType = 'file' | 'directory' | 'image';

export interface DirItem {
  name: string;
  path: string;
  rawPath: string | null;
  type: DirItemType;
  fullSize?: boolean; // это фронтовая переменная, нужно будет перенести ее из этого файла в отдельный тип
}

export interface Breadcrumb {
  name: string;
  path: string;
}

export interface DirResponse {
  content: DirItem[];
  breadcrumbs: Breadcrumb[];
}