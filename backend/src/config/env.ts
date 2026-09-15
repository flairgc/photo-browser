import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Works from src/config and dist/config, regardless of the working directory.
export const PROJECT_ROOT = fileURLToPath(new URL('../../../', import.meta.url));
dotenv.config({ path: path.join(PROJECT_ROOT, '.env') });

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} is required`);
  return value;
}
function port(name: string, fallback: number): number {
  const value = Number(process.env[name] || fallback);
  if (!Number.isInteger(value) || value < 1 || value > 65535) throw new Error(`${name} must be between 1 and 65535`);
  return value;
}
const source = process.env.BACKEND_DATA_SOURCE || 'local';
if (source !== 'local' && source !== 'nas') throw new Error('BACKEND_DATA_SOURCE must be local or nas');
const warmup = process.env.BACKEND_CACHE_WARMUP || 'false';
if (!['true', 'false'].includes(warmup)) throw new Error('BACKEND_CACHE_WARMUP must be true or false');
const production = process.env.NODE_ENV === 'production';
const localRoot = source === 'local'
  ? required(!production && process.env.BACKEND_FS_ROOT_DEV ? 'BACKEND_FS_ROOT_DEV' : 'BACKEND_FS_ROOT') : '';

export const env = {
  PORT: port(production ? 'BACKEND_PORT' : 'BACKEND_PORT_DEV', production ? 3001 : 3002),
  DATA_SOURCE: source,
  // Preserve the previous resolution of relative photo paths from backend/.
  FS_ROOT: path.resolve(PROJECT_ROOT, 'backend', localRoot),
  NAS_HOST: source === 'nas' ? required('BACKEND_NAS_HOST') : '',
  NAS_SHARE: source === 'nas' ? required('BACKEND_NAS_SHARE') : '',
  NAS_PATH: process.env.BACKEND_NAS_PATH || '',
  NAS_USERNAME: source === 'nas' ? required('BACKEND_NAS_USERNAME') : '',
  NAS_PASSWORD: source === 'nas' ? required('BACKEND_NAS_PASSWORD') : '',
  NAS_DOMAIN: process.env.BACKEND_NAS_DOMAIN || '',
  NAS_PORT: port('BACKEND_NAS_PORT', 445),
  CACHE_DIR: process.env.BACKEND_CACHE_DIR ? path.resolve(PROJECT_ROOT, process.env.BACKEND_CACHE_DIR) : '',
  CACHE_WARMUP: warmup === 'true',
} as const;
