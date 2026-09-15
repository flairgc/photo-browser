import { env } from '../config/env.js';
import { storage } from '../services/storageInstance.js';
import { warmupImageCache } from '../services/imageCacheWarmup.service.js';

try {
  await warmupImageCache(env.FS_ROOT, process.argv.includes('--all-sizes') ? ['small', 'big'] : ['small']);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await storage.close();
}
