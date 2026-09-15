import { buildApp } from './app.js';
import { warmupImageCache } from './services/imageCacheWarmup.service.js';
import { storage } from './services/storageInstance.js';

const app = buildApp();
const controller = new AbortController();
let warmup: Promise<unknown> | undefined;
app.addHook('onClose', async () => {
  controller.abort();
  await warmup;
  await storage.close();
});
try {
  await app.listen({ port: app.config.PORT, host: '0.0.0.0' });
  console.log(`Server started on ${app.config.PORT}; source: ${app.config.DATA_SOURCE}`);
  if (app.config.CACHE_WARMUP) {
    warmup = warmupImageCache(app.config.FS_ROOT, ['small'], controller.signal)
      .catch(error => app.log.error(error, 'Cache warmup failed'));
  }
} catch (error) {
  app.log.error(error);
  await storage.close();
  process.exitCode = 1;
}
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => { void app.close(); });
}
