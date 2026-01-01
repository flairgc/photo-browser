export type DirItemType = 'file' | 'directory' | 'image';

export interface DirItemDto {
  name: string;
  path: string;
  rawPath: string | null;
  type: DirItemType;
}

export interface BreadcrumbDto {
  name: string;
  path: string;
}

export interface DirResponse {
  content: DirItemDto[];
  breadcrumbs: BreadcrumbDto[];
}