import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const CACHE_DIR = path.resolve(process.cwd(), '.cache');

async function ensureCacheDir() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

function getCacheFilePath(key: string) {
  const hash = crypto.createHash('sha1').update(key).digest('hex');
  return path.join(CACHE_DIR, `${hash}.bin`);
}

export async function getFromCache(key: string): Promise<Buffer | undefined> {
  try {
    await ensureCacheDir();

    const filePath = getCacheFilePath(key);
    console.log('filePath', filePath)
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
