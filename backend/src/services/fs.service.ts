import { storage } from './storageInstance.js';
import { isCachePath } from './imageCache.js';
// import path from 'path';
import { normalizeRelativePath } from '../utils/safePath.js';

export interface FsItem {
  name: string;
  path: string;
  type: 'file' | 'directory' | 'image';
  rawPath: string | null;
}

export interface Breadcrumb {
    name: string;
    path: string;
}

function buildBreadcrumbs(relativePath: string) {
    if (!relativePath) {
        return [];
    }

    const normalizedPath = relativePath.replace(/\\/g, '/');

    const parts = normalizedPath.split('/').filter(Boolean);

    let accPath = '';

    return parts.map((part) => {
        accPath = accPath ? `${accPath}/${part}` : part;

        return {
            name: part,
            path: accPath,
        };
    });
}


export async function getDirectoryStructure(
  _root: string,
  { relativePath, onlyImages }: { relativePath: string, onlyImages: boolean }
): Promise<{
  content: FsItem[],
  breadcrumbs: Breadcrumb[],
}> {
  const rawRelativePath = relativePath ?? '';
  const normalizedRelativePath = normalizeRelativePath(rawRelativePath);


  const entries = (await storage.list(normalizedRelativePath)).filter(entry =>
    !isCachePath([normalizedRelativePath, entry.name].filter(Boolean).join('/')));

  // 1️⃣ Собираем все RAW-файлы в этой папке
  const rawFiles = new Map(
    entries
      .filter(e => e.isFile() && /\.arw$/i.test(e.name))
      .map(e => [e.name.toLowerCase(), e.name])
  );

  const content = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = normalizedRelativePath
        ? `${normalizedRelativePath}/${entry.name}`
        : entry.name;

      const isImage =
        entry.isFile() && /\.(jpe?g|png|webp|gif)$/i.test(entry.name);

      const type: FsItem['type'] =
        entry.isDirectory() ? 'directory' : isImage ? 'image' : 'file';

      let rawPath: string | null = null;

      if (isImage) {
        const baseName = entry.name.replace(/\.[^.]+$/, '');
        const rawName = `${baseName}.ARW`;

        if (rawFiles.has(rawName.toLowerCase())) {
          rawPath = normalizedRelativePath
            ? `${normalizedRelativePath}/${rawFiles.get(rawName.toLowerCase())}`
            : rawFiles.get(rawName.toLowerCase())!;
        }
      }

      return {
        name: entry.name,
        path: entryPath,
        rawPath,
        type,
      };
    })
  );


  const breadcrumbs = buildBreadcrumbs(normalizedRelativePath);

  const filteredContent = onlyImages
    ? content.filter(item => item.type === 'image' || item.type === 'directory')
    : content;

  return {
    breadcrumbs,
    content: filteredContent,
  };
}
