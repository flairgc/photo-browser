import path from 'node:path';
import sharp from 'sharp';
import { normalizeRelativePath, resolveSafePath } from '../utils/safePath.js';
import { getFromCache, saveToCache } from './imageCache.js';
import { storage } from './storageInstance.js';
import { env } from '../config/env.js';

export async function createFileStream(_root: string, relativePath: string) {
  return storage.stream(normalizeRelativePath(relativePath));
}
const previewSizes = { small: { size: 200, quality: 75 }, big: { size: 2560, quality: 85 } };
const pending = new Map<string, Promise<Buffer>>();
export async function imageInput(relativePath: string): Promise<string | Buffer> {
  const normalized = normalizeRelativePath(relativePath);
  return env.DATA_SOURCE === 'local' ? resolveSafePath(env.FS_ROOT, normalized) : storage.read(normalized);
}
export async function createPreviewViewImage(
  _root: string,
  { relativePath, size }: { relativePath: string; size: 'small' | 'big' },
): Promise<Buffer> {
  if (size !== 'small' && size !== 'big') throw new Error('size must be small or big');
  const normalized = normalizeRelativePath(relativePath);
  const { size: sizePx, quality } = previewSizes[size];
  // Retain existing local cache keys; isolate NAS shares and subfolders.
  const sourceKey = env.DATA_SOURCE === 'local' ? path.resolve(env.FS_ROOT, normalized) : `${storage.identity}/${normalized}`;
  const key = `${sourceKey}::view-${sizePx}`;
  const existing = pending.get(key);
  if (existing) return existing;
  const job = (async () => {
    const cached = await getFromCache(key);
    if (cached) return cached;
    const buffer = await sharp(await imageInput(normalized)).rotate()
      .resize({ width: sizePx, height: sizePx, fit: 'inside', withoutEnlargement: true })
      .withMetadata().jpeg({ quality }).toBuffer();
    await saveToCache(key, buffer);
    return buffer;
  })();
  pending.set(key, job);
  try { return await job; } finally { pending.delete(key); }
}
