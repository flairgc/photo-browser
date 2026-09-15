import path from 'node:path';
import { createPreviewViewImage } from './image.service.js';
import { storage } from './storageInstance.js';
import { isCachePath } from './imageCache.js';
import { logWithTime } from '../utils/logWithTime.js';

export async function warmupImageCache(root: string, sizes: Array<'small' | 'big'> = ['small'], signal?: AbortSignal) {
  logWithTime('Image cache warmup started');
  let totalImages = 0;
  let failures = 0;
  async function walk(dir: string) {
    if (signal?.aborted) return;
    logWithTime(`Scanning folder: ${dir || '/'}`);
    for (const entry of await storage.list(dir)) {
      if (signal?.aborted) return;
      const relativePath = path.posix.join(dir, entry.name);
      if (isCachePath(relativePath)) continue;
      if (entry.isDirectory()) { await walk(relativePath); continue; }
      if (!entry.isFile() || !/\.(jpe?g|png|webp|gif)$/i.test(entry.name)) continue;
      for (const size of sizes) {
        try { await createPreviewViewImage(root, { relativePath, size }); }
        catch (error) { failures++; logWithTime('Failed to cache', relativePath, size, error); }
      }
      totalImages++;
    }
  }
  await walk('');
  if (signal?.aborted) return { totalImages, failures };
  logWithTime(`Image cache warmup finished. Images: ${totalImages}; failures: ${failures}`);
  if (failures) throw new Error(`Failed to generate ${failures} previews`);
  return { totalImages, failures };
}
