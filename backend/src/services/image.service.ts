import fs from 'fs';
import sharp from 'sharp';
import { resolveSafePath } from '../utils/safePath.js';
import { getFromCache, saveToCache } from './imageCache.js';


export async function createFileStream(root: string, relativePath: string) {
  const fullPath = resolveSafePath(root, relativePath);
  return fs.createReadStream(fullPath);
}

const previewSizes = {
  small: 400,
  big: 2560,
}

export async function createPreviewViewImage(
  root: string,
  { relativePath, size }: { relativePath: string; size: 'small' | 'big' },
): Promise<Buffer> {
  const fullPath = resolveSafePath(root, relativePath);

  const sizePx = previewSizes[size];
  const cacheKey = `${fullPath}::view-${sizePx}`;

  const cached = await getFromCache(cacheKey);
  if (cached) {
    return cached;
  }

  const buffer = await sharp(fullPath)
    .rotate()
    .resize({
      width: sizePx,
      height: sizePx,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .withMetadata()
    .jpeg({ quality: size === 'small' ? 80 : 85 })
    .toBuffer();

  await saveToCache(cacheKey, buffer);

  return buffer;
}