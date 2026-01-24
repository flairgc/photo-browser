import fs from 'fs/promises';
import path from 'path';
import { createPreviewViewImage } from './image.service.js';
import { logWithTime } from '../utils/logWithTime.js';

const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

export async function warmupImageCache(
  root: string,
  sizes: Array<'small' | 'big'> = ['small'],
) {
  logWithTime('🟡 Image cache warmup started');

  let totalImages = 0;

  async function walk(dir: string) {
    logWithTime(`📁 Scanning folder: ${path.relative(root, dir) || '/'}`);

    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (!IMAGE_EXT.test(entry.name)) continue;

      const relativePath = path.relative(root, fullPath).replace(/\\/g, '/');

      for (const size of sizes) {
        try {
          await createPreviewViewImage(root, {
            relativePath,
            size,
          });
        } catch (e) {
          logWithTime('⚠️ Failed to cache', relativePath, size, e);
        }
      }

      totalImages++;
    }

    logWithTime(`✅ Folder done: ${path.relative(root, dir) || '/'}`);
  }

  await walk(root);

  logWithTime(`🟢 Image cache warmup finished. Images processed: ${totalImages}`);
}
