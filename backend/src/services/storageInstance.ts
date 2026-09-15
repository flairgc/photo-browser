import { env } from '../config/env.js';
import { LocalStorage, type Storage } from './storage.js';
import { NasStorage } from './nasStorage.js';

export const storage: Storage = env.DATA_SOURCE === 'local' ? new LocalStorage(env.FS_ROOT) : new NasStorage({
  host: env.NAS_HOST, share: env.NAS_SHARE, path: env.NAS_PATH,
  username: env.NAS_USERNAME, password: env.NAS_PASSWORD, domain: env.NAS_DOMAIN, port: env.NAS_PORT,
});
