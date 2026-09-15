import path from 'node:path';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { LocalStorage, type Storage } from './storage.js';
import { storage } from './storageInstance.js';

export const CACHE_FOLDER = '.cache_photo_browser_app';
const cache: Storage = env.CACHE_DIR ? new LocalStorage(env.CACHE_DIR) : storage;
const prefix = env.CACHE_DIR ? '' : CACHE_FOLDER;
let initialized: Promise<void> | undefined;

function ensureCacheDir() {
  return initialized ??= cache.mkdir(prefix).catch(error => { initialized = undefined; throw error; });
}
function cachePath(key: string) {
  return path.posix.join(prefix, `${crypto.createHash('sha1').update(key).digest('hex')}.bin`);
}
export function isCachePath(relativePath: string): boolean {
  if (relativePath.split('/').includes(CACHE_FOLDER)) return true;
  if (env.DATA_SOURCE !== 'local' || !env.CACHE_DIR) return false;
  const relative = path.relative(env.CACHE_DIR, path.resolve(env.FS_ROOT, relativePath));
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}
export async function getFromCache(key: string): Promise<Buffer | undefined> {
  try { return await cache.read(cachePath(key)); }
  catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    const message = error instanceof Error ? error.message : '';
    if (code === 'ENOENT' || /STATUS_OBJECT_(NAME|PATH)_NOT_FOUND|STATUS_NO_SUCH_FILE/.test(message)) return undefined;
    throw error;
  }
}
export async function saveToCache(key: string, buffer: Buffer): Promise<void> {
  await ensureCacheDir();
  await cache.write(cachePath(key), buffer);
}
