import fs from 'fs/promises';
// import path from 'path';
import { resolveSafePath } from '../utils/safePath.js';
import { readExifText } from '../utils/readExifText.js';

export interface FsItem {
  name: string;
  path: string;
  type: 'file' | 'directory' | 'image';
  rawPath: string | null;
  exifText: string | null;
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
  root: string,
  { relativePath, onlyImages }: { relativePath: string, onlyImages: boolean }
): Promise<{
  content: FsItem[],
  breadcrumbs: Breadcrumb[],
}> {
  const rawRelativePath = relativePath ?? '';
  const normalizedRelativePath = rawRelativePath.replace(/\\/g, '/');
  const fullPath = resolveSafePath(root, normalizedRelativePath);

  const entries = await fs.readdir(fullPath, { withFileTypes: true });

  // 1️⃣ Собираем все RAW-файлы в этой папке
  const rawFiles = new Set(
    entries
      .filter(e => e.isFile() && /\.arw$/i.test(e.name))
      .map(e => e.name.toLowerCase())
  );

  const content = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = normalizedRelativePath
        ? `${normalizedRelativePath}/${entry.name}`
        : entry.name;

      const fullEntryPath = resolveSafePath(root, entryPath);

      const isJpeg =
        entry.isFile() && /\.(jpe?g)$/i.test(entry.name);

      const isImage =
        entry.isFile() && /\.(jpe?g|png|webp|gif)$/i.test(entry.name);

      const type: FsItem['type'] =
        entry.isDirectory() ? 'directory' : isImage ? 'image' : 'file';

      let rawPath: string | null = null;
      let exifText: string | null = null;

      if (isImage) {
        const baseName = entry.name.replace(/\.[^.]+$/, '');
        const rawName = `${baseName}.ARW`;

        if (rawFiles.has(rawName.toLowerCase())) {
          rawPath = normalizedRelativePath
            ? `${normalizedRelativePath}/${rawName}`
            : rawName;
        }
      }

      if (isJpeg) {
        exifText = await readExifText(fullEntryPath);
      }

      return {
        name: entry.name,
        path: entryPath,
        rawPath,
        exifText,
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

