import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';


export let CACHE_DIR: string | null = null;

/**
 * Инициализируем кеш один раз при старте
 */
export function initImageCache(root: string) {
  CACHE_DIR = path.join(root, '.cache_photo_browser_app');
}

function ensureInited() {
  if (!CACHE_DIR) {
    throw new Error('Image cache is not initialized');
  }
}

async function ensureCacheDir() {
  ensureInited();
  await fs.mkdir(CACHE_DIR!, { recursive: true });
}

function getCacheFilePath(key: string) {
  ensureInited();
  const hash = crypto.createHash('sha1').update(key).digest('hex');
  return path.join(CACHE_DIR!, `${hash}.bin`);
}

export async function getFromCache(key: string): Promise<Buffer | undefined> {
  try {
    await ensureCacheDir();

    const filePath = getCacheFilePath(key);
    return await fs.readFile(filePath);
  } catch {
    return undefined;
  }
}

export async function saveToCache(key: string, buffer: Buffer): Promise<void> {
  await ensureCacheDir();

  const filePath = getCacheFilePath(key);
  await fs.writeFile(filePath, buffer);
}
